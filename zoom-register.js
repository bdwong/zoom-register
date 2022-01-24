const neatCsv = require('neat-csv');

// Read app configuration
const appconfig = JSON.parse(fs.readFileSync('appconfig.json'));

// Read meeting registrants
function getRegistrants(filename) {
   const csv = fs.readFileSync(filename, 'utf8');
   return neatCsv(csv);
 }
