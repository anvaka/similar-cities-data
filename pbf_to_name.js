/**
 * Converts pbf id into OSM's name.
 */
const fs = require('fs');
const path = require('path');
const dataFolder = process.argv[2] || 'data';
const Pbf = require('pbf');
const place = require('./proto/place.js').place;

let from;
let candidates = Object.create(null);
fs.readdirSync(dataFolder).forEach(file => {
  if (file.endsWith('.pbf')) {
    let data = fs.readFileSync(path.join(dataFolder, file));
    let obj = place.read(new Pbf(data));
    candidates[file.replace('.pbf', '')] = obj.name;
  }
});

fs.writeFileSync('pbfNames.json', JSON.stringify(candidates, null, 2), 'utf8');
console.log('Saved to pbfNames.json')
