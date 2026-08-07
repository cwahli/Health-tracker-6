const fs = require('fs');
let code = fs.readFileSync('server_nutrient_aggregation.ts', 'utf8');
console.log(code.match(/addedSugar/g).length);
