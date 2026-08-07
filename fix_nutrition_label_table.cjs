const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/NutritionLabelTable.tsx', 'utf8');

const targetStr = `                            {(() => {
                               const ssRaw = String(item.rawNutritionLabel?.servingSize || item.nutritionFacts?.servingSize || '').toLowerCase();
                               if (ssRaw.includes('pack') || ssRaw.includes('wrap') || ssRaw.includes('container')) {
                                  return (item.estimatedWeightGrams > 0) ? 'per 100g' : 'Original';
                               }
                               if (ssRaw.includes('portion')) {
                                  return 'per portion';
                               }
                               return 'Original';
                            })()}`;

const replaceStr = `                            {(() => {
                               const ssRaw = String(item.rawNutritionLabel?.servingSize || item.nutritionFacts?.servingSize || '').trim();
                               if (ssRaw.toLowerCase().includes('pack') || ssRaw.toLowerCase().includes('wrap') || ssRaw.toLowerCase().includes('container')) {
                                  return (item.estimatedWeightGrams > 0) ? 'per 100g' : ssRaw || 'Original';
                               }
                               if (ssRaw.toLowerCase().includes('portion')) {
                                  return 'per portion';
                               }
                               return ssRaw ? ssRaw : 'Original';
                            })()}`;

if (code.includes(targetStr)) {
    fs.writeFileSync('src/components/chat-cards/NutritionLabelTable.tsx', code.replace(targetStr, replaceStr));
    console.log('Fixed NutritionLabelTable.tsx');
} else {
    console.log('Target string not found');
}
