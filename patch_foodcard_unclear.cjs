const fs = require('fs');
let content = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');

const targetStr = `function isItemUnclearOrLowConfidence(item: any): boolean {
  if (!item) return false;
  const conf = item.itemConfidence?.toLowerCase();
  const isLowOrMed = conf === 'low' || conf === 'medium' || (conf && (conf.includes('low') || conf.includes('medium')));
  const cleanFlags = getCleanAnomalyFlags(item);
  return isLowOrMed || cleanFlags.length > 0;
}`;

const replacement = `function isItemUnclearOrLowConfidence(item: any): boolean {
  if (!item) return false;
  const conf = (item.itemConfidence || '').toLowerCase();
  const isHigh = conf === 'high' || conf.includes('high');
  if (isHigh) return false; // If scout says it's high confidence, trust it and don't flag as unclear
  const isLowOrMed = conf === 'low' || conf === 'medium' || conf.includes('low') || conf.includes('medium');
  const cleanFlags = getCleanAnomalyFlags(item);
  return isLowOrMed || cleanFlags.length > 0;
}`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('src/components/chat-cards/FoodCard.tsx', content);
    console.log("Successfully patched isItemUnclearOrLowConfidence in FoodCard.tsx");
} else {
    console.log("Failed to find target string in FoodCard.tsx");
}
