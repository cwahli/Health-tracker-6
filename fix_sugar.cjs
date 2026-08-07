const fs = require('fs');

// Fix server_nutrient_aggregation.ts
let code1 = fs.readFileSync('server_nutrient_aggregation.ts', 'utf8');
const target1 = `const portionBaseSugar = Math.round((raw100.addedSugar !== undefined ? raw100.addedSugar : (raw100.sugar !== undefined ? raw100.sugar : 0)) * baseFactor * 10) / 10;`;
const rep1 = `const portionBaseSugar = Math.round((raw100.addedSugar !== undefined ? raw100.addedSugar : 0) * baseFactor * 10) / 10;`;

const target2 = `const sSugar = Math.round((s.addedSugar || s.sugar || 0) * scaleRatio * 10) / 10;`;
const rep2 = `const sSugar = Math.round((s.addedSugar || 0) * scaleRatio * 10) / 10;`;

code1 = code1.replace(target1, rep1).replace(target2, rep2);
fs.writeFileSync('server_nutrient_aggregation.ts', code1);
console.log("Patched server_nutrient_aggregation.ts");

// Fix server.ts
let code2 = fs.readFileSync('server.ts', 'utf8');
const target3 = `addedSugar: Math.round(getVal(['sugar', 'addedSugar', 'sugars', 'totalSugars', 'gula', 'sugarTotal', 'total_sugars']) * factor100 * 10) / 10,`;
const rep3 = `addedSugar: Math.round(getVal(['addedSugar', 'added_sugar']) * factor100 * 10) / 10,`;

code2 = code2.replace(target3, rep3);
fs.writeFileSync('server.ts', code2);
console.log("Patched server.ts");

