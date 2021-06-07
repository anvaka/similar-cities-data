/**
 * Iterate over all embeddings and dumps distance matrix onto the console
 */
const fs = require('fs');
const path = require('path');

const dataFolder = process.argv[2] || 'data-emb'
let candidates = [];
fs.readdirSync(dataFolder).forEach(file => {
  if (file.endsWith('.pbf') && file.startsWith('8_')) {
    const city = JSON.parse(fs.readFileSync(path.join(dataFolder, file), 'utf8'));
    city.name = city.name.replace('.pbf', '');
    candidates.push(city);
  }
});

let matrix = [];
console.log(candidates.map(x => x.name).join('|'));

candidates.forEach(from => {
  let line = [from.name];
  candidates.forEach(other => {
    line.push(jaccardDist(from.embedding, other.embedding))
  });
  console.log(line.join(' '));
})

function jaccardDist(a, b) {
  let overlap = a.reduce((o, c, i) => o + Math.min(c, b[i]), 0);
  let total = a.reduce((s, c, i) => s + c + b[i], 0);
  return overlap/(total - overlap);
}
