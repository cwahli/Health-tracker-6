const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          const isZeroCookingAddition = (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0);
          const isRawOrBeverage = (rawMethod === 'raw' || rawMethod === 'unknown' || !rawMethod || BEVERAGE_RAW_PATTERN.test(kwLower));

          // Only output a preparation physics row if there are non-zero additions OR if it's a cooked dish (where explaining 0 added oil due to pre-packaged/prepared state is meaningful)
          if (!isZeroCookingAddition || !isRawOrBeverage) {`;

const replacement = `          const isZeroCookingAddition = (cookingCal === 0 && cookingFat === 0 && cookingSatFat === 0 && cookingNa === 0);
          const isRawOrBeverage = (rawMethod === 'raw' || rawMethod === 'unknown' || !rawMethod || BEVERAGE_RAW_PATTERN.test(kwLower));

          // Only output a preparation physics row if there are non-zero additions OR if it's a cooked dish (where explaining 0 added oil due to pre-packaged/prepared state is meaningful)
          if (!isZeroCookingAddition || !isRawOrBeverage || it.foodType === 'ultra_processed') {`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('server.ts', content);
    console.log("Successfully patched ultra_processed display in server.ts");
} else {
    console.log("Failed to find target string in server.ts");
}
