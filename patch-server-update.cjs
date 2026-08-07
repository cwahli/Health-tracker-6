const fs = require('fs');
let content = fs.readFileSync('serverBrandMenu.ts', 'utf8');

content = content.replace(
  "serving_grams,\n          nutrients,",
  "serving_grams,\n          basis_type,\n          nutrients,"
);
content = content.replace(
  "row.serving_grams = serving_grams;\n        row.nutrients",
  "row.serving_grams = serving_grams;\n        row.basis_type = basis_type;\n        row.nutrients"
);

fs.writeFileSync('serverBrandMenu.ts', content);
