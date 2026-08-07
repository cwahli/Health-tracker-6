const fs = require('fs');

let content = fs.readFileSync('src/components/chat-cards/ComprehensiveNutrientsTable.tsx', 'utf8');

content = content.replace(
  "language?: string;",
  "language?: string;\n  lockedNutrientKeys?: string[];"
);

content = content.replace(
  "({ nutrients, language = 'en' }) => {",
  "({ nutrients, language = 'en', lockedNutrientKeys }) => {"
);

// We define the logic to check if a key is locked
const isLockedLogic = `
  const checkIsLocked = (nutKey: string) => {
    if (!lockedNutrientKeys || lockedNutrientKeys.length === 0) return true; // If no locked keys info, assume all are locked or don't show warnings
    const normLower = String(nutKey).toLowerCase();
    return lockedNutrientKeys.some((lk: string) => {
      const lkLower = String(lk).toLowerCase();
      return lkLower === normLower ||
        (normLower === 'carbohydrates' && (lkLower === 'carbohydrate' || lkLower === 'carbs' || lkLower === 'totalcarbohydrate')) ||
        (normLower === 'totalfat' && (lkLower === 'fat' || lkLower === 'totalfat')) ||
        (normLower === 'totalfibre' && (lkLower === 'fiber' || lkLower === 'fibre' || lkLower === 'totalfibre')) ||
        (normLower === 'calories' && (lkLower === 'energy' || lkLower === 'cals'));
    });
  };
`;

content = content.replace(
  "  const coreKeys =",
  isLockedLogic + "\n  const coreKeys ="
);

content = content.replace(
  "📋 Comprehensive Nutrient Values (31 Nutrients)",
  "📋 Comprehensive Nutrient Values (31 Nutrients)\n          {lockedNutrientKeys && lockedNutrientKeys.length > 0 && <span className=\"ml-2 text-amber-500 normal-case\">(⚠️ = estimated)</span>}"
);

const spanTarget = `<span className="font-semibold text-slate-800 dark:text-slate-100">
                      {val !== undefined && val !== null && val !== '' && val !== '—' ? formatNutrientDisplayValue(val, nut.unit) : \`--\`}
                    </span>`;

const spanReplace = `<span className="font-semibold text-slate-800 dark:text-slate-100">
                      {val !== undefined && val !== null && val !== '' && val !== '—' ? (
                        <>
                          {formatNutrientDisplayValue(val, nut.unit)}
                          {!checkIsLocked(nut.key) && <span className="text-amber-500 ml-1 text-[9px]" title="Estimated by AI">⚠️</span>}
                        </>
                      ) : \`--\`}
                    </span>`;

content = content.replaceAll(spanTarget, spanReplace);

fs.writeFileSync('src/components/chat-cards/ComprehensiveNutrientsTable.tsx', content);
