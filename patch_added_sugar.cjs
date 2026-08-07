const fs = require('fs');
let code = fs.readFileSync('server_nutrient_aggregation.ts', 'utf8');

code = code.replace(
  `itemNutrients.addedSugar = itemNutrients.addedSugar || itemNutrients.sugar || itemNutrients.gula || 0;`,
  `itemNutrients.addedSugar = itemNutrients.addedSugar || 0;`
);

code = code.replace(
  `addedSugar: itemNutrients.addedSugar || itemNutrients.sugar || itemNutrients.gula || 0,`,
  `addedSugar: itemNutrients.addedSugar || 0,`
);

fs.writeFileSync('server_nutrient_aggregation.ts', code);
