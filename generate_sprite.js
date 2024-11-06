const fs = require('fs');
const Jimp = require('jimp');
const svgToImg = require('svg-to-img');
const { basemap } = require('./constants');
const { spriteVersion } = require('./constants');

// Constants for input and output paths
const INPUT_SPRITE_PNG = `default_sprites/${basemap}/${spriteVersion}.png`;
const INPUT_SPRITE_JSON = `default_sprites/${basemap}/${spriteVersion}.json`;
const OUTPUT_DIR = `generated/${basemap}`;
const OUTPUT_SPRITE_PNG = `${OUTPUT_DIR}/${spriteVersion}.png`;
const OUTPUT_SPRITE_JSON = `${OUTPUT_DIR}/${spriteVersion}.json`;

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

// Set scaleFactor based on whether INPUT_SPRITE_PNG contains "@2x"
const scaleFactor = INPUT_SPRITE_PNG.includes('@2x') ? 2 : 1;

// Read the JSON file for existing styles and generated styles
const defaultJson = JSON.parse(fs.readFileSync(INPUT_SPRITE_JSON, 'utf8'));
const styles = JSON.parse(fs.readFileSync('wells_styles.json', 'utf8'));

// SVG generation functions
const SVG_TRIANGLE = (style) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${
    0.2222222222222222 * style.width
  } -${0.2222222222222222 * style.width} ${1.444444444444444 * style.width} ${
    1.444444444444444 * style.width
  }" height="${style.height}" width="${style.width}">
        <polygon points="${style.width / 2},0 ${style.width},${
    style.height
  } 0,${style.height}" fill="${style.fill_color}" stroke="${
    style.stroke_color
  }" stroke-width="${style.stroke_width}" stroke-linejoin="round" />
      </svg>`;
};

const SVG_SQUARE = (style) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${
    0.2222222222222222 * style.width
  } -${0.2222222222222222 * style.width} ${1.444444444444444 * style.width} ${
    1.444444444444444 * style.width
  }" height="${style.height}" width="${style.width}">
        <rect width="${style.width}" height="${style.height}" fill="${
    style.fill_color
  }" stroke="${style.stroke_color}" stroke-width="${
    style.stroke_width
  }" stroke-linejoin="round" />
      </svg>`;
};

const SVG_CIRCLE = (style) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${
    0.2222222222222222 * style.width
  } -${0.2222222222222222 * style.width} ${1.444444444444444 * style.width} ${
    1.444444444444444 * style.width
  }" height="${style.height}" width="${style.width}">
        <circle cx="${style.width / 2}" cy="${style.height / 2}" r="${
    Math.min(style.width, style.height) / 2
  }" fill="${style.fill_color}" stroke="${style.stroke_color}" stroke-width="${
    style.stroke_width
  }" stroke-linejoin="round" />
      </svg>`;
};

const SVG_STAR_7PT = (style) => {
  return `<svg width="${style.height}" height="${style.width}" viewBox="0 0 102 102" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="${style.fill_color}" d="M62.6279 28.2189L50.4186 1L38.7907 28.2189L10.8837 19.3432L24.8372 47.1538L1 63.7219L28.907 69.6391L26.5814 101L50.4186 79.6982L74.8372 101L72.5116 69.6391L101 63.7219L76.5814 47.1538L91.1163 19.3432L62.6279 28.2189Z" />
    <path stroke="${style.stroke_color}" stroke-linejoin="round" d="M62.6279 28.2189L50.4186 1L38.7907 28.2189L10.8837 19.3432L24.8372 47.1538L1 63.7219L28.907 69.6391L26.5814 101L50.4186 79.6982L74.8372 101L72.5116 69.6391L101 63.7219L76.5814 47.1538L91.1163 19.3432L62.6279 28.2189Z" />
    <path stroke="${style.stroke_color}" stroke-width="${style.stroke_width}" stroke-opacity="1" stroke-linejoin="round" d="M62.6279 28.2189L50.4186 1L38.7907 28.2189L10.8837 19.3432L24.8372 47.1538L1 63.7219L28.907 69.6391L26.5814 101L50.4186 79.6982L74.8372 101L72.5116 69.6391L101 63.7219L76.5814 47.1538L91.1163 19.3432L62.6279 28.2189Z" />
</svg>`;
};

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
    console.log("combinedJson", combinedJson)

    // Write the JSON to file
    fs.writeFileSync(OUTPUT_SPRITE_JSON, JSON.stringify(combinedJson, null, 2), 'utf8');
  })
  .catch(err => {
    console.error('Error loading default sprite PNG:', err);
  });
