const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/if \(Array\.isArray\(cat\.nutrientTargets\)\) \{/g, "if (Array.isArray(cat.nutrientTargets) || Array.isArray(cat.priorityNutrientTargets)) {");
code = code.replace(/cat\.nutrientTargets\.forEach/g, "(cat.priorityNutrientTargets || cat.nutrientTargets).forEach");

fs.writeFileSync('src/components/HomeTab.tsx', code);
