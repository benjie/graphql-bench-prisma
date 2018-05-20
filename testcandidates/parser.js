const fs = require('fs');

// This filter can be used to trim down the folders that we look at, in case
// you've ran the benchmark multiple times.
const dataFilter = r => true;
// e.g.:
// const dataFilter = r => r.startedAt.startsWith('2018-05-20');

////////////////////////////////////////////////////////////////////////////////

const isDir = fspath => n => fs.statSync(`${fspath}/${n}`).isDirectory();
const getDirectoriesInside = fspath => fs.readdirSync(fspath).filter(isDir(fspath));
const LINE_PARSE_REGEX = /^((?: ?\w+)+)  +\[((?: ?[a-zA-Z0-9,:]+)+)\]  +(.*)$/;
const TIME_REGEX = /^(?:([0-9.]+)m)?(?:([0-9.]+)s)?(?:([0-9.]+)ms)?$/


////////////////////////////////////////////////////////////////////////////////

const testcandidates = getDirectoriesInside(__dirname);

function processValue(str) {
  const timeMatches = str.length > 0 && str.match(TIME_REGEX);
  if (timeMatches) {
    const ms = (parseFloat(timeMatches[1] || '0') || 0) * 60000
      + (parseFloat(timeMatches[2] || '0') || 0) * 1000
      + (parseFloat(timeMatches[3] || '0') || 0);
    return ms;
  } else if (str.match(/^([0-9]+(\.[0-9]+)?|\.[0-9]+)$/)) {
    return parseFloat(str);
  } else if (str.match(/^(([0-9]{3}|0)\:[0-9]+ *)+$/)) {
    const results = str.split(/ +/);
    const value = results.reduce(
      (memo, val) => {
        const [k,v] = val.split(':');
        memo[k] = parseInt(v, 10);
        return memo;
      },
      {}
    );
    return value;
  } else {
    return str;
  };
}

function parseContents(fileContents) {
  const lines = fileContents.split('\n');
  let intoErrors = false;
  const data = {
    errorSet: [],
  }
  for (const line of lines) {
    if (intoErrors) {
      data.errorSet.push(line.trim());
    } else {
      const parsed = line.trim().match(LINE_PARSE_REGEX);
      if (parsed) {
        const fieldNames = parsed[2].split(', ').map(s => s.trim());
        const obj = parsed[3].split(', ').reduce(
          (memo, value, index) => {
            const rawValue = value.trim();
            const processedValue = processValue(rawValue);
            memo[fieldNames[index]] = processedValue;
            return memo;
          },
          {}
        );
        const key = parsed[1].trim().replace(/ [a-z]/gi, (s) => s[1].toUpperCase());
        if (Object.keys(obj).length === 1 && Object.keys(obj)[0] === 'code:count') {
          // Optimisation for access to status codes
          data[key] = obj['code:count'];
        } else {
          data[key] = obj;
        }
      } else if (line.match(/^Error Set:/)) {
        intoErrors = true;
      } else {
        throw new Error(`Unexpected line '${line}' in data: \n${fileContents}`);
      }
    }
  }
  delete data.errorSet; // TODO: restore this
  return data;
}

////////////////////////////////////////////////////////////////////////////////

const allData = [];

for (const candidate of testcandidates) {
  console.log(candidate);
  const resultFolders = getDirectoriesInside(`${__dirname}/${candidate}/results`);
  console.log(resultFolders);
  for (const resultFolder of resultFolders) {
    const files = fs.readdirSync(`${__dirname}/${candidate}/results/${resultFolder}`).filter(n => n.match(/^[a-z].*\.txt/));
    for (const file of files) {
      console.log(file);
      const [_, query, rpsRaw] = file.match(/^([a-z0-9_]+)-([0-9]+)\.txt$/i)
      const rps = parseInt(rpsRaw, 10);
      const contents = fs.readFileSync(`${__dirname}/${candidate}/results/${resultFolder}/${file}`, 'utf8').trim();
      if (contents.length === 0) {
        continue;
      }
      const parsedContents = parseContents(contents);
      const entry = {
        candidate,
        startedAt: resultFolder,
        query,
        rps,
        ...parsedContents,
      };
      allData.push(entry);
    }
  }
}

const filteredData = allData.filter(dataFilter);
//console.log(filteredData);

const digest = {};
for (const entry of filteredData) {
  /*
  if (!digest[entry.query]) digest[entry.query] = {};
  if (!digest[entry.query][entry.candidate]) digest[entry.query][entry.candidate] = {};
  digest[entry.query][entry.candidate][entry.rps] = entry.Latencies['95'];
  */
  if (!digest[entry.query]) digest[entry.query] = [];
  digest[entry.query].push({
    software: entry.candidate,
    rps: entry.rps,

    // latency
    latMean: entry.Latencies['mean'],
    lat50: entry.Latencies['50'],
    lat95: entry.Latencies['95'],
    lat99: entry.Latencies['99'],
    latMax: entry.Latencies['max'],

    // Success
    success: entry.StatusCodes['200'] || 0,
    failure: entry.StatusCodes['0'] || 0,
  });
}
const filename = `${__dirname}/../visualizer/src/data.json`;
fs.writeFileSync(filename, JSON.stringify(digest, null, 2));
console.log(`Digest data written to:`);
console.log(`  ${filename}`);
