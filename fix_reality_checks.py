import re

with open('server_pure_helpers.ts', 'r') as f:
    content = f.read()

kimchi_logic = """
  // 2. Fibre Reality Check (Specific for Kimchi / Radish)
  const isKimchiOrRadish = nameLower.includes('kimchi') || nameLower.includes('radish') || nameLower.includes('daikon') || nameLower.includes('kkakdugi');
  if (isKimchiOrRadish && (!itemNutrients.totalFibre || itemNutrients.totalFibre < 1)) {
    // USDA often lacks fibre for Kimchi/Radish. Base estimation:
    // Radish/Kimchi has about 1.6g total fibre and 0.5g soluble fibre per 100g.
    const expectedFibre = parseFloat(((1.6 / 100) * itemWeight).toFixed(2));
    const expectedSoluble = parseFloat(((0.5 / 100) * itemWeight).toFixed(2));
    if (addDebugLog) {
      addDebugLog(`[Dietitian Reality Check] Applied fibre estimation for "${itemName}" (kimchi/radish). Added ${expectedFibre}g total fibre, ${expectedSoluble}g soluble fibre.`);
    }
    itemNutrients.totalFibre = expectedFibre;
    itemNutrients.solubleFibre = expectedSoluble;
  }
"""

content = content.replace('// Zero-macro fallback', kimchi_logic + '\n  // Zero-macro fallback')
# Wait, zero-macro fallback is in server_nutrient_aggregation.ts. Let's place it at the end of applyNutrientRealityChecks.

end_of_func = """
    itemNutrients.sodium = realisticSodium;
  }
}
"""

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
}
"""

content = content.replace(end_of_func, replacement)

with open('server_pure_helpers.ts', 'w') as f:
    f.write(content)
