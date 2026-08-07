const fs = require('fs');
let content = fs.readFileSync('src/components/chat-cards/NutritionLabelTable.tsx', 'utf8');

const targetHeaderStr = `                          <th className="py-1.5 px-2 font-bold text-theme-text-secondary border-b border-theme-border/50">
                            Original
                          </th>`;

const replacementHeaderStr = `                          <th className="py-1.5 px-2 font-bold text-theme-text-secondary border-b border-theme-border/50">
                            {(() => {
                               const ssRaw = String(item.rawNutritionLabel?.servingSize || item.nutritionFacts?.servingSize || '').toLowerCase();
                               if (ssRaw.includes('pack') || ssRaw.includes('wrap') || ssRaw.includes('container')) {
                                  return (item.estimatedWeightGrams > 0) ? 'per 100g' : 'Original';
                               }
                               if (ssRaw.includes('portion')) {
                                  return 'per portion';
                               }
                               return 'Original';
                            })()}
                          </th>`;

content = content.replace(targetHeaderStr, replacementHeaderStr);

const targetRowStr = `                          let totalStr = '-';
                          if (numVal !== null && !missingWeight) {
                            let multiplier = 1;
                            const wasFromRaw = item.rawNutritionLabel?.[k] !== undefined;
                            
                            if (wasFromRaw && item.rawNutritionLabel?.servingSize) {
                               const ssMatch = String(item.rawNutritionLabel.servingSize).match(/[\\d.]+/);
                               if (ssMatch) {
                                 multiplier = item.estimatedWeightGrams / parseFloat(ssMatch[0]);
                               } else {
                                 multiplier = item.estimatedWeightGrams / 100;
                               }
                            } else {
                               multiplier = item.estimatedWeightGrams / 100;
                            }
                            
                            const total = (numVal * multiplier).toFixed(1).replace(/\\.0$/, '');
                            const nutDef = nutrientDefinitions.find((n: any) => n.key.toLowerCase() === k.toLowerCase());
                            const defaultUnit = k.toLowerCase().includes('calories') ? 'kcal' : (isServingField ? '' : (nutDef ? nutDef.unit : 'g'));
                            const unit = String(originalVal).replace(/[\\d.\\s]/g, '') || defaultUnit;
                            if (isServingField) {
                              totalStr = '-';
                            } else {
                              totalStr = \`\${total}\${unit}\`;
                            }
                          }

                          let originalDisplay = '-';
                          if (originalVal !== undefined && originalVal !== null) {
                            const hasUnit = /[a-zA-Z%]/.test(String(originalVal));
                            if (hasUnit && !isServingField) {
                              originalDisplay = String(originalVal);
                            } else {
                              const nutDef = nutrientDefinitions.find((n: any) => n.key.toLowerCase() === k.toLowerCase());
                              const defaultUnit = k.toLowerCase().includes('calories') ? 'kcal' : (isServingField ? '' : (nutDef ? nutDef.unit : 'g'));
                              originalDisplay = \`\${originalVal}\${defaultUnit}\`;
                            }
                          }`;

const replacementRowStr = `                          let totalStr = '-';
                          let originalDisplay = '-';
                          
                          if (originalVal !== undefined && originalVal !== null) {
                            const hasUnit = /[a-zA-Z%]/.test(String(originalVal));
                            const nutDef = nutrientDefinitions.find((n: any) => n.key.toLowerCase() === k.toLowerCase());
                            const defaultUnit = k.toLowerCase().includes('calories') ? 'kcal' : (isServingField ? '' : (nutDef ? nutDef.unit : 'g'));
                            const unit = String(originalVal).replace(/[\\d.\\s]/g, '') || defaultUnit;
                            
                            originalDisplay = (hasUnit && !isServingField) ? String(originalVal) : \`\${originalVal}\${defaultUnit}\`;
                            
                            if (numVal !== null && !missingWeight && !isServingField) {
                              let multiplier = 1;
                              let displayVal = numVal;
                              const wasFromRaw = item.rawNutritionLabel?.[k] !== undefined;
                              
                              if (wasFromRaw && item.rawNutritionLabel?.servingSize) {
                                 const ssRaw = String(item.rawNutritionLabel.servingSize).toLowerCase();
                                 const isPack = ssRaw.includes('pack') || ssRaw.includes('wrap') || ssRaw.includes('container');
                                 const isPortion = ssRaw.includes('portion');
                                 const ssMatch = ssRaw.match(/[\\d.]+/);
                                 
                                 if (isPack || isPortion) {
                                    // Original values are already for the entire pack/portion
                                    // Total should just be the original values!
                                    multiplier = 1;
                                    
                                    // If we renamed the column to "per 100g", we need to scale down originalDisplay
                                    if (isPack && item.estimatedWeightGrams > 0) {
                                      displayVal = numVal * (100 / item.estimatedWeightGrams);
                                      originalDisplay = \`\${Number(displayVal.toFixed(1)).toString()}\${unit}\`;
                                    }
                                 } else if (ssMatch) {
                                   multiplier = item.estimatedWeightGrams / parseFloat(ssMatch[0]);
                                 } else {
                                   multiplier = item.estimatedWeightGrams / 100;
                                 }
                              } else {
                                 multiplier = item.estimatedWeightGrams / 100;
                              }
                              
                              const total = (numVal * multiplier).toFixed(1).replace(/\\.0$/, '');
                              totalStr = \`\${total}\${unit}\`;
                            }
                          }`;

if (content.includes(targetHeaderStr)) {
    content = content.replace(targetHeaderStr, replacementHeaderStr);
    content = content.replace(targetRowStr, replacementRowStr);
    fs.writeFileSync('src/components/chat-cards/NutritionLabelTable.tsx', content);
    console.log("Successfully patched NutritionLabelTable.tsx");
} else {
    console.log("Failed to find target string in NutritionLabelTable.tsx");
}
