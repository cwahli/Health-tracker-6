const fs = require('fs');
const file = 'server_food_db.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  plum: { fdcId: "169949"`;

const replStr = `  rolled_oats: { fdcId: "169705", calories: 379, protein: 13.2, totalFat: 6.5, saturatedFat: 1.1, transFat: 0, carbohydrates: 67.7, sugar: 0.99, sodium: 2, potassium: 362, fiber: 10.1, calcium: 52, magnesium: 138, iron: 4.25, zinc: 3.64, foodType: 'grain' },
  plum: { fdcId: "169949"`;

content = content.replace(targetStr, replStr);

const targetLookup = `  if (tokens.includes('nectarine') || tokens.includes('nectarines')) return CANONICAL_BASE_FOODS.nectarine;`;

const replLookup = `  if (tokens.includes('nectarine') || tokens.includes('nectarines')) return CANONICAL_BASE_FOODS.nectarine;
  if (tokens.includes('oat') || tokens.includes('oats') || tokens.includes('oatmeal') || clean.includes('porridge')) return CANONICAL_BASE_FOODS.rolled_oats;`;

content = content.replace(targetLookup, replLookup);

fs.writeFileSync(file, content);
console.log("Fixed server_food_db.ts");
