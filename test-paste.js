import { parseMenuNutritionPaste } from './dist/server.cjs';
const text = `Paste menu nutrition panel

Copy title + description + Nutrition block from YOLK (e.g. Bang-Bang Shroom, Energy kcal, Fats, Carbs, Proteins, Salt) and paste below → Add item.

Bang-Bang Shroom (ve)

Freshly-roasted mushrooms...

Nutrition
Energy (kcal)
620
Fats
31.3g
...
Preview: Bang-Bang Shroom (ve) — Freshly-roasted mushrooms, almond bang-bang sauce, kimchi, coriander, sesame, fresh ciabatta
kcal 620 · P 18.6g · C 69.8g (sugar 9.9g) · F 31.3g · Fiber 8.9g · Salt 3.2g
Preview`;

console.log(parseMenuNutritionPaste(text));
