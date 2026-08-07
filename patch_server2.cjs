const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Sanitize any bare target values in biomarkerTargets or nutrientTargets[\s\S]*?\/\/ Ensure generalNutrientTargets is fully populated with formatted keys/;

const replacement = `// Sanitize any bare target values in priorityNutrientTargets
    if (parsedData?.report?.riskCategories && Array.isArray(parsedData.report.riskCategories)) {
      parsedData.report.riskCategories.forEach((cat: any) => {
        if (Array.isArray(cat.priorityNutrientTargets)) {
          cat.priorityNutrientTargets.forEach((nt: any) => {
            if (nt.targetValue) {
              const tv = String(nt.targetValue).trim();
              if (tv === "0") {
                nt.targetValue = "< 1g";
              }
            }
          });
        }
      });
    }

    // Ensure generalNutrientTargets is fully populated with formatted keys`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
