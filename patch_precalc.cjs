const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const rawLabelHasData = item.rawNutritionLabel && typeof item.rawNutritionLabel === 'object'
        ? Object.keys(item.rawNutritionLabel).some((k: string) => {
            if (k === 'servingSize' || k === 'weight' || k === 'servingsPerContainer') return false;
            const v = item.rawNutritionLabel[k];
            return v !== undefined && v !== null && v !== '' && v !== '-' && v !== '--';
          })
        : false;

      let hasComponents = false;

      if (rawLabelHasData) {`;

const replacement = `      const rawLabelHasData = item.rawNutritionLabel && typeof item.rawNutritionLabel === 'object'
        ? Object.keys(item.rawNutritionLabel).some((k: string) => {
            if (k === 'servingSize' || k === 'weight' || k === 'servingsPerContainer') return false;
            const v = item.rawNutritionLabel[k];
            return v !== undefined && v !== null && v !== '' && v !== '-' && v !== '--';
          })
        : false;

      let hasComponents = false;

      // Inherit previously calculated nutrient profile if available
      if (item.primaryBase100g && Object.keys(item.primaryBase100g).length > 0 && !item.isUnverified && item.dbId) {
        primaryBase100g = item.primaryBase100g;
        primaryDbId = item.dbId;
        primaryDbSource = item.dbSource || "estimated";
        primaryBaseMatchName = item.primaryBaseMatchName || item.originalName || item.keyword;
        primaryBaseWeightG = item.primaryBaseWeightG || itemWeight;
        dbMatchMap.set(primaryDbId, primaryBase100g);
        
        if (item.saucesDetailList) {
          saucesDetailList.push(...item.saucesDetailList);
        }
        if (item.components && item.components.length > 0) {
          hasComponents = true;
        }

        const factor = primaryBaseWeightG / 100;
        coreKeys.forEach(key => {
          if (primaryBase100g[key] !== undefined && primaryBase100g[key] !== null) {
            aggregatedNutrients[key] = parseFloat((primaryBase100g[key] * factor).toFixed(2));
          }
        });

      } else if (rawLabelHasData) {`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
