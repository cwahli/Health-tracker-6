import { parseMenuNutritionPaste } from './serverBrandMenu.ts';
const text = `Bang-Bang Shroom (ve)

Freshly-roasted mushrooms, almond bang-bang sauce, kimchi, coriander, sesame, fresh ciabatta

Nutrition
Energy (kcal)
620
Fats
31.3g
Saturates
2.1g
Carbs
69.8g
Sugar
9.9g
Proteins
18.6g
Fiber
8.9g
Salt
3.2g`;

console.log(JSON.stringify(parseMenuNutritionPaste(text), null, 2));
