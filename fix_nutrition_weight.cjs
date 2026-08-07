const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/NutritionLabelTable.tsx', 'utf8');

const targetStr = `                  <div className="font-medium text-theme-neutral">
                    <span className="text-slate-400 font-normal">{t.weightLabelWithColon}</span>{' '}
                    {missingWeight ? <span className="text-amber-500 font-bold">{t.unknown}</span> : \`\${item.estimatedWeightGrams}g\`}
                  </div>`;

const replaceStr = `                  <div className="font-medium text-theme-neutral">
                    <span className="text-slate-400 font-normal">
                      {String(item.rawNutritionLabel?.servingSize || item.nutritionFacts?.servingSize || '').toLowerCase().includes('ml') ? 'Volume:' : t.weightLabelWithColon}
                    </span>{' '}
                    {missingWeight ? <span className="text-amber-500 font-bold">{t.unknown}</span> : \`\${item.estimatedWeightGrams}\${String(item.rawNutritionLabel?.servingSize || item.nutritionFacts?.servingSize || '').toLowerCase().includes('ml') ? 'ml' : 'g'}\`}
                  </div>`;

if (code.includes(targetStr)) {
    fs.writeFileSync('src/components/chat-cards/NutritionLabelTable.tsx', code.replace(targetStr, replaceStr));
    console.log('Fixed NutritionLabelTable.tsx weight');
} else {
    console.log('Target string not found');
}
