const fs = require('fs');

let content = fs.readFileSync('serverBrandMenu.ts', 'utf8');

content = content.replace(
  "const serving_grams = req.body?.serving_grams != null ? Number(req.body.serving_grams) : null;",
  "const serving_grams = req.body?.serving_grams != null ? Number(req.body.serving_grams) : null;\n    const basis_type = String(req.body?.basis_type || 'per_dish');"
);

content = content.replace(
  "serving_grams,",
  "serving_grams,\n        basis_type,"
);
content = content.replace(
  "serving_grams,",
  "serving_grams,\n          basis_type,"
);

fs.writeFileSync('serverBrandMenu.ts', content);
