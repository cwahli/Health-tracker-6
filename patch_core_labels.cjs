const fs = require('fs');
let content = fs.readFileSync('server_nutrient_aggregation.ts', 'utf8');

const targetStr = `  const coreLabelKeys = [
    "calories", "protein", "totalFat", "saturatedFat", "transFat",
    "carbohydrates", "addedSugar", "sugar", "gula", "sodium", "potassium", "totalFibre", "fiber", "fibre", "serat", "solubleFibre"
  ];`;

content = content.replace(targetStr, '');
fs.writeFileSync('server_nutrient_aggregation.ts', content);
