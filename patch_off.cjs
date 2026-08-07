const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const target = `          const [usda, off] = await Promise.all([
            searchUSDA(cleaned, 3, dataTypes),
            searchOpenFoodFacts(cleaned, 3)
          ]);`;

const replacement = `          let offP = Promise.resolve([]);
          if (isBarcode || dataTypes.includes('Branded')) {
            offP = searchOpenFoodFacts(cleaned, 3);
          }
          const [usda, off] = await Promise.all([
            searchUSDA(cleaned, 3, dataTypes),
            offP
          ]);`;
code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
