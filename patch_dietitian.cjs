const fs = require('fs');
let content = fs.readFileSync('agents/dietitianInstructions.ts', 'utf8');

const target1 = `CONSISTENCY & PROSE PRECISION: In your conversational response ("message"), explicitly discuss specific numeric nutrient totals calculated for the current meal. You MUST explicitly weave the mathematical totals calculated directly into the conversational message.`;
const repl1 = `CONSISTENCY & PROSE PRECISION: In your conversational response ("message") and detailed analysis fields, you MUST explicitly state the numeric totals (calories, saturated fat, sodium) for EACH INDIVIDUAL ITEM separately. Do NOT attribute the grand total of the entire meal to a single item. Maintain a strict 1:1 mapping between the item name and its specific nutrients. Do not provide generic warnings without the specific numbers.`;
content = content.replace(target1, repl1);

const target2 = `"message": "A highly personalized conversational response explicitly referencing the exact nutritional data.",`;
const repl2 = `"message": "Conversational clinical assessment itemizing exact numeric totals per item.",`;
content = content.replace(target2, repl2);

fs.writeFileSync('agents/dietitianInstructions.ts', content);
