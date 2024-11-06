const fs = require('fs');
const { basemap } = require('./constants');

const OUTPUT_DIR = `generated/${basemap}`;
const INPUT_ICONS_TXT = `${OUTPUT_DIR}/icons/icons.txt`;
const OUTPUT_GEOJSON_POINTS = `${OUTPUT_DIR}/geojson/points.geojson`;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

if (!fs.existsSync(`${OUTPUT_DIR}/geojson/`)) {
  fs.mkdirSync(`${OUTPUT_DIR}/geojson/`, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}/geojson/`);
}

// Function to read icons from icons.txt
function readIconsFromFile() {
  try {
    const data = fs.readFileSync(INPUT_ICONS_TXT, 'utf8');
    return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  } catch (err) {
    console.error(`Error reading ${INPUT_ICONS_TXT}:`, err);
    return [];
  }
}

// Function to generate GeoJSON based on the icons array
function generateGeoJSON(icons) {

  const startX = -98.6295321778425;
  const startY = 30.91845994698453;
  const deltaX = 0.072; // Approx 5 miles in longitude
  const deltaY = -0.045; // Approx 5 miles in latitude
  const maxX = -97.22504264366061;

  let x = startX;
  let y = startY;

  const features = [];

  icons.forEach(icon => {
    features.push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [x, y]
      },
      "properties": {
        "icon": icon
      }
    });

    x += deltaX;
    if (x > maxX) {
      x = startX;
      y += deltaY;
    }
  });

  return {
    "type": "FeatureCollection",
    "features": features
  };
}

// Read icons from icons.txt
const icons = readIconsFromFile();

// Generate the GeoJSON
const geojson = generateGeoJSON(icons);

// Write the GeoJSON to a file
fs.writeFile(OUTPUT_GEOJSON_POINTS, JSON.stringify(geojson, null, 2), (err) => {
  if (err) {
    console.error(`Error writing GeoJSON file to ${OUTPUT_GEOJSON_POINTS}:`, err);
  } else {
    console.log(`GeoJSON file has been written to ${OUTPUT_GEOJSON_POINTS}`);
  }
});
