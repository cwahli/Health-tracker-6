const fs = require('fs');

// 1. Add build31NutrientsMarkdownServer to server_pure_helpers.ts
let pureHelpers = fs.readFileSync('server_pure_helpers.ts', 'utf8');
const helperFunction = `
export function build31NutrientsMarkdownServer(nutrients: Record<string, any>): string {
  if (!nutrients) return '';

  const coreList = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
    { key: 'totalFat', label: 'Total Fat', unit: 'g' },
    { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g' },
    { key: 'transFat', label: 'Trans Fat', unit: 'g' },
    { key: 'addedSugar', label: 'Added Sugar', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'potassium', label: 'Potassium', unit: 'mg' },
    { key: 'totalFibre', label: 'Total Fibre', unit: 'g' },
    { key: 'solubleFibre', label: 'Soluble Fibre', unit: 'g' },
  ];

  const additionalList = [
    { key: 'unsaturatedFat', label: 'Unsaturated Fat', unit: 'g' },
    { key: 'omega3', label: 'Omega-3', unit: 'g' },
    { key: 'salt', label: 'Salt', unit: 'g' },
    { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
    { key: 'calcium', label: 'Calcium', unit: 'mg' },
    { key: 'iron', label: 'Iron', unit: 'mg' },
    { key: 'zinc', label: 'Zinc', unit: 'mg' },
    { key: 'selenium', label: 'Selenium', unit: 'mcg' },
    { key: 'iodine', label: 'Iodine', unit: 'mcg' },
    { key: 'phosphorus', label: 'Phosphorus', unit: 'mg' },
    { key: 'vitaminD', label: 'Vitamin D', unit: 'IU' },
    { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg' },
    { key: 'folate', label: 'Folate (B9)', unit: 'mcg' },
    { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
    { key: 'vitaminE', label: 'Vitamin E', unit: 'mg' },
    { key: 'vitaminK', label: 'Vitamin K', unit: 'mcg' },
    { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
    { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg' },
    { key: 'thiamine', label: 'Thiamine (B1)', unit: 'mg' },
    { key: 'riboflavin', label: 'Riboflavin (B2)', unit: 'mg' },
    { key: 'niacin', label: 'Niacin (B3)', unit: 'mg' },
  ];

  const fmt = (v: any, unit: string) => {
    if (v === undefined || v === null || isNaN(Number(v))) return '--';
    const num = Math.round(Number(v) * 100) / 100;
    return unit ? \`\${num} \${unit}\` : \`\${num}\`;
  };

  const coreRows = coreList.map(item => \`| \${item.label} | \${fmt(nutrients[item.key], item.unit)} |\`);
  const addRows = additionalList.map(item => \`| \${item.label} | \${fmt(nutrients[item.key], item.unit)} |\`);

  return [
    "\\n\\n### 📋 Comprehensive Nutrient Values (31 Nutrients)\\n",
    "#### Core Nutrients (11)",
    "| Nutrient | Value |",
    "|---|---|",
    ...coreRows,
    "\\n#### Additional Nutrients (20)",
    "| Nutrient | Value |",
    "|---|---|",
    ...addRows
  ].join("\\n");
}
`;

if (!pureHelpers.includes('build31NutrientsMarkdownServer')) {
  pureHelpers += '\n' + helperFunction;
  fs.writeFileSync('server_pure_helpers.ts', pureHelpers);
  console.log("Updated server_pure_helpers.ts");
}

// 2. Import build31NutrientsMarkdownServer in server.ts and append to receiptTable
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes('build31NutrientsMarkdownServer')) {
  serverCode = serverCode.replace(
    'import { extractBalancedJson, sanitizeMealWeight, findItemIndexInList, getUSDANutrientValue, extractUSDANutrientsPer100g, checkIfItemIsAlreadyPrepared, applyNutrientRealityChecks, synchronizeNarrativeText, evaluateNutrientWarnings } from "./server_pure_helpers";',
    'import { extractBalancedJson, sanitizeMealWeight, findItemIndexInList, getUSDANutrientValue, extractUSDANutrientsPer100g, checkIfItemIsAlreadyPrepared, applyNutrientRealityChecks, synchronizeNarrativeText, evaluateNutrientWarnings, build31NutrientsMarkdownServer } from "./server_pure_helpers";'
  );

  const receiptTarget = `receiptTable += \`| **🏆 GRAND MEAL TOTAL - \${grandWeight}g** | **\${fVal(finalCal)}** | **\${fVal(finalP, 'g')}** | **\${fVal(finalSatFat, 'g')}** | **\${fVal(finalNa, 'mg')}** |\\n\`;`;
  const receiptRep = `receiptTable += \`| **🏆 GRAND MEAL TOTAL - \${grandWeight}g** | **\${fVal(finalCal)}** | **\${fVal(finalP, 'g')}** | **\${fVal(finalSatFat, 'g')}** | **\${fVal(finalNa, 'mg')}** |\\n\`;\n        if (parsedData.nutrients) {\n          receiptTable += build31NutrientsMarkdownServer(parsedData.nutrients);\n        }`;

  serverCode = serverCode.replace(receiptTarget, receiptRep);
  fs.writeFileSync('server.ts', serverCode);
  console.log("Updated server.ts");
}

// 3. Update FoodCard.tsx
let foodCardCode = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');

const helperInFoodCard = `
const getFullReceiptTable = (pendingFoodLog: any, lang: string = 'en') => {
  if (!pendingFoodLog?.receiptTable) return '';
  let table = pendingFoodLog.receiptTable;
  
  if (!table.includes("Comprehensive Nutrient Values") && !table.includes("31 Nutrients") && pendingFoodLog.nutrients) {
    const coreKeys = ["calories", "protein", "carbohydrates", "totalFat", "saturatedFat", "transFat", "addedSugar", "sodium", "potassium", "totalFibre", "solubleFibre"];
    
    const coreRows = nutrientDefinitions
      .filter(nut => coreKeys.includes(nut.key))
      .map(nut => {
        const val = pendingFoodLog.nutrients?.[nut.key];
        const displayVal = (val !== undefined && val !== null && !isNaN(Number(val)))
          ? formatNutrientDisplayValue(val, nut.unit)
          : '--';
        const label = nut.labels[lang] || nut.labels.en || nut.key;
        return \`| \${label} | \${displayVal} |\`;
      });

    const additionalRows = nutrientDefinitions
      .filter(nut => !coreKeys.includes(nut.key))
      .map(nut => {
        const val = pendingFoodLog.nutrients?.[nut.key];
        const displayVal = (val !== undefined && val !== null && !isNaN(Number(val)))
          ? formatNutrientDisplayValue(val, nut.unit)
          : '--';
        const label = nut.labels[lang] || nut.labels.en || nut.key;
        return \`| \${label} | \${displayVal} |\`;
      });

    table += "\\n\\n### 📋 Comprehensive Nutrient Values (31 Nutrients)\\n\\n" +
      "#### Core Nutrients (11)\\n" +
      "| Nutrient | Value |\\n" +
      "|---|---|\\n" +
      coreRows.join("\\n") + "\\n\\n" +
      "#### Additional Nutrients (20)\\n" +
      "| Nutrient | Value |\\n" +
      "|---|---|\\n" +
      additionalRows.join("\\n");
  }
  
  return table;
};
`;

if (!foodCardCode.includes('const getFullReceiptTable =')) {
  // Insert helper right before export const FoodCard
  foodCardCode = foodCardCode.replace('export const FoodCard: React.FC<FoodCardProps>', helperInFoodCard + '\nexport const FoodCard: React.FC<FoodCardProps>');

  // Replace ScratchpadMarkdownViewer line
  const oldViewer = `<ScratchpadMarkdownViewer content={msg.data.pendingFoodLog.receiptTable} className="!bg-transparent !p-0 !border-0" showCopyButton={true} />`;
  const newViewer = `<ScratchpadMarkdownViewer content={getFullReceiptTable(msg.data.pendingFoodLog, profile?.language)} className="!bg-transparent !p-0 !border-0" showCopyButton={true} />`;

  foodCardCode = foodCardCode.replace(oldViewer, newViewer);
  fs.writeFileSync('src/components/chat-cards/FoodCard.tsx', foodCardCode);
  console.log("Updated FoodCard.tsx");
}

