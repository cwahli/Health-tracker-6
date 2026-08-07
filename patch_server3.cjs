const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const t = `          const baseNutrients = dbMatchMap.get(bestMatch.id);
          if (baseNutrients) {
            coreKeys.forEach(key => {
              if ((primaryBase100g![key] === 0 || primaryBase100g![key] === undefined) && baseNutrients[key] !== undefined && baseNutrients[key] !== 0) {
                 primaryBase100g![key] = baseNutrients[key];
              }
            });
          const factor = itemWeight / 100;
          coreKeys.forEach(key => {
            if (primaryBase100g![key] !== undefined) {
              aggregatedNutrients[key] = parseFloat((primaryBase100g![key] * factor).toFixed(2));
            }
          });
        }
      } else if (item.components && Array.isArray(item.components) && item.components.length > 0) {`;

const r = `          const baseNutrients = dbMatchMap.get(bestMatch.id);
          if (baseNutrients) {
            coreKeys.forEach(key => {
              if ((primaryBase100g![key] === 0 || primaryBase100g![key] === undefined) && baseNutrients[key] !== undefined && baseNutrients[key] !== 0) {
                 primaryBase100g![key] = baseNutrients[key];
              }
            });
          }
        }
        dbMatchMap.set(primaryDbId, primaryBase100g);

        const factor = itemWeight / 100;
        coreKeys.forEach(key => {
          if (primaryBase100g![key] !== undefined) {
            aggregatedNutrients[key] = parseFloat((primaryBase100g![key] * factor).toFixed(2));
          }
        });
      } else if (item.components && Array.isArray(item.components) && item.components.length > 0) {`;

if (content.includes(t)) {
    content = content.replace(t, r);
    console.log("Successfully fixed brackets");
} else {
    console.log("Failed to find t");
}
fs.writeFileSync('server.ts', content);
