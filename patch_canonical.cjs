const fs = require('fs');
let code = fs.readFileSync('server_food_db.ts', 'utf8');

const targetObj = "export const CANONICAL_BASE_FOODS: Record<string, { fdcId: string; calories: number; protein: number; totalFat: number; saturatedFat: number; transFat: number; carbohydrates: number; sugar: number; sodium: number; potassium: number; fiber: number; vitaminC?: number; vitaminA?: number; calcium?: number; magnesium?: number; iron?: number; zinc?: number; folate?: number; vitaminB6?: number; foodType: string }> = {";

const insertion = `
  tartar_sauce: { fdcId: "tartar_sauce_canonical", calories: 211, protein: 1.0, totalFat: 21.0, saturatedFat: 3.4, transFat: 0, carbohydrates: 4.4, sugar: 1.0, sodium: 730, potassium: 50, fiber: 1.0, foodType: 'ultra_processed' },
  american_cheese: { fdcId: "american_cheese_canonical", calories: 330, protein: 18.0, totalFat: 27.0, saturatedFat: 17.0, transFat: 0, carbohydrates: 3.0, sugar: 2.0, sodium: 1500, potassium: 150, fiber: 0, foodType: 'dairy' },
  processed_cheese: { fdcId: "processed_cheese_canonical", calories: 330, protein: 18.0, totalFat: 27.0, saturatedFat: 17.0, transFat: 0, carbohydrates: 3.0, sugar: 2.0, sodium: 1500, potassium: 150, fiber: 0, foodType: 'dairy' },
  mayonnaise: { fdcId: "mayo_canonical", calories: 680, protein: 1.0, totalFat: 75.0, saturatedFat: 12.0, transFat: 0, carbohydrates: 0.6, sugar: 0.6, sodium: 635, potassium: 20, fiber: 0, foodType: 'ultra_processed' },
  ketchup: { fdcId: "ketchup_canonical", calories: 101, protein: 1.0, totalFat: 0.1, saturatedFat: 0, transFat: 0, carbohydrates: 27.4, sugar: 21.8, sodium: 907, potassium: 281, fiber: 0.3, foodType: 'ultra_processed' },
`;

if (code.includes(targetObj) && !code.includes('tartar_sauce')) {
    code = code.replace(targetObj, targetObj + insertion);
    
    const lookupTarget = "if (clean.includes('peppermint_patty') || clean.includes('mint_patty')";
    const lookupInsertion = `  if (clean.includes('tartar') || clean.includes('tartar_sauce') || clean.includes('tartar sauce')) return CANONICAL_BASE_FOODS.tartar_sauce;
  if (clean.includes('american_cheese') || clean.includes('american cheese') || (clean.includes('cheese') && clean.includes('processed'))) return CANONICAL_BASE_FOODS.american_cheese;
  if (clean.includes('mayo') || clean.includes('mayonnaise')) return CANONICAL_BASE_FOODS.mayonnaise;
  if (clean.includes('ketchup')) return CANONICAL_BASE_FOODS.ketchup;
  `;
    code = code.replace(lookupTarget, lookupInsertion + lookupTarget);

    fs.writeFileSync('server_food_db.ts', code);
    console.log('Patched server_food_db.ts with condiments');
} else {
    console.log('Target string not found or already patched');
}
