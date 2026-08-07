import fs from 'fs';
import path from 'path';

console.log("Starting verification of HOTFIX_STARTSWITH_OPTIONAL_CHAINING...");

function assertContains(filePath, substring) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(substring)) {
    console.error(`Assertion Failed: ${filePath} does not contain pattern: ${substring}`);
    process.exit(1);
  }
}

// S1: Guard msg.id and m.id
assertContains('src/components/LogChat.tsx', 'm.id?.startsWith(\'welcome_\')');
assertContains('src/components/LogChat.tsx', '!msg.id?.startsWith(\'welcome_\')');
assertContains('src/components/LogChat.tsx', 'msg.id?.startsWith(\'welcome_\')');

// S2: Optional Chaining for Color & Font Keys in Header.tsx
assertContains('src/components/Header.tsx', 'c.key?.startsWith(\'custom_\')');
assertContains('src/components/Header.tsx', 'f.key?.startsWith(\'custom_\')');
assertContains('src/components/Header.tsx', 'color.key?.startsWith(\'custom_\')');

// S3: NutrientPieChart
assertContains('src/components/NutrientPieChart.tsx', 'typeof highlightColor === \'string\' && highlightColor.startsWith(\'rgb(\')');

// S4: imageResolver
assertContains('src/utils/imageResolver.ts', 'typeof baseImg === \'string\' && !baseImg.startsWith(\'ref:\')');
assertContains('src/utils/imageResolver.ts', 'typeof nextImg === \'string\' && !nextImg.startsWith(\'ref:\')');

console.log("All assertions passed successfully! Exit code 0.");
process.exit(0);
