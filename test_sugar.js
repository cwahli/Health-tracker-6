const fs = require('fs');
let code = fs.readFileSync('server_nutrient_aggregation.ts', 'utf8');

const rawItems = [
    {
        name: "test",
        weightGrams: 100,
        labelNutrientsPerServing: {
            sugar: 25.5
        }
    }
];

// Let's just grep for addedSugar in server_nutrient_aggregation.ts
