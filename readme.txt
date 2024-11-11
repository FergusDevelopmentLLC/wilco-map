To add and test a new style that references a custom sprite.

Create a folder to hold the custom sprite.
sprites\final\sprites\light-v10

Create a folder to hold the custom style.
sprites\final\styles\light-v10

Create a folder to hold the test html map that will use the new style.
sprites\final\test\light-v10-custom

Create a folder to hold the default sprites for the style.
sprites\generate\default_sprites\light-v10

In this folder put the default sprites for the style. The default sprite pngs and jsons can be found here:
https://api.mapbox.com/styles/v1/mapbox/light-v10/sprite.png?access_token=pk.eyJ1Ijoid2lsbGNhcnRlciIsImEiOiJjaWdjdHdkNzYwZGp3dTVtMGhhY2ZkaDloIn0.9qTtVfFnKXVe82B-6mJbqQ
https://api.mapbox.com/styles/v1/mapbox/light-v10/sprite.json?access_token=pk.eyJ1Ijoid2lsbGNhcnRlciIsImEiOiJjaWdjdHdkNzYwZGp3dTVtMGhhY2ZkaDloIn0.9qTtVfFnKXVe82B-6mJbqQ
https://api.mapbox.com/styles/v1/mapbox/light-v10/sprite@2x.png?access_token=pk.eyJ1Ijoid2lsbGNhcnRlciIsImEiOiJjaWdjdHdkNzYwZGp3dTVtMGhhY2ZkaDloIn0.9qTtVfFnKXVe82B-6mJbqQ
https://api.mapbox.com/styles/v1/mapbox/light-v10/sprite@2x.json?access_token=pk.eyJ1Ijoid2lsbGNhcnRlciIsImEiOiJjaWdjdHdkNzYwZGp3dTVtMGhhY2ZkaDloIn0.9qTtVfFnKXVe82B-6mJbqQ

sprites\generate\default_sprites\ folder should now have the following files:
sprite.png
sprite.json
sprite@2x.png
sprite@2x.json

There are 2 versions of the sprite. sprite.png and sprite.json is for the low resolution sprite. sprite@2x.png and sprite@2x.json are for the high resolution sprite.
The mapbox map will pick the appropriate sprite based on the device resolution. You have to generate both versions of the sprite.

sprites\generate\wells_styles.json - this contains the descriptions of the custom icons you want to add to the sprite, like:
{
    "style_ndx": 1,
    "shape": "circle",
    "height": 18,
    "width": 18,
    "fill_color": "Violet",
    "stroke_color": "Black",
    "stroke_width": 2,
    "matching_src_attributes": [
      "mz_10_7"
    ]
}

In Barton Springs, the view that generates the json for wells_styles.json is:
client_bartonsprings.list_sprites_for_sprite_generation

Modify sprites\generate_v2\constants.js to the following:
module.exports = {
  basemap: 'light-v10',
  spriteVersion: 'sprite'
};

Execute refreshSprite.js to generate the low resolution sprite.
PS C:\...\sprites\generate> node refreshSprite.js
This will create:
sprites\generate\generated\light-v10\sprite.png';
sprites\generate\generated\light-v10\sprite.json';

Execute check_generate_sprite.js to check the low resolution sprite. This will fill sprites\generate\generated\light-v10\icons-testing-sprite
with a single image for each icon in the sprite. It splits sprites\generate\generated\light-v10\sprite.png into individual icons based on the sprite.json file.

sprites\generate> node check_generate_sprite.js
Cleared all files from generated/light-v10/icons-testing-sprite/
Rendered icon for airfield-15: saved as icon_1_airfield-15.png
Rendered icon for airport-15: saved as icon_2_airport-15.png
...
Check the icons in sprites\generate\generated\light-v10\icons-testing-sprite to see if they are correct.

Modify sprites\generate_v2\constants.js to the following:
module.exports = {
  basemap: 'light-v10',
  spriteVersion: 'sprite@2x'
};

Execute refreshSprite.js to generate the low resolution sprite.
PS C:\...\sprites\generate> node refreshSprite.js
This will create:
sprites\generate\generated\light-v10\sprite@2x.png';
sprites\generate\generated\light-v10\sprite@2x.json';

Execute check_generate_sprite.js to check the low resolution sprite. This will fill sprites\generate\generated\light-v10\icons-testing-sprite@2x
with a single image for each icon in the sprite. It splits sprites\generate\generated\light-v10\sprite@2x.png into individual icons based on the sprite.json file.

sprites\generate> node check_generate_sprite.js
Cleared all files from generated/light-v10/icons-testing-sprite@2x/
Rendered icon for airfield-15: saved as icon_1_airfield-15.png
Rendered icon for airport-15: saved as icon_2_airport-15.png
---
Check the icons in sprites\generate\generated\light-v10\icons-testing-sprite@2x to see if they are correct. The icons should be doubled in size.

Execute generate_icons.js. This will create sprites\generate\generated\light-v10\icons\icons.txt

Execute generate_geojson.js. This will create sprites\generate\generated\light-v10\geojson\points.geojson

Now we are ready to test on a test map.

Copy the generated sprite files to their final test locations...
sprites\generate\generated\light-v10\sprite.json
sprites\generate\generated\light-v10\sprite.png
sprites\generate\generated\light-v10\sprite@2x.json
sprites\generate\generated\light-v10\sprite@2x.png
to:
sprites\final\sprites\light-v10\sprite.json
sprites\final\sprites\light-v10\sprite.png
sprites\final\sprites\light-v10\sprite@2x.json
sprites\final\sprites\light-v10\sprite@2x.png

Get the json code for the default light-v10 style. Visit this api and copy the json code:
https://api.mapbox.com/styles/v1/mapbox/light-v10?access_token=pk.eyJ1Ijoid2lsbGNhcnRlciIsImEiOiJjaWdjdHdkNzYwZGp3dTVtMGhhY2ZkaDloIn0.9qTtVfFnKXVe82B-6mJbqQ

Create a new file here: sprites\final\styles\light-v10\light-v10-custom-sprite.json
Paste the json code into this file.

Use intellij to reformat the json so it can be read. Find the sprite reference in the json and replace it with the new sprite reference.
 "sprite": "mapbox://sprites/mapbox/light-v10",
 to:
 "sprite": "https://raw.githubusercontent.com/FergusDevelopmentLLC/sprites/main/final/sprites/light-v10/sprite"
Now the style: sprites\final\styles\outdoors-v11\outdoors-v11-custom-sprite.json reference the new sprite (once this code is pushed to github).

Create a test map html here:
sprites\final\test\light-v10-custom\light-v10-custom.html
Copy the code from here:
sprites\final\test\outdoors-v11-custom\outdoors-v11-custom.html
to
sprites\final\test\light-v10-custom\light-v10-custom.html

Modify light-v10-custom.html to reference the new style:
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'https://fergusdevelopmentllc.github.io/sprites/final/styles/light-v10/light-v10-custom-sprite.json', // initial style
    center: [-97.7431, 30.2672], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

Copy the geojson file from here:
sprites\generate\generated\light-v10\geojson\points.geojson
to
sprites\final\test\light-v10-custom\points.geojson

Now you have everything to test the new style with the custom sprite, but you have to push the changes to github first.
Make a PR with these changes and merge them to the main branch.
https://github.com/FergusDevelopmentLLC/sprites

Now you can see the test map that uses the new light-v10 style with uses the custom sprite. There will be a point on the map for each icon in the sprite.
https://fergusdevelopmentllc.github.io/sprites/final/test/light-v10-custom/light-v10-custom.html

After doing everything for the spriteStyles above, these urls will work.
https://fergusdevelopmentllc.github.io/sprites/final_v2/test/streets-v11-custom/streets-v11-custom.html
https://fergusdevelopmentllc.github.io/sprites/final_v2/test/satellite-streets-v11-custom/satellite-streets-v11-custom.html
https://fergusdevelopmentllc.github.io/sprites/final_v2/test/outdoors-v11-custom/outdoors-v11-custom.html
https://fergusdevelopmentllc.github.io/sprites/final_v2/test/dark-v10-custom/dark-v10-custom.html
https://fergusdevelopmentllc.github.io/sprites/final_v2/test/light-v10-custom/light-v10-custom.html
