const fs = require('fs');
let content = fs.readFileSync('src/components/NutritionDataBrowserModal.tsx', 'utf8');

content = content.replace("import { NutritionLabelTable } from './chat-cards/NutritionLabelTable';", "import { ComprehensiveNutrientsTable } from './chat-cards/ComprehensiveNutrientsTable';");

// Replace restaurant chain items
content = content.replace(
  '<NutritionLabelTable activeScoutItems={[toScoutItem(item)]} defaultOpen={false} hideOwnToggle={false} />',
  '<ComprehensiveNutrientsTable nutrients={item.nutrients || {}} />'
);
content = content.replace(
  '<NutritionLabelTable activeScoutItems={[toScoutItem(item)]} defaultOpen={false} hideOwnToggle={false} />',
  '<ComprehensiveNutrientsTable nutrients={item.nutrients || {}} />'
);
content = content.replace(
  '<NutritionLabelTable activeScoutItems={[toScoutItem(item)]} defaultOpen={false} hideOwnToggle={false} />',
  '<ComprehensiveNutrientsTable nutrients={item.nutrients || {}} />'
);

// Replace catalog items
content = content.replace(
  '<NutritionLabelTable activeScoutItems={[toCatalogScoutItem(item)]} defaultOpen={true} hideOwnToggle={true} />',
  '<ComprehensiveNutrientsTable nutrients={item.nutrients_per_100g || item.core_nutrients || {}} />'
);
content = content.replace(
  '<NutritionLabelTable activeScoutItems={[toCatalogScoutItem(item)]} defaultOpen={true} hideOwnToggle={true} />',
  '<ComprehensiveNutrientsTable nutrients={item.nutrients_per_100g || item.core_nutrients || {}} />'
);

// Remove `renderNutrientSummaryLine` usage
// It's used in catalog items: `{renderNutrientSummaryLine(nutrients)}`
content = content.replace('{renderNutrientSummaryLine(nutrients)}', '');

fs.writeFileSync('src/components/NutritionDataBrowserModal.tsx', content);
