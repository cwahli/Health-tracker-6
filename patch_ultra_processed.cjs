const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          if (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0 && (isAlreadyPreparedReceipt || rawMethod === 'raw')) {
            physicsEngineLabel = rawMethod === 'raw' ? "Raw (no added oil/salt)" : physicsEngineLabel + " (already in matched product)";
          }

          let infoTooltip = "";`;

const replacement = `          if (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0 && (isAlreadyPreparedReceipt || rawMethod === 'raw')) {
            physicsEngineLabel = rawMethod === 'raw' ? "Raw (no added oil/salt)" : physicsEngineLabel + " (already in matched product)";
          }

          let infoTooltip = "";`;

const patchStr = `          const isZeroCookingAddition = (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0);
          const isRawOrBeverage = (rawMethod === 'raw' || rawMethod === 'unknown' || !rawMethod || BEVERAGE_RAW_PATTERN.test(kwLower));`;

const patchReplacement = `          if (it.foodType === 'ultra_processed') {
            physicsEngineLabel = "Ultra-Processed Food";
            infoTooltip = "This item is classified as ultra-processed. Caloric density and macronutrients are derived directly from matched printed labels or known manufacturer data.";
          }

          const isZeroCookingAddition = (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0);
          const isRawOrBeverage = (rawMethod === 'raw' || rawMethod === 'unknown' || !rawMethod || BEVERAGE_RAW_PATTERN.test(kwLower));`;

if (content.includes(patchStr)) {
    content = content.replace(patchStr, patchReplacement);
    fs.writeFileSync('server.ts', content);
    console.log("Successfully patched ultra_processed in server.ts");
} else {
    console.log("Failed to find target string in server.ts");
}
