module.exports = getGraphEmbeddingRandomWalk;
module.exports.enumerateWalks = enumerateWalks;

const createRandom = require('ngraph.random');

/**
 * Implements anonymous walk embedding (https://arxiv.org/abs/1805.11921 )
 * counter.
 * 
 * @param {number} walkSize - how many steps the walker should take
 * @param {ngraph.graph} graph - instance of the graph
 * @param {string[]?} paths - optional array of all possible paths. Only used to improve performance 
 * and can be left empty for default initialization.
 * @returns number[] - vector of counts each walk appeared in the graph
 */
function getGraphEmbeddingRandomWalk(walkSize, graph, paths) {
  if (walkSize < 2 || walkSize > 8) throw new Error('Walk size is too large. Should be in [2, 8] interval');
  if (graph.getNodeCount() === 0) throw new Error('Graph is empty');

  let nu = [0, 0, 2, 5, 15, 52, 203, 877, 4000, 21000, 116000, 679000, 4000000];
  let eps = 0.1;    // Error more than epsilon
  let delta = 0.01; // has probability smaller than delta

  // Read more about this formula in the paper https://arxiv.org/abs/1805.11921
  let walkCount = Math.ceil(2*(Math.log(2)*nu[walkSize] - Math.log(delta)) /(eps**2));
  let counts = [];
  if (!paths) paths = enumerateWalks(walkSize);

  let pathIndex = new Map();
  for (let i = 0; i < paths.length; ++i) {
    counts[i] = 0;
    pathIndex.set(paths[i], i);
  }

  let nodes = [];
  let nodeToIndex = new Map();
  graph.forEachNode(node => {
    nodeToIndex.set(node.id, nodes.length);
    nodes.push([]);
  });

  graph.forEachLink(link => {
    let from = nodeToIndex.get(link.fromId);
    let to = nodeToIndex.get(link.toId);
    if (from === to) return;

    // assume undirected for now
    nodes[from].push(to);
    nodes[to].push(from);
  });
  
  let random = createRandom(42);

  for (let i = 0; i < walkCount; ++i) {
    let startNode = random.next(nodes.length);
    let walkSignature = getWalkSignature(startNode);
    let pathNumber = pathIndex.get(walkSignature);
    if (pathNumber === undefined) {
      debugger;
      throw new Error("Walk is not defined: " + walkSignature);
    }
    counts[pathNumber] += 1;
  }

  return counts;

  function getWalkSignature(startNodeNumber) {
    let walk = [startNodeNumber];
    let current = startNodeNumber;
    while (walk.length <= walkSize) {
      let neighbors = nodes[current];
      current = neighbors[random.next(neighbors.length)];
      walk.push(current);
    }
    let nodeToNumber = new Map();
    return walk.map(x => {
      if (nodeToNumber.has(x)) {
        return nodeToNumber.get(x);
      };
      let id = nodeToNumber.size
      nodeToNumber.set(x, id);
      return id;
    }).join('')
  }
}

function enumerateWalks(walkSize) {
  let paths = [];
  let lastPaths = [[0, 1]]
  for (let i = 2; i < walkSize + 1; ++i) {
    let currentPaths = [];
    for (let j = 0; j < i + 1; ++j) {
      lastPaths.forEach(walk => {
        if (walk[walk.length - 1] !== j && j <= Math.max.apply(Math, walk) + 1) {
          paths.push(walk.concat([j]))
          currentPaths.push(walk.concat([j]));
        }
      })
    }
    lastPaths = currentPaths;
  }
  return paths.filter(x => x.length === walkSize + 1).map(x => x.join(''));
}
