// svgShapes.js

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
    <path fill="${style.fill_color}" stroke-width="${style.stroke_width}" stroke="${style.stroke_color}" stroke-linejoin="round" d="M62.6279 28.2189L50.4186 1L38.7907 28.2189L10.8837 19.3432L24.8372 47.1538L1 63.7219L28.907 69.6391L26.5814 101L50.4186 79.6982L74.8372 101L72.5116 69.6391L101 63.7219L76.5814 47.1538L91.1163 19.3432L62.6279 28.2189Z" />    
</svg>`;
};

module.exports = {
  SVG_TRIANGLE,
  SVG_SQUARE,
  SVG_CIRCLE,
  SVG_STAR_7PT,
};
