import { aggregateItemsNutrients } from './server_nutrient_aggregation';

const rawItems = [
    {
        name: "test",
        weightGrams: 100,
        labelNutrientsPerServing: {
            sugar: 25.5
        },
        foodType: "unknown"
    }
];

const result = aggregateItemsNutrients(rawItems, 100, new Map(), [], () => {});
console.log(JSON.stringify(result, null, 2));
