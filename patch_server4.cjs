const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const t = `                properties: {
                  _internalReasoning: { type: Type.STRING, description: "STEP 1: CLASSIFICATION, STEP 2: DECOMPOSITION & RATIONALE, STEP 3: NUTRITION & PACKAGING EXTRACTION" },
                  recommendedMode: { type: Type.STRING },
                  contentType: { type: Type.STRING },
                  diningEnvironment: { type: Type.STRING, description: "home_cooked | casual_restaurant | fast_food_chain | fine_dining | airline | unknown" },`;
const r = `                properties: {
                  _internalReasoning: { type: Type.STRING, description: "STEP 1: CLASSIFICATION, STEP 2: DECOMPOSITION & RATIONALE, STEP 3: NUTRITION & PACKAGING EXTRACTION" },
                  contentType: { type: Type.STRING },
                  diningEnvironment: { type: Type.STRING, description: "home_cooked | casual_restaurant | fast_food_chain | fine_dining | airline | unknown" },`;

if (content.includes(t)) {
    content = content.replace(t, r);
    console.log("Replaced recommendedMode in properties");
}

const t2 = `                required: ["recommendedMode", "contentType", "diningEnvironment", "items"],
                propertyOrdering: ["_internalReasoning", "items", "recommendedMode", "contentType", "cookingMethod", "scanCompleteness", "queriesToSearch"]`;
const r2 = `                required: ["contentType", "diningEnvironment", "items"],
                propertyOrdering: ["_internalReasoning", "items", "contentType", "cookingMethod", "scanCompleteness", "queriesToSearch"]`;

if (content.includes(t2)) {
    content = content.replace(t2, r2);
    console.log("Replaced recommendedMode in required/propertyOrdering");
}

fs.writeFileSync('server.ts', content);
