const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const aggregatedNutrients: Record<string, number> = {
        calories: 0, protein: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
        carbohydrates: 0, addedSugar: 0, sodium: 0, potassium: 0, totalFibre: 0, solubleFibre: 0
      };`;

const replacementStr = `      const aggregatedNutrients: Record<string, number> = {};
      NUTRIENT_KEYS.forEach(k => aggregatedNutrients[k] = 0);`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
