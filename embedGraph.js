const readGraph = require('./readGraph');
const {enumerateWalks} = require('./graph-embedding/random-walk');
const randomWalk = require('./graph-embedding/random-walk');

let candidates = [];
const inputFolder = process.argv[2] || 'data';
const outputFolder = 'data-emb'
const fs = require('fs');
const path = require('path');

fs.readdirSync(inputFolder).forEach(file => {
  if (file.endsWith('.pbf')) {
    candidates.push(path.join(inputFolder, file));
  }
});
let walkSize = 8;

// precompute the walks, so that they are faster during embedding
let paths = enumerateWalks(walkSize);

candidates.forEach((x, index, arr) => {
  const outName = path.join(outputFolder,  walkSize + '_' + path.basename(x));
  if (fs.existsSync(outName)) {
    return;
  }

  let graph = readGraph(x)
  if (graph.getNodeCount() === 0) return;
  let embedding = randomWalk(walkSize, graph, paths);
  let name = path.basename(x);
  fs.writeFileSync(outName, JSON.stringify({name, embedding}), 'utf8');

  if (index % 100 === 0) {
    console.log('Processed ' + (index + 1) + ' out of ' + arr.length);
  }
});
