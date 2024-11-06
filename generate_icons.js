const fs = require('fs');
const { basemap } = require('./constants');

// Constants for input and output paths
const OUTPUT_DIR = `generated/${basemap}`;
const INPUT_SPRITES_JSON = `${OUTPUT_DIR}/sprite.json`;
const OUTPUT_ICONS_TXT = `${OUTPUT_DIR}/icons/icons.txt`;

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

if (!fs.existsSync(`${OUTPUT_DIR}/icons/`)) {
  fs.mkdirSync(`${OUTPUT_DIR}/icons/`, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}/icons/`);
}

// Read the JSON file
fs.readFile(INPUT_SPRITES_JSON, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse the JSON data
  const jsonData = JSON.parse(data);

  // Extract the keys
  const keys = Object.keys(jsonData);

  // Write the keys to a file, each on a new line
  fs.writeFile(OUTPUT_ICONS_TXT, keys.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('File written successfully.');
  });
});
