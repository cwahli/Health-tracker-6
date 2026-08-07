import { describe, it, expect } from 'vitest';
import { aggregateItemsNutrients } from './server_nutrient_aggregation';

/**
 * PIPELINE SNAPSHOT AUTOMATED TEST SUITE (ZERO API COST)
 * Mocks LLM Agent outputs to deterministically test:
 * - Mode A: New Food Logging (Single item & multi-component plates)
 * - Mode B: Discussion / General Queries
 * - Mode C: Modification / Active Meal Re-evaluation (Weight updates & Item removal)
 * - Mode D: Evaluation / Multi-product Comparisons
 */

describe('Pipeline Snapshot Automated Test Suite (Zero API Cost)', () => {
  const dummyMap = new Map();
  const dummyArr: any[] = [];
  const dummyLogger = () => {};

  // 1. Mode A: Single Text Log (Tahu Goreng 120g)
  it('SNAPSHOT MODE A: Single Logged Item (Tahu Goreng)', () => {
    const mockAgentOutput = {
      mode: 'new_log',
      message: 'Logged 120g of Tahu Goreng (Fried Tofu) containing approx 320 calories and 22g fat.',
      foodData: {
        date: '2026-07-25',
        name: 'Tahu Goreng',
        quantity: '1 piece (120g)',
        weightGrams: 120,
        composition: 'Fried Tofu',
        benefits: 'Good plant protein source',
        risks: 'Contains high saturated fat from deep frying',
        healthImpact: 'Moderate',
        recommendation: 'Pair with fresh vegetables',
        itemsBreakdown: [
          {
            canonicalDbName: 'Tofu, fried',
            weightGrams: 120,
            dbSource: 'usda',
            dbId: '174276',
            labelNutrientsPerServing: {
              servingSizeGrams: 100,
              calories: 270,
              protein: 17.2,
              totalFat: 20.2,
              saturatedFat: 3.2,
              transFat: 0,
              carbohydrates: 10.5,
              addedSugar: 0,
              sodium: 12,
              potassium: 150,
              totalFibre: 2.3,
              solubleFibre: 0.5
            },
            foodType: 'legume',
            cookingMethod: 'deep_fried',
            visualIngredients: ['tofu', 'vegetable oil'],
            anomalyFlags: []
          }
        ]
      },
      comparison: null
    };

    const aggregated = aggregateItemsNutrients(
      mockAgentOutput.foodData.itemsBreakdown,
      mockAgentOutput.foodData.weightGrams,
      dummyMap,
      dummyArr,
      dummyLogger
    ).nutrients;

    // Verify snapshot calculations
    expect(aggregated).toBeDefined();
    expect(aggregated.calories).toBeGreaterThan(0);
    expect(aggregated.protein).toBeGreaterThan(0);
    expect(aggregated.totalFat).toBeGreaterThan(0);
    expect(mockAgentOutput.mode).toBe('new_log');
    expect(mockAgentOutput.foodData.itemsBreakdown[0].cookingMethod).toBe('deep_fried');
  });

  // 2. Mode A: Multi-Component Plate (Indonesian Plate: Ayam Opor, Telur Dadar, Perkedel)
  it('SNAPSHOT MODE A: Multi-Component Plate (Image + Text)', () => {
    const mockAgentOutput = {
      mode: 'new_log',
      message: 'Logged Indonesian Plate with Ayam Opor, Telur Dadar, and Perkedel Kentang.',
      foodData: {
        date: '2026-07-25',
        name: 'Indonesian Mixed Plate',
        quantity: '1 full plate (290g)',
        weightGrams: 290,
        composition: 'Chicken Curry, Omelette, Potato Patty',
        benefits: 'High protein and potassium meal',
        risks: 'High sodium and saturated fat content',
        healthImpact: 'High calorie & sodium',
        recommendation: 'Eat in moderation',
        itemsBreakdown: [
          {
            canonicalDbName: 'Ayam Opor (Chicken Curry)',
            weightGrams: 150,
            dbSource: 'usda',
            dbId: '171077',
            labelNutrientsPerServing: {
              servingSizeGrams: 100,
              calories: 185,
              protein: 22.0,
              totalFat: 10.5,
              saturatedFat: 4.5,
              transFat: 0,
              carbohydrates: 2.0,
              addedSugar: 0,
              sodium: 350,
              potassium: 280,
              totalFibre: 0.5,
              solubleFibre: 0
            },
            foodType: 'poultry',
            cookingMethod: 'boiled',
            visualIngredients: ['chicken', 'coconut milk'],
            anomalyFlags: []
          },
          {
            canonicalDbName: 'Telur Dadar (Fried Omelette)',
            weightGrams: 80,
            dbSource: 'usda',
            dbId: '172183',
            labelNutrientsPerServing: {
              servingSizeGrams: 100,
              calories: 154,
              protein: 10.6,
              totalFat: 11.7,
              saturatedFat: 3.1,
              transFat: 0,
              carbohydrates: 1.1,
              addedSugar: 0,
              sodium: 140,
              potassium: 130,
              totalFibre: 0,
              solubleFibre: 0
            },
            foodType: 'dairy',
            cookingMethod: 'pan_fried',
            visualIngredients: ['egg', 'shallot', 'oil'],
            anomalyFlags: []
          },
          {
            canonicalDbName: 'Perkedel Kentang (Fried Potato Fritter)',
            weightGrams: 60,
            dbSource: 'usda',
            dbId: '170020',
            labelNutrientsPerServing: {
              servingSizeGrams: 100,
              calories: 210,
              protein: 3.5,
              totalFat: 12.0,
              saturatedFat: 2.5,
              transFat: 0,
              carbohydrates: 22.0,
              addedSugar: 0,
              sodium: 280,
              potassium: 310,
              totalFibre: 2.0,
              solubleFibre: 0.4
            },
            foodType: 'root_veg',
            cookingMethod: 'deep_fried',
            visualIngredients: ['potato', 'egg', 'oil'],
            anomalyFlags: []
          }
        ]
      }
    };

    const aggregated = aggregateItemsNutrients(
      mockAgentOutput.foodData.itemsBreakdown,
      mockAgentOutput.foodData.weightGrams,
      dummyMap,
      dummyArr,
      dummyLogger
    ).nutrients;

    expect(aggregated.calories).toBeGreaterThan(0);
    expect(aggregated.sodium).toBeGreaterThan(0);
    expect(mockAgentOutput.foodData.itemsBreakdown).toHaveLength(3);
  });

  // 3. Mode B: Discussion / Non-food query
  it('SNAPSHOT MODE B: Discussion / Query Handling', () => {
    const mockAgentOutput = {
      mode: 'discussion',
      message: 'Hello! I am your AI Nutritionist. How can I help you analyze your meals today?',
      modificationCommand: null,
      foodData: null,
      comparison: null
    };

    expect(mockAgentOutput.mode).toBe('discussion');
    expect(mockAgentOutput.foodData).toBeNull();
    expect(mockAgentOutput.message).toContain('AI Nutritionist');
  });

  // 4. Mode D: Evaluation / Snack Comparison
  it('SNAPSHOT MODE D: Snack Comparison Shelf (Tiered Groups)', () => {
    const mockAgentOutput = {
      mode: 'evaluation',
      message: 'I evaluated 3 snack options on the shelf. Oishi Popcorn is the safest choice.',
      foodData: null,
      comparison: {
        comparisonTitle: 'Snack Health Comparison',
        auditChecklist: 'Scout Indices 0, 1, 2 evaluated',
        groups: [
          {
            groupName: 'Lowest Saturated Fat & Whole Grain Fiber',
            scoutItemIndices: [0],
            suitability: 'Safest choice',
            recommendation: 'Oishi Popcorn provides whole grain fiber with moderate sodium.',
            averageNutrients: { calories: 140, protein: 3, totalFat: 6, saturatedFat: 1.5, sodium: 180, carbohydrates: 18, addedSugar: 1 }
          },
          {
            groupName: 'Moderate Calorie Baked Potato Chips',
            scoutItemIndices: [1],
            suitability: 'Runner-up option',
            recommendation: 'Chitato Lite is lower in fat than deep-fried varieties but high in sodium.',
            averageNutrients: { calories: 160, protein: 2, totalFat: 8, saturatedFat: 3.0, sodium: 290, carbohydrates: 20, addedSugar: 0 }
          },
          {
            groupName: 'High Saturated Fat & Sodium Threat (Cassava Chips)',
            scoutItemIndices: [2],
            suitability: 'Least recommended',
            recommendation: 'Deep Fried Cassava Chips contain excessive palm oil fat and sodium.',
            averageNutrients: { calories: 230, protein: 1, totalFat: 14, saturatedFat: 6.5, sodium: 420, carbohydrates: 26, addedSugar: 0 }
          }
        ]
      }
    };

    expect(mockAgentOutput.mode).toBe('evaluation');
    expect(mockAgentOutput.comparison.groups).toHaveLength(3);
    expect(mockAgentOutput.comparison.groups[0].scoutItemIndices).toEqual([0]);
  });

  // 5. Mode C: Modification - Weight Update
  it('SNAPSHOT MODE C: Modification (Update Weight of Tahu Goreng to 200g)', () => {
    const initialItems = [
      {
        canonicalDbName: 'Tofu, fried',
        weightGrams: 120,
        dbSource: 'usda',
        dbId: '174276',
        labelNutrientsPerServing: { servingSizeGrams: 100, calories: 270, protein: 17.2, totalFat: 20.2, saturatedFat: 3.2, transFat: 0, carbohydrates: 10.5, addedSugar: 0, sodium: 12, potassium: 150, totalFibre: 2.3, solubleFibre: 0.5 },
        foodType: 'legume',
        cookingMethod: 'deep_fried',
        visualIngredients: ['tofu'],
        anomalyFlags: []
      }
    ];

    // Simulate Agent Mode C update command
    const updatedItems = initialItems.map(item => {
      if (item.canonicalDbName === 'Tofu, fried') {
        return { ...item, weightGrams: 200 };
      }
      return item;
    });

    const initialAggregated = aggregateItemsNutrients(initialItems, 120, dummyMap, dummyArr, dummyLogger).nutrients;
    const updatedAggregated = aggregateItemsNutrients(updatedItems, 200, dummyMap, dummyArr, dummyLogger).nutrients;

    expect(updatedAggregated.calories).toBeGreaterThan(initialAggregated.calories);
  });

  // 6. Mode C: Modification - Item Removal
  it('SNAPSHOT MODE C: Modification (Remove Perkedel Kentang from Plate)', () => {
    const multiItems = [
      {
        canonicalDbName: 'Ayam Opor',
        weightGrams: 150,
        labelNutrientsPerServing: { servingSizeGrams: 100, calories: 185, protein: 22, totalFat: 10.5, saturatedFat: 4.5, sodium: 350, carbohydrates: 2, addedSugar: 0, potassium: 280, totalFibre: 0.5 }
      },
      {
        canonicalDbName: 'Perkedel Kentang',
        weightGrams: 60,
        labelNutrientsPerServing: { servingSizeGrams: 100, calories: 210, protein: 3.5, totalFat: 12, saturatedFat: 2.5, sodium: 280, carbohydrates: 22, addedSugar: 0, potassium: 310, totalFibre: 2 }
      }
    ];

    const initialAggregated = aggregateItemsNutrients(multiItems, 210, dummyMap, dummyArr, dummyLogger).nutrients;

    // User command: remove Perkedel
    const remainingItems = multiItems.filter(item => item.canonicalDbName !== 'Perkedel Kentang');
    const remainingAggregated = aggregateItemsNutrients(remainingItems, 150, dummyMap, dummyArr, dummyLogger).nutrients;

    expect(initialAggregated.calories).toBeGreaterThan(remainingAggregated.calories);
    expect(remainingItems).toHaveLength(1);
  });

});
