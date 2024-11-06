const fs = require('fs');
const Jimp = require('jimp');
const path = require('path');
const { basemap } = require('./constants');
const { spriteVersion } = require('./constants');

// Constants for output paths
const OUTPUT_SPRITE_PNG = `generated/${basemap}/${spriteVersion}.png`;
const OUTPUT_SPRITE_JSON = `generated/${basemap}/${spriteVersion}.json`;
const OUTPUT_ICON_FOLDER = `generated/${basemap}/icons-testing-${spriteVersion}/`;

// Function to delete all files in the output folder
const clearOutputFolder = (folder) => {
  if (fs.existsSync(folder)) {
    fs.readdirSync(folder).forEach((file) => {
      const filePath = path.join(folder, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
    console.log(`Cleared all files from ${folder}`);
  } else {
    // Create the folder if it doesn't exist
    fs.mkdirSync(folder, { recursive: true });
    console.log(`${folder} did not exist, so it was created.`);
  }
};

// Clear the output icon folder before generating new files
clearOutputFolder(OUTPUT_ICON_FOLDER);

// Load the JSON file
const spritesJson = JSON.parse(fs.readFileSync(OUTPUT_SPRITE_JSON, 'utf8'));

// Load the sprite sheet image
Jimp.read(OUTPUT_SPRITE_PNG)
  .then(spriteSheet => {
    // Loop through each key in the JSON
    Object.keys(spritesJson).forEach((key, index) => {
      const sprite = spritesJson[key];

      // Extract the described icon from the sprite sheet
      spriteSheet.clone()
        .crop(sprite.x, sprite.y, sprite.width, sprite.height)
        .writeAsync(`${OUTPUT_ICON_FOLDER}icon_${index + 1}_${key}.png`)
        .then(() => {
          console.log(`Rendered icon for ${key}: saved as icon_${index + 1}_${key}.png`);
        })
        .catch(err => {
          console.error(`Error rendering icon for ${key}:`, err);
        });
    });
  })
  .catch(err => {
    console.error('Error loading sprite sheet image:', err);
  });
