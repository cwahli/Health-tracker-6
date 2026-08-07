const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          const baseNutrients = dbMatchMap.get(bestMatch.id);
          const factor = compWeight / 100;
          const cCal = parseFloat(((baseNutrients.calories || 0) * factor).toFixed(1));
          const cP = parseFloat(((baseNutrients.protein || 0) * factor).toFixed(1));
          const cF = parseFloat(((baseNutrients.totalFat || 0) * factor).toFixed(1));
          const cSatFat = parseFloat(((baseNutrients.saturatedFat || 0) * factor).toFixed(1));
          const cNa = parseFloat(((baseNutrients.sodium || 0) * factor).toFixed(1));
          const cCarbs = parseFloat(((baseNutrients.carbohydrates || 0) * factor).toFixed(1));

          const existingResolution = resolvedComponentsById.get(String(bestMatch.id));
          if (existingResolution) {
            // Same underlying ingredient already recorded for this item — merge weight/nutrients
            // into the existing row instead of creating a duplicate.
            if (existingResolution.isPrimary) {
              primaryBaseWeightG += compWeight;
            } else if (existingResolution.sauceIndex !== undefined) {
              const target = componentsDetailList[existingResolution.sauceIndex];
              target.weightGrams += compWeight;
              target.calories = parseFloat((target.calories + cCal).toFixed(1));
              target.protein = parseFloat((target.protein + cP).toFixed(1));
              target.totalFat = parseFloat((target.totalFat + cF).toFixed(1));
              target.saturatedFat = parseFloat((target.saturatedFat + cSatFat).toFixed(1));
              target.sodium = parseFloat((target.sodium + cNa).toFixed(1));
              target.carbohydrates = parseFloat(((target.carbohydrates || 0) + cCarbs).toFixed(1));
            }`;

const replacementStr = `          const baseNutrients = dbMatchMap.get(bestMatch.id);
          const factor = compWeight / 100;

          const existingResolution = resolvedComponentsById.get(String(bestMatch.id));
          if (existingResolution) {
            // Same underlying ingredient already recorded for this item — merge weight/nutrients
            // into the existing row instead of creating a duplicate.
            if (existingResolution.isPrimary) {
              primaryBaseWeightG += compWeight;
            } else if (existingResolution.sauceIndex !== undefined) {
              const target = componentsDetailList[existingResolution.sauceIndex];
              target.weightGrams += compWeight;
              NUTRIENT_KEYS.forEach(key => {
                if (baseNutrients[key] !== undefined && baseNutrients[key] !== null) {
                  target[key] = parseFloat(((target[key] || 0) + (baseNutrients[key] * factor)).toFixed(1));
                }
              });
            }`;

content = content.replace(targetStr, replacementStr);

const targetStr2 = `          componentsDetailList.push({
            name: compLabel,
            searchQuery: query,
            weightGrams: compWeight,
            calories: cCal,
            protein: cP,
            totalFat: cF,
            saturatedFat: cSatFat,
            sodium: cNa,
            carbohydrates: cCarbs,
            dbId: String(bestMatch.id),
            dbSource: bestMatch.source
          });`;

const replacementStr2 = `          const newComp: any = {
            name: compLabel,
            searchQuery: query,
            weightGrams: compWeight,
            dbId: String(bestMatch.id),
            dbSource: bestMatch.source
          };
          NUTRIENT_KEYS.forEach(key => {
            if (baseNutrients[key] !== undefined && baseNutrients[key] !== null) {
              newComp[key] = parseFloat((baseNutrients[key] * factor).toFixed(1));
            } else {
              newComp[key] = 0;
            }
          });
          componentsDetailList.push(newComp);`;

content = content.replace(targetStr2, replacementStr2);

fs.writeFileSync('server.ts', content);
