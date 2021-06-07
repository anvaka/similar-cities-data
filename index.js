let fs = require('fs');
let fetch = require('node-fetch')
let forEachLine = require('for-each-line');
let randomAPI = require('ngraph.random');
let toProtobuf = require('./lib/toProtobuf');
let path = require('path')
let outgoing;
let outErrors;
let queue = [];
let executeOSMQuery = require('./lib/executeOSMQuery')
let outFolderName = 'data';
let outFileName = path.join(__dirname, outFolderName, 'processed.json');
let outErrorsFileName = path.join(__dirname, outFolderName, 'errors.json');
var JSONStream = require('JSONStream')
var es = require('event-stream')

// readErroredFile(outFileName, crawl);

readProcessedFile(outFileName, crawl);

function crawl(seen) {
  forEachLine(process.argv[2] || 'cities.txt', line => {
    let cityName = line;// sanitize(line)
    if (!seen.has(cityName)) queue.push(cityName)
  }).then(downloadAll);
}

function downloadAll() {
  let last = 0;
  randomAPI.randomIterator(queue).shuffle();

  downloadNext();

  function downloadNext() {
    let city = queue[last];
    if (!city) {
      console.warn('All done');
      return;
    }

    last += 1;

    let [cityName, countryName]=city.split('\t')
    let url = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryName)}`;
    console.log('Fetching area for: ' + url);

    fetch(url)
      .then(x => x.json())
      .then(x => x.filter(row => row.osm_type === 'relation')
        .map(row => {
          // console.log(row);
          return {
            key: city,
            name: row.display_name,
            type: row.type,
            areaId: row.osm_id + 36e8
          };
        })
      )
      .then(data => {
        if (!data.length) {
          console.warn('Could not find matches for ' + city + '; Skipping');
          downloadNext();
          return;
        }

        return downloadOSM(data[0]);
      }).catch(err => {
        console.error('Error when fetching ' + url)
        console.error(err);
        setTimeout(downloadNext, 2000);
      });
  }

  function downloadOSM(place) {
    let query = getQuery(place.areaId);
    return executeOSMQuery(query)
      .then(data => saveResults(data.elements, place))
      .then(downloadNext)
  }

  function saveResults(elements, place) {
    let buffer = toProtobuf(elements, place.name, place.areaId);
    let fileName = path.join(__dirname, outFolderName, place.areaId + '.pbf');
    fs.writeFileSync(fileName, buffer);
    markProcessed(place);
  }

function getQuery(areaId) {
  
// way["highway"](area.area);

//way[highway~"^(((motorway|trunk|primary|secondary|tertiary)(_link)?)|unclassified|residential|living_street|service|track)$"](area.area);
    return `[timeout:900][out:json];
area(${areaId});
(._; )->.area;
(
way[highway~"^(motorway|primary|secondary|tertiary)|residential"](area.area);
node(w);
);
out skel;`;
}
}

function sanitize(name) {
  return name.replace(/\t/g, ',');
}

function markProcessed(page) {
  if(!outgoing) {
    createOutStream();
  }

  outgoing.write(page);
}

function createOutStream() {
  outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);
}

function readProcessedFile(fileName, done) {
  var seen = new Set();
  if (!fs.existsSync(fileName)) {
    done(seen);
    return;
  }

  console.log('Parsing processed list...');
  var jsonStreamParser = JSONStream.parse();
  fs.createReadStream(fileName)
    .pipe(jsonStreamParser)
    .pipe(es.mapSync(markProcessed))
    .on('end', fileInitialized);

  function markProcessed(place) {
    seen.add(place.key);
  }

  function fileInitialized() {
    console.log('Processed: ' + seen.size);
    done(seen);
  }
}
