const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // Map and construct itemsBreakdown and aggregate all nutrients
      if (rawFoodData.itemsBreakdown && Array.isArray(rawFoodData.itemsBreakdown) && rawFoodData.itemsBreakdown.length > 0) {
        // Enrich items with originalLocalName`;

const replaceStr = `      // Map and construct itemsBreakdown and aggregate all nutrients
      if (rawFoodData.itemsBreakdown && Array.isArray(rawFoodData.itemsBreakdown) && rawFoodData.itemsBreakdown.length > 0) {
        // [Label Merge] Fold standalone label items into their paired food item
        if (rawFoodData.itemsBreakdown.length > 1) {
          const labelIndices = [];
          rawFoodData.itemsBreakdown.forEach((item, idx) => {
            const orig = (item.canonicalDbName || item.name || "").toLowerCase();
            const isLabel = String(item.dbSource).toLowerCase() === 'label' || orig.includes("nutrition fact") || orig.includes("informasi nilai gizi") || orig.includes("komposisi") || orig.includes("nutrition label") || orig.includes("back of package") || orig.includes("printed_packaging_label");
            if (isLabel) labelIndices.push(idx);
          });

          // Sort in descending order to splice safely
          labelIndices.reverse().forEach(labelIdx => {
            const labelItem = rawFoodData.itemsBreakdown[labelIdx];
            let primaryItem = null;

            // Find nearest non-label item (prefer preceding)
            for (let j = labelIdx - 1; j >= 0; j--) {
               if (!labelIndices.includes(j)) { primaryItem = rawFoodData.itemsBreakdown[j]; break; }
            }
            if (!primaryItem) {
               for (let j = labelIdx + 1; j < rawFoodData.itemsBreakdown.length; j++) {
                  if (!labelIndices.includes(j)) { primaryItem = rawFoodData.itemsBreakdown[j]; break; }
               }
            }

            if (primaryItem) {
                primaryItem.labelNutrientsPerServing = primaryItem.labelNutrientsPerServing || labelItem.labelNutrientsPerServing || labelItem.rawNutritionLabel || {
                    servingSizeGrams: labelItem.weightGrams || 100,
                    calories: labelItem.calories || 0,
                    protein: labelItem.protein || 0,
                    totalFat: labelItem.totalFat || 0,
                    carbohydrates: labelItem.carbohydrates || 0
                };
                primaryItem.dbSource = 'label';
                addDebugLog(\`[Label Merge] Folded LLM label "\${labelItem.canonicalDbName || labelItem.name}" into "\${primaryItem.canonicalDbName || primaryItem.name}".\`);
                rawFoodData.itemsBreakdown.splice(labelIdx, 1);
            }
          });
        }

        // Enrich items with originalLocalName`;

if (code.includes(targetStr)) {
    fs.writeFileSync('server.ts', code.replace(targetStr, replaceStr));
    console.log('Fixed label merge in server.ts');
} else {
    console.log('Target string not found');
}
