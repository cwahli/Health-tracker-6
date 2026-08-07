const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          sumNa = Math.max(0, receiptRealityCheckNutrients.sodium);
          sumP = Math.max(0, receiptRealityCheckNutrients.protein);

          const itemCal = Math.max(0, sumCal);`;

const replaceStr = `          sumNa = Math.max(0, receiptRealityCheckNutrients.sodium);
          sumP = Math.max(0, receiptRealityCheckNutrients.protein);
          sumCal = Math.max(0, receiptRealityCheckNutrients.calories);
          sumFat = Math.max(0, receiptRealityCheckNutrients.totalFat);
          sumSatFat = Math.max(0, receiptRealityCheckNutrients.saturatedFat);
          sumCarbs = Math.max(0, receiptRealityCheckNutrients.carbohydrates || sumCarbs);

          const itemCal = Math.max(0, sumCal);`;

if (code.includes(targetStr)) {
    fs.writeFileSync('server.ts', code.replace(targetStr, replaceStr));
    console.log('Fixed receipt vars in server.ts');
} else {
    console.log('Target string not found');
}
