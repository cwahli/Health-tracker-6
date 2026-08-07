const fs = require('fs');
const content = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');
const regex = /const getNutrientSortRank = React\.useCallback\(\(key: string\) => \{([\s\S]*?)\}, \[report, getAdjustedTarget, getAverageIntake, rollingDays, isLimitNutrient\]\);/
const match = content.match(regex);
console.log(match ? match[0] : 'No match');
