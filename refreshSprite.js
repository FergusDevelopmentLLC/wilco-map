require('dotenv').config();
const fs = require('fs');
const Jimp = require('jimp').default;
const svgToImg = require('svg-to-img');
const { SVG_TRIANGLE, SVG_SQUARE, SVG_CIRCLE, SVG_STAR_7PT } = require('./svgShapes');
const { Client } = require('pg');

// Get arguments from the command line
const [base_map, sprite_version, OUTPUT_DIR] = process.argv.slice(2);
const script_folder = __dirname;

if (!base_map || !sprite_version || !OUTPUT_DIR) {
  console.error("Usage: node script.js <base_map> <sprite_version> <output_dir>");
  process.exit(1);
}

// Constants for input/output paths
const INPUT_SPRITE_PNG = `${script_folder}/default_sprites/${base_map}/${sprite_version}.png`;
const INPUT_SPRITE_JSON = `${script_folder}/default_sprites/${base_map}/${sprite_version}.json`;
const OUTPUT_SPRITE_PNG = `${OUTPUT_DIR}/${sprite_version}.png`;
const OUTPUT_SPRITE_JSON = `${OUTPUT_DIR}/${sprite_version}.json`;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

const scaleFactor = INPUT_SPRITE_PNG.includes('@2x') ? 2 : 1;

// PostgreSQL connection using environment variables
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const fetchStylesFromDatabase = async () => {
  await client.connect();
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
  return res.rows;
};

const generateSpriteSheet = (styles, scaleFactor, offsetY, defaultSpriteWidth, defaultSpriteHeight) => {
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
      const scaledWidth = style.width * scaleFactor;
      const scaledHeight = style.height * scaleFactor;
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
      jsonMapping[style.sprite_ndx] = { width: scaledWidth, height: scaledHeight, x: currentX, y: currentY + defaultSpriteHeight, pixelRatio: scaleFactor };
      currentX += scaledWidth;
      currentRowHeight = Math.max(currentRowHeight, scaledHeight);
      lastShapeType = shapeType;
      lastWidth = scaledWidth;
      lastHeight = scaledHeight;
    });
  };

  ['circle', 'square', 'triangle', 'star-7pt'].forEach(addShapes);
  const totalWidth = defaultSpriteWidth;
  const totalHeight = currentY + currentRowHeight;
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">${svgContent}</svg>`;

  return { svgString, jsonMapping, totalHeight };
};

const main = async () => {
  const defaultJson = JSON.parse(fs.readFileSync(INPUT_SPRITE_JSON, 'utf8'));
  const styles = await fetchStylesFromDatabase();

  Jimp.read(INPUT_SPRITE_PNG).then(async (defaultSprite) => {
    const DEFAULT_SPRITE_WIDTH = defaultSprite.bitmap.width;
    const DEFAULT_SPRITE_HEIGHT = defaultSprite.bitmap.height;
    const { svgString, jsonMapping, totalHeight } = generateSpriteSheet(styles, scaleFactor, 0, DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT);

    const sprites = new Jimp(DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT + totalHeight);
    sprites.composite(defaultSprite, 0, 0);

    const generatedSpriteBuffer = await svgToImg.from(svgString).toPng();
    const generatedSprite = await Jimp.read(generatedSpriteBuffer);
    sprites.composite(generatedSprite, 0, DEFAULT_SPRITE_HEIGHT);

    await sprites.writeAsync(OUTPUT_SPRITE_PNG);
    console.log('Sprites sheet converted to PNG successfully!');

    const combinedJson = { ...defaultJson, ...jsonMapping };
    fs.writeFileSync(OUTPUT_SPRITE_JSON, JSON.stringify(combinedJson, null, 2), 'utf8');
    console.log('JSON mapping written successfully!');
  }).catch(err => console.error('Error loading default sprite PNG:', err));
};

main().catch(err => console.error('Error in main process:', err));
