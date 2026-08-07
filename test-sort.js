const isLimitNutrient = (key) => ['calories', 'saturatedFat', 'sodium', 'addedSugar', 'totalFat', 'transFat', 'cholesterol', 'salt'].includes(key);

const data = {
  saturatedFat: { actual: 24, target: 12 },
  solubleFibre: { actual: 2.5, target: 15 },
  calories: { actual: 2250, target: 1850 },
  sodium: { actual: 2218, target: 2000 },
  potassium: { actual: 1440, target: 3500 },
  addedSugar: { actual: 5.4, target: 25 },
  protein: { actual: 112, target: 75 },
};

const getNutrientSortRank = (key) => {
  const d = data[key];
  const pct = d.actual / d.target;
  const isLimit = isLimitNutrient(key);
  
  let tier = 2;
  if (isLimit && pct > 1) {
    tier = 1;
  } else if (!isLimit && pct > 1) {
    tier = 3;
  }
  
  return { tier, pct };
};

const keys = Object.keys(data);
keys.sort((a, b) => {
  const infoA = getNutrientSortRank(a);
  const infoB = getNutrientSortRank(b);
  if (infoA.tier !== infoB.tier) return infoA.tier - infoB.tier;
  return infoB.pct - infoA.pct;
});
console.log(keys);
