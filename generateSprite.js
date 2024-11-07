const fs = require('fs');
const Jimp = require('jimp').default;
const svgToImg = require('svg-to-img');
const { SVG_TRIANGLE, SVG_SQUARE, SVG_CIRCLE, SVG_STAR_7PT } = require('./svgShapes');

// Get arguments from the command line (now including OUTPUT_DIR)
const base_map = process.argv[2];
const sprite_version = process.argv[3];
const OUTPUT_DIR = process.argv[4];

// Set script_folder to the directory where this script is located
const script_folder = __dirname;

if (!base_map || !sprite_version || !OUTPUT_DIR) {
  console.error("Usage: node script.js <base_map> <sprite_version> <output_dir>");
  process.exit(1);
}

// Constants for input paths
const INPUT_SPRITE_PNG = `${script_folder}/default_sprites/${base_map}/${sprite_version}.png`;
const INPUT_SPRITE_JSON = `${script_folder}/default_sprites/${base_map}/${sprite_version}.json`;
const OUTPUT_SPRITE_PNG = `${OUTPUT_DIR}/${sprite_version}.png`;
const OUTPUT_SPRITE_JSON = `${OUTPUT_DIR}/${sprite_version}.json`;

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

// Set scaleFactor based on whether INPUT_SPRITE_PNG contains "@2x"
const scaleFactor = INPUT_SPRITE_PNG.includes('@2x') ? 2 : 1;

// Read the JSON file for existing styles and generated styles
const defaultJson = JSON.parse(fs.readFileSync(INPUT_SPRITE_JSON, 'utf8'));
const styles = JSON.parse(fs.readFileSync(`${script_folder}/wells_styles.json`, 'utf8'));

// Function to generate SVG sprite sheet and JSON mapping
const generateSpriteSheet = (styles, scaleFactor = 1, offsetY = 0, defaultSpriteWidth, defaultSpriteHeight) => {
  let svgContent = '';
  let currentY = offsetY;
  let currentRowHeight = 0;
  let currentX = 0;
  let lastShapeType = null;
  let lastWidth = null;
  let lastHeight = null;

  // JSON structure to hold positions and sizes
  let jsonMapping = {};

  // Group styles by shape type
  const groupedStyles = styles.reduce((acc, style) => {
    acc[style.shape] = acc[style.shape] || [];
    acc[style.shape].push(style);
    return acc;
  }, {});

  // Function to add shapes to the sprite sheet and update JSON mapping
  const addShapes = (shapeType) => {
    if (!groupedStyles[shapeType]) return;

    groupedStyles[shapeType].forEach((style) => {
      const scaledWidth = style.width * scaleFactor;
      const scaledHeight = style.height * scaleFactor;

      // Break to a new row if the shape type, size changes, or if adding the shape would exceed the defaultSpriteWidth
      if (
        shapeType !== lastShapeType ||
        scaledWidth !== lastWidth ||
        scaledHeight !== lastHeight ||
        currentX + scaledWidth > defaultSpriteWidth
      ) {
        if (currentRowHeight > 0) {
          currentY += currentRowHeight;  // Increment currentY by the height of the last row
        }
        currentX = 0;
        currentRowHeight = 0;
      }

      let svgElement;
      switch (style.shape) {
        case 'circle':
          svgElement = SVG_CIRCLE({
            ...style,
            width: scaledWidth,
            height: scaledHeight,
          });
          break;
        case 'square':
          svgElement = SVG_SQUARE({
            ...style,
            width: scaledWidth,
            height: scaledHeight,
          });
          break;
        case 'triangle':
          svgElement = SVG_TRIANGLE({
            ...style,
            width: scaledWidth,
            height: scaledHeight,
          });
          break;
        case 'star-7pt':
          svgElement = SVG_STAR_7PT({
            ...style,
            width: scaledWidth,
            height: scaledHeight,
          });
          break;
        default:
          throw new Error(`Unknown shape type: ${style.shape}`);
      }

      // Append the SVG element to the main content
      svgContent += `<g transform="translate(${currentX}, ${currentY})">${svgElement}</g>`;

      // Use sprite_ndx as a key in the JSON mapping
      jsonMapping[style.sprite_ndx] = {
        width: scaledWidth,
        height: scaledHeight,
        x: currentX,
        y: currentY + defaultSpriteHeight, // Adjust by the default sprite height
        pixelRatio: scaleFactor,
      };

      currentX += scaledWidth;
      currentRowHeight = Math.max(currentRowHeight, scaledHeight);

      // Update last shape type and size
      lastShapeType = shapeType;
      lastWidth = scaledWidth;
      lastHeight = scaledHeight;
    });
  };

  // Add each shape type to the sprite sheet
  addShapes('circle');
  addShapes('square');
  addShapes('triangle');
  addShapes('star-7pt');

  const totalWidth = defaultSpriteWidth;
  const totalHeight = currentY + currentRowHeight;  // Ensure the final row height is included

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">${svgContent}</svg>`;

  return { svgString, jsonMapping, totalHeight };
};

// Load the default sprite PNG to dynamically determine its width and height
console.log("INPUT_SPRITE_PNG=", INPUT_SPRITE_PNG);
Jimp.read(INPUT_SPRITE_PNG)
  .then(defaultSprite => {
    const DEFAULT_SPRITE_WIDTH = defaultSprite.bitmap.width;
    const DEFAULT_SPRITE_HEIGHT = defaultSprite.bitmap.height;

    // Generate sprite sheet and JSON mapping with the offsetY set to 0 (remove the gap)
    const { svgString, jsonMapping, totalHeight } = generateSpriteSheet(styles, scaleFactor, 0, DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT);

    // Create a new image with the height adjusted to fit the generated sprites
    const sprites = new Jimp(DEFAULT_SPRITE_WIDTH, DEFAULT_SPRITE_HEIGHT + totalHeight);

    // Composite the default sprite and the generated sprites
    sprites.composite(defaultSprite, 0, 0);

    // Convert the generated SVG to PNG using svg-to-img
    svgToImg.from(svgString)
      .toPng()
      .then(buffer => {
        return Jimp.read(buffer);
      })
      .then(generatedSprite => {
        sprites.composite(generatedSprite, 0, DEFAULT_SPRITE_HEIGHT);
        return sprites.writeAsync(OUTPUT_SPRITE_PNG);
      })
      .then(() => {
        console.log('Sprites sheet converted to PNG successfully!');
      })
      .catch(err => {
        console.error('Error converting or rendering generated SVG to PNG:', err);
      });

    // Merge the JSON data with the generated jsonMapping
    const combinedJson = { ...defaultJson, ...jsonMapping };
    console.log("combinedJson", combinedJson);

    // Write the JSON to file
    fs.writeFileSync(OUTPUT_SPRITE_JSON, JSON.stringify(combinedJson, null, 2), 'utf8');
  })
  .catch(err => {
    console.error('Error loading default sprite PNG:', err);
  });
