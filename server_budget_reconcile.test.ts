import { describe, it, expect } from 'vitest';
import {
  computeItemBudget,
  reconcileNutrients,
  portionAndReconcile,
  assertComponentSumMatchesItem,
  sumNutrientMapsAdditive
} from './server_budget_reconcile';

describe('Server Budget & Reconcile Logic', () => {
  it('prefers label over scout budget', () => {
    const res = computeItemBudget({
      itemName: 'Mac & Cheese',
      weightGrams: 350,
      hardLabelKcal: 700,
      scoutEstimatedCalories: 600,
    });
    expect(res.source).toBe('label');
    expect(res.budgetKcal).toBe(700);
    expect(res.hardLock).toBe(true);
  });

  it('uses scout budget when no label present', () => {
    const res = computeItemBudget({
      itemName: 'Chicken Salad Bowl',
      weightGrams: 400,
      scoutEstimatedCalories: 520,
    });
    expect(res.source).toBe('scout');
    expect(res.budgetKcal).toBe(520);
    expect(res.hardLock).toBe(false);
  });

  it('uses category fallback when no scout or label available', () => {
    const res = computeItemBudget({
      itemName: 'Macaroni and Cheese',
      weightGrams: 300,
    });
    expect(res.source).toBe('category');
    expect(res.budgetKcal).toBe(510); // 170 * 3
  });

  it('keeps foundation when ratio is within [0.75, 1.30]', () => {
    const budget = computeItemBudget({
      itemName: 'Poke Bowl',
      weightGrams: 400,
      scoutEstimatedCalories: 500,
    });
    const rec = reconcileNutrients({
      nutrients: { calories: 520, protein: 30, totalFat: 15, carbohydrates: 65 },
      budget,
    });
    expect(rec.action).toBe('keep');
    expect(rec.finalKcal).toBe(520);
  });

  it('scales foundation when ratio is in [0.5, 2.0] outside keep band', () => {
    const budget = computeItemBudget({
      itemName: 'Granola Yogurt Cup',
      weightGrams: 250,
      scoutEstimatedCalories: 400,
    });
    const rec = reconcileNutrients({
      nutrients: { calories: 600, protein: 20, totalFat: 20, carbohydrates: 80 },
      budget,
    });
    expect(rec.action).toBe('scale');
    expect(rec.finalKcal).toBe(400);
    expect(rec.nutrients.protein).toBe(13.3);
  });

  it('rejects scale when ratio is extreme (<0.5)', () => {
    const budget = computeItemBudget({
      itemName: 'Macaroni',
      weightGrams: 350,
      scoutEstimatedCalories: 650,
    });
    const rec = reconcileNutrients({
      nutrients: { calories: 150, protein: 5, totalFat: 2, carbohydrates: 25 },
      budget,
    });
    expect(rec.action).toBe('reject_scale');
    expect(rec.finalKcal).toBe(150);
  });

  it('forces hard lock calories when label is hard lock', () => {
    const budget = computeItemBudget({
      itemName: 'Snack Bar',
      weightGrams: 50,
      hardLabelKcal: 220,
    });
    const rec = reconcileNutrients({
      nutrients: { calories: 180, protein: 10, totalFat: 8, carbohydrates: 18 },
      budget,
    });
    expect(rec.action).toBe('hard_lock');
    expect(rec.finalKcal).toBe(220);
  });

  it('reconcileNutrients with soft scout budget 350 and foundation 420 -> keep or mild scale, not forced', () => {
    const budget = computeItemBudget({
      itemName: 'Granola',
      weightGrams: 300,
      scoutEstimatedCalories: 350,
    });
    expect(budget.source).toBe('scout');
    expect(budget.hardLock).toBe(false);
    const rec = reconcileNutrients({
      nutrients: { calories: 420, protein: 10, totalFat: 10, carbohydrates: 50 },
      budget,
    });
    expect(['keep', 'scale']).toContain(rec.action);
    expect(rec.finalKcal).toBeLessThan(450); // should be near 420 or 350
  });

  it('fails assertComponentSumMatchesItem when row sum disagrees with item calories', () => {
    const inv = assertComponentSumMatchesItem([100, 100], 287);
    expect(inv.ok).toBe(false);
    expect(inv.rowSum).toBe(200);
    expect(inv.itemCalories).toBe(287);
  });

  it('portionAndReconcile scales 100g nutrients to portion and reconciles to scout budget', () => {
    const res = portionAndReconcile({
      nutrientsPer100g: { calories: 200, protein: 10, totalFat: 5, carbohydrates: 25 },
      weightGrams: 300,
      itemName: 'Rice Bowl',
      scoutEstimatedCalories: 500,
    });
    // Foundation = 600 kcal. Ratio = 600 / 500 = 1.2 (within keep band 0.75-1.3)
    expect(res.action).toBe('keep');
    expect(res.foundationKcal).toBe(600);
    expect(res.budget.budgetKcal).toBe(500);
  });

  it('performs Zero Macro Backfill when calories > 0 but protein, fat, carbs are all 0', () => {
    const budget = computeItemBudget({ itemName: 'Test backfill', weightGrams: 100, scoutEstimatedCalories: 200 });
    const rec = reconcileNutrients({
      nutrients: { calories: 200, protein: 0, totalFat: 0, carbohydrates: 0 },
      budget
    });
    // With 200 Kcal:
    // Protein: 30% -> 60 kcal / 4 = 15
    // Fat: 30% -> 60 kcal / 9 = 6.7
    // Carbs: 40% -> 80 kcal / 4 = 20
    expect(rec.nutrients.protein).toBe(15);
    expect(rec.nutrients.totalFat).toBe(6.7);
    expect(rec.nutrients.carbohydrates).toBe(20);
  });

  it('limits calorie budget using Calorie Density Cap at 3.5 kcal/g', () => {
    // 50g item with high budget 300 kcal -> 6 kcal/g. Density cap should clamp budget to 50 * 3.5 = 175 kcal
    const budget = computeItemBudget({
      itemName: 'High density item',
      weightGrams: 50,
      scoutEstimatedCalories: 300
    });
    const rec = reconcileNutrients({
      nutrients: { calories: 150, protein: 10, totalFat: 5, carbohydrates: 15 },
      budget,
      weightGrams: 50
    });
    expect(rec.budgetKcal).toBe(175);
  });

  it('strictly sums nutrient maps additively', () => {
    const rows = [
      { calories: 100, protein: 5 },
      { calories: 150, carbohydrates: 20 },
      { protein: 2.5, totalFat: 4 }
    ];
    const total = sumNutrientMapsAdditive(rows);
    expect(total.calories).toBe(250);
    expect(total.protein).toBe(7.5);
    expect(total.carbohydrates).toBe(20);
    expect(total.totalFat).toBe(4);
  });
});
