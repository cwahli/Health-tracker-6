import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `generalNutrientTargets: {
          type: Type.OBJECT,
          description: "A flat map containing all 31 available nutrient keys populated with precise formatted values.",
          properties: {
            calories: { type: Type.STRING },
            totalFat: { type: Type.STRING },
            solubleFibre: { type: Type.STRING },
            saturatedFat: { type: Type.STRING },
            protein: { type: Type.STRING },
            potassium: { type: Type.STRING },
            transFat: { type: Type.STRING },
            addedSugar: { type: Type.STRING },
            carbohydrates: { type: Type.STRING },
            totalFibre: { type: Type.STRING },
            sodium: { type: Type.STRING },
            unsaturatedFat: { type: Type.STRING },
            omega3: { type: Type.STRING },
            magnesium: { type: Type.STRING },
            calcium: { type: Type.STRING },
            iron: { type: Type.STRING },
            zinc: { type: Type.STRING },
            selenium: { type: Type.STRING },
            iodine: { type: Type.STRING },
            phosphorus: { type: Type.STRING },
            vitaminD: { type: Type.STRING },
            vitaminB12: { type: Type.STRING },
            folate: { type: Type.STRING },
            vitaminC: { type: Type.STRING },
            vitaminE: { type: Type.STRING },
            vitaminK: { type: Type.STRING },
            vitaminA: { type: Type.STRING },
            vitaminB6: { type: Type.STRING },
            thiamine: { type: Type.STRING },
            riboflavin: { type: Type.STRING },
            niacin: { type: Type.STRING }
          },
          required: [
            "calories", "totalFat", "solubleFibre", "saturatedFat", "protein", "potassium", "transFat", "addedSugar", "carbohydrates", "totalFibre", "sodium",
            "unsaturatedFat", "omega3", "magnesium", "calcium", "iron", "zinc", "selenium", "iodine", "phosphorus", "vitaminD", "vitaminB12", "folate", "vitaminC", "vitaminE", "vitaminK", "vitaminA", "vitaminB6", "thiamine", "riboflavin", "niacin"
          ]
        }`;

content = content.replace(/generalNutrientTargets:\s*\{\s*type:\s*Type\.OBJECT,\s*description:\s*"A flat map containing all 31 available nutrient keys populated with precise formatted values\."\s*\}/g, replacement);

fs.writeFileSync('server.ts', content);
