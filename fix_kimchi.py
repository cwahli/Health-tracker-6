import re

with open('server_pure_helpers.ts', 'r') as f:
    content = f.read()

replacement = """
    itemNutrients.sodium = realisticSodium;
  }

  // 2. Fibre Reality Check (Specific for Kimchi / Radish)
  const isKimchiOrRadish = nameLower.includes('kimchi') || nameLower.includes('radish') || nameLower.includes('daikon') || nameLower.includes('kkakdugi');
  if (isKimchiOrRadish && (!itemNutrients.totalFibre || itemNutrients.totalFibre < 0.5)) {
    const expectedFibre = parseFloat(((1.6 / 100) * itemWeight).toFixed(2));
    const expectedSoluble = parseFloat(((0.5 / 100) * itemWeight).toFixed(2));
    if (addDebugLog) {
      addDebugLog(`[Dietitian Reality Check] Applied fibre estimation for "${itemName}" (kimchi/radish). Added ${expectedFibre}g total fibre, ${expectedSoluble}g soluble fibre.`);
    }
    itemNutrients.totalFibre = Math.max(itemNutrients.totalFibre || 0, expectedFibre);
    itemNutrients.solubleFibre = Math.max(itemNutrients.solubleFibre || 0, expectedSoluble);
  }
"""

content = content.replace("    itemNutrients.sodium = realisticSodium;\n  }\n", replacement + "\n")

with open('server_pure_helpers.ts', 'w') as f:
    f.write(content)
