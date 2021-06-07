const forEachLine = require('for-each-line');
const createGraph = require('ngraph.graph');
const toDot = require('ngraph.todot');
const fs = require('fs');
const createLayout = require('ngraph.forcelayout');

let graph = createGraph();
let inputFileName = process.argv[2] || './distances.txt';

let globalStd = 0.12;
globalStd = 0.1; // 0.08
let lineNumber = 0;
let indexToNode = [];
let names = require('./pbfNames.json');

forEachLine(inputFileName, line => {
  lineNumber += 1;
  if (lineNumber === 1) {
    line.split('|').forEach(nodeId => {
      if (names[nodeId] === undefined) throw new Error('Missing name for id: ' + nodeId);
      graph.addNode(nodeId, {name: names[nodeId]});
      indexToNode.push(nodeId);
    });
    return;
  }

  let currentNode;
  let distances = [];
  line.split(' ').forEach((v, idx) => {
    if (idx === 0) currentNode = v;
    else {
      let dist = Number.parseFloat(v);
      distances.push({
        dist,
        id: indexToNode[idx - 1]
      });
    }
  });
  let avg = distances.reduce((p, c) => p + c.dist, 0);
  avg /= distances.length;
  let std = distances.reduce((p, c) => p + (c.dist - avg) * (c.dist - avg), 0)
  std = Math.sqrt(std/distances.length);

  distances.sort((a, b) => b.dist - a.dist);
  distances.slice(0, 10).forEach(other => {
    if (other.id === currentNode) return;
    if (graph.hasLink(currentNode, other.id) || graph.hasLink(other.id, currentNode)) return;

    //if (other.dist > avg + 2 * std) {
    graph.addLink(currentNode, other.id, {weight: roundDistance(other.dist)});
    // }
  });
}).then(() => {

  console.log('Performing graph layout');
  let layout = createLayout(graph, {
    timeStep: 0.5,
    springLength: 10,
    springCoefficient: 0.8,
    gravity: -12,
    dragCoefficient: 0.9,
  });
  for (let i = 0; i < 6000; ++i) layout.step();
  graph.forEachNode(node => {
    let pos = layout.getNodePosition(node.id);
    node.data.x = roundDistance(pos.x);
    node.data.y = roundDistance(pos.y);
  })
  fs.writeFileSync('distance.dot', toDot(graph), 'utf8');
});

function roundDistance(x) {
  return Math.round(x * 1000) / 1000;
}
