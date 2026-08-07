const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetSchema = `        foodData: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            name: { type: Type.STRING },
            itemsBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  canonicalDbName: { type: Type.STRING, description: "You MUST preserve the specific toppings or modifiers identified in the originalName (e.g., 'Siomay with mushroom topping' instead of just 'Siomay')." },
                  weightGrams: { type: Type.INTEGER, description: "Weight of ingredient in grams" },
                  dbSource: { type: Type.STRING, description: "'usda' | 'off' | 'estimated' | 'label' | 'canonical_dict'" },
                  dbId: { type: Type.STRING, nullable: true },`;

const replSchema = `        foodData: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            name: { type: Type.STRING },
            itemsBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scoutIndex: { type: Type.INTEGER, description: "The exact numerical scoutIndex from the Scout payload" },
                  canonicalDbName: { type: Type.STRING, description: "You MUST preserve the specific toppings or modifiers identified in the originalName (e.g., 'Siomay with mushroom topping' instead of just 'Siomay')." },
                  weightGrams: { type: Type.INTEGER, description: "Weight of ingredient in grams" },
                  dbSource: { type: Type.STRING, description: "'usda' | 'off' | 'estimated' | 'label' | 'canonical_dict'" },
                  dbId: { type: Type.STRING, nullable: true },`;

if (content.includes(targetSchema)) {
    content = content.replace(targetSchema, replSchema);
    console.log("Replaced itemsBreakdown schema.");
} else {
    console.log("Failed to find itemsBreakdown schema.");
}

const targetSchema2 = `                  foodType: { type: Type.STRING }
                },
                required: ["canonicalDbName", "weightGrams", "dbSource", "dbId", "labelNutrientsPerServing", "foodType"]`;

const replSchema2 = `                  foodType: { type: Type.STRING }
                },
                required: ["scoutIndex", "canonicalDbName", "weightGrams", "dbSource", "dbId", "labelNutrientsPerServing", "foodType"]`;

if (content.includes(targetSchema2)) {
    content = content.replace(targetSchema2, replSchema2);
    console.log("Added scoutIndex to required array.");
} else {
    console.log("Failed to find required array in schema.");
}

const targetMode = `              scoutConfidenceComment: { type: Type.STRING, nullable: true }
          },
          required: ["name", "itemsBreakdown", "composition", "weightGrams", "quantity", "benefits", "risks", "healthImpact", "recommendation"]
        },
        mode: { type: Type.STRING, description: "Mode B or Mode D if comparing" },`;

const replMode = `              scoutConfidenceComment: { type: Type.STRING, nullable: true }
          },
          required: ["name", "itemsBreakdown", "composition", "weightGrams", "quantity", "benefits", "risks", "healthImpact", "recommendation"]
        },`;

if (content.includes(targetMode)) {
    content = content.replace(targetMode, replMode);
    console.log("Removed mode from output schema.");
} else {
    console.log("Failed to find mode in schema.");
}

fs.writeFileSync('server.ts', content);
