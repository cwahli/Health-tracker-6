import { aggregateItemsNutrients } from './server_nutrient_aggregation';

const rawItems = [
    {
        name: "test",
        weightGrams: 100,
        labelNutrientsPerServing: {
            sugar: 25.5
        },
        foodType: "unknown",
        dbSource: "usda",
        dbId: "123"
    }
];

const dbMatchMap = new Map();
// USDA has empty nutrients for 123 (e.g. they weren't matched in extractUSDANutrientsPer100g because "sugar" wasn't mapped)
dbMatchMap.set("123", {
    calories: 100
});

const result = aggregateItemsNutrients(rawItems, 100, dbMatchMap, [], () => {});
console.log(JSON.stringify(result, null, 2));
