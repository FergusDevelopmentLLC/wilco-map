const fs = require('fs');
const path = require('path');
const Jimp = require('jimp').default;
const svgToImg = require('svg-to-img');
const { Client } = require('pg');
const { SVG_TRIANGLE, SVG_SQUARE, SVG_CIRCLE, SVG_STAR_7PT } = require('./svgShapes');

// Load configuration from JSON
const config = JSON.parse(fs.readFileSync('generate_sprite_config.json', 'utf8'));

const [BASE_MAP, SPRITE_VERSION, OUTPUT_FOLDER] = process.argv.slice(2);
const SCRIPT_FOLDER = config.script.script_folder;
const INPUT_SPRITE_PNG = path.join(SCRIPT_FOLDER, `default_sprites/${BASE_MAP}/${SPRITE_VERSION}.png`);
const SCALE_FACTOR = INPUT_SPRITE_PNG.includes('@2x') ? 2 : 1;
const INPUT_SPRITE_JSON = path.join(SCRIPT_FOLDER, `default_sprites/${BASE_MAP}/${SPRITE_VERSION}.json`);
const OUTPUT_SPRITE_PNG = path.join(OUTPUT_FOLDER, `${SPRITE_VERSION}.png`);
const OUTPUT_SPRITE_JSON = path.join(OUTPUT_FOLDER, `${SPRITE_VERSION}.json`);
const LOG_FOLDER = config.log.log_folder;
const LOG_FILE = config.log.log_file;
const DB_USER = config.db.db_user;
const DB_HOST = config.db.db_host;
const DB_PORT = config.db.db_port;
const DB_NAME = config.db.db_name;
const DB_PASSWORD = config.db.db_password;

// Logging function
const logMsg = (message) => {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0]; // Format: YYYY-MM-DD HH:MM:SS
  const scriptName = path.basename(__filename); // Dynamically get the script name
  const logMessage = `${timestamp} - ${scriptName} - ${message}\n`;

  const logPath = path.join(LOG_FOLDER, LOG_FILE);
  fs.appendFile(logPath, logMessage, (err) => {
    if (err) console.error(`Failed to write log: ${err}`);
  });
  console.log(logMessage.trim()); // Also print to console
}

// Log configuration constants
// logMsg(`BASE_MAP: ${BASE_MAP}`);
// logMsg(`SPRITE_VERSION: ${SPRITE_VERSION}`);
// logMsg(`SCRIPT_FOLDER: ${SCRIPT_FOLDER}`);
// logMsg(`INPUT_SPRITE_PNG: ${INPUT_SPRITE_PNG}`);
// logMsg(`SCALE_FACTOR: ${SCALE_FACTOR}`);
// logMsg(`INPUT_SPRITE_JSON: ${INPUT_SPRITE_JSON}`);
// logMsg(`OUTPUT_FOLDER: ${OUTPUT_FOLDER}`);
// logMsg(`OUTPUT_SPRITE_PNG: ${OUTPUT_SPRITE_PNG}`);
// logMsg(`OUTPUT_SPRITE_JSON: ${OUTPUT_SPRITE_JSON}`);
// logMsg(`LOG_FOLDER: ${LOG_FOLDER}`);
// logMsg(`LOG_FILE: ${LOG_FILE}`);
// logMsg(`DB_USER: ${DB_USER}`);
// logMsg(`DB_HOST: ${DB_HOST}`);
// logMsg(`DB_PORT: ${DB_PORT}`);
// logMsg(`DB_NAME: ${DB_NAME}`);

// PostgreSQL connection using JSON configuration
const client = new Client({
  user: DB_USER,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  password: DB_PASSWORD,
});

const fetchStylesFromDatabase = async () => {
  await client.connect();
  logMsg("Connected to PostgreSQL database.");
  const res = await client.query(`
    SELECT
      sprite_ndx,
      shape,
      height,
      width,
      fill_color,
      stroke_color,
      stroke_width
    FROM ui.list_custom_sprites
  `);
  await client.end();
  logMsg("Fetched styles from database and disconnected.");
  return res.rows;
};

const generateSpriteSheet = (styles, SCALE_FACTOR, offsetY, defaultSpriteWidth, defaultSpriteHeight) => {
  let svgContent = '';
  let currentY = offsetY;
  let currentRowHeight = 0;
  let currentX = 0;
  let lastShapeType = null;
  let lastWidth = null;
  let lastHeight = null;
  const jsonMapping = {};
  const groupedStyles = styles.reduce((acc, style) => {
    acc[style.shape] = acc[style.shape] || [];
    acc[style.shape].push(style);
    return acc;
  }, {});

  const addShapes = (shapeType) => {
    if (!groupedStyles[shapeType]) return;
    groupedStyles[shapeType].forEach((style) => {
      const scaledWidth = style.width * SCALE_FACTOR;
      const scaledHeight = style.height * SCALE_FACTOR;
      if (shapeType !== lastShapeType || scaledWidth !== lastWidth || scaledHeight !== lastHeight || currentX + scaledWidth > defaultSpriteWidth) {
        if (currentRowHeight > 0) {
          currentY += currentRowHeight;
        }
        currentX = 0;
        currentRowHeight = 0;
      }
      let svgElement;
      switch (style.shape) {
        case 'circle': svgElement = SVG_CIRCLE({ ...style, width: scaledWidth, height: scaledHeight }); break;
        case 'square': svgElement = SVG_SQUARE({ ...style, width: scaledWidth, height: scaledHeight }); break;
        case 'triangle': svgElement = SVG_TRIANGLE({ ...style, width: scaledWidth, height: scaledHeight }); break;
        case 'star-7pt': svgElement = SVG_STAR_7PT({ ...style, width: scaledWidth, height: scaledHeight }); break;
        default: throw new Error(`Unknown shape type: ${style.shape}`);
      }
      svgContent += `<g transform="translate(${currentX}, ${currentY})">${svgElement}</g>`;
      jsonMapping[style.sprite_ndx] = { width: scaledWidth, height: scaledHeight, x: currentX, y: currentY + defaultSpriteHeight, pixelRatio: SCALE_FACTOR };
      currentX += scaledWidth;
      currentRowHeight = Math.max(currentRowHeight, scaledHeight);
      lastShapeType = shapeType;
      lastWidth = scaledWidth;
      lastHeight = scaledHeight;
    });
  };
  logMsg("Adding shapes...");
  ['circle', 'square', 'triangle', 'star-7pt'].forEach(addShapes);
  const totalWidth = defaultSpriteWidth;
  const totalHeight = currentY + currentRowHeight;
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">${svgContent}</svg>`;
  logMsg("Adding shapes completed.");
  return { svgString, jsonMapping, totalHeight };
};
const main = async () => {
  logMsg("Starting main process.");
  logMsg("Parsing defaultJson...");
  const defaultJson = JSON.parse(fs.readFileSync(INPUT_SPRITE_JSON, 'utf8'));
  logMsg(`Parsing of defaultJson complete.`);
  logMsg("Loading custom styles to add to sprite from database...");
  const styles = await fetchStylesFromDatabase();
  logMsg(`Custom styles successfully loaded from database.`);
  logMsg("Starting sprite generation...");
  Jimp.read(INPUT_SPRITE_PNG).then(async (defaultSprite) => {
    const DEFAULT_SPRITE_WIDTH = defaultSprite.bitmap.width;
    const DEFAULT_SPRITE_HEIGHT = defaultSprite.bitmap.height;
    logMsg(`Calling generateSpriteSheet...`);
    const { svgString, jsonMapping, totalHeight } = generateSpriteSheet(styles, SCALE_FACTOR, 0, DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT);
    logMsg(`generateSpriteSheet completed successfully.`);
    logMsg(`Creating combined sprite image...`);
    const sprites = new Jimp(DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT + totalHeight);
    logMsg(`Combined sprite image created successfully.`);
    logMsg(`Compositing defaultSprite...`);
    sprites.composite(defaultSprite, 0, 0);
    logMsg(`Successfully composited defaultSprite.`);
    logMsg(`Converting svg to image...`);
    const generatedSpriteBuffer = await svgToImg.from(svgString).toPng();
    logMsg(`SVG successfully converted to image.`);
    logMsg(`Loading custom portion of image...`);
    const generatedSprite = await Jimp.read(generatedSpriteBuffer);
    logMsg(`Custom portion successfully loaded.`);
    logMsg(`Compositing custom portion with default sprite...`);
    sprites.composite(generatedSprite, 0, DEFAULT_SPRITE_HEIGHT)
    logMsg(`Composite of custom portion with default sprite successful.`);;
    logMsg(`Writing composited image to: ${OUTPUT_SPRITE_PNG}...`);
    await sprites.writeAsync(OUTPUT_SPRITE_PNG);
    logMsg('Composited image successfully created.');
    logMsg('Building combinedJson...');
    const combinedJson = { ...defaultJson, ...jsonMapping };
    logMsg('combinedJson built successfully.');
    logMsg(`Writing out combinedJson to file: ${OUTPUT_SPRITE_JSON}...`);
    fs.writeFileSync(OUTPUT_SPRITE_JSON, JSON.stringify(combinedJson, null, 2), 'utf8');
    logMsg(`combinedJson file written successfully.`);
  }).catch(err => logMsg(`Error creating sprite: ${err}`));
};
main().catch(err => logMsg(`Error in main process: ${err}`));
