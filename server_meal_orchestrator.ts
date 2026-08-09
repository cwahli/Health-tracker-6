import { MealBuild, StageAuditRecord } from './src/mealBuild/types';
import { consolidateMeal, migrateMealSchema } from './src/mealBuild/consolidate';

export function appendStage(meal: MealBuild, stage: string, status: 'success'|'error'|'degraded', message?: string): MealBuild {
  return consolidateMeal(meal, {}, stage, { stageKey: `${meal.id}_${stage}_1`, attempt: 1 });
}

export function markDietitianDegraded(meal: MealBuild, errorMsg?: string): MealBuild {
  let m = consolidateMeal(meal, { 
    savable: true, 
    lastCompletedStage: 'calculation', 
    degradedStages: ['dietitian'] 
  }, 'dietitian');
  
  const record: StageAuditRecord = {
    stageKey: `${m.id}_dietitian_1`,
    stage: 'dietitian',
    attempt: 1,
    timestamp: new Date().toISOString(),
    status: 'degraded',
    recovery: 'retry_advice',
    message: errorMsg
  };
  
  const ledger = m.stageLedger ? [...m.stageLedger] : [];
  const idx = ledger.findIndex(r => r.stageKey === record.stageKey);
  if (idx >= 0) {
    ledger[idx] = record;
  } else {
    ledger.push(record);
  }
  m.stageLedger = ledger;
  return m;
}

export function buildSavableMealFromParsed(preCalcItems: any[], activeMeal: any, aggregatedNutrients: any, rawFoodData: any): MealBuild {
  let base = migrateMealSchema(activeMeal || {});
  base = consolidateMeal(base, {
    items: preCalcItems.map(p => ({
      itemId: p.itemId,
      scoutIndex: p.scoutIndex,
      name: p.originalName || p.keyword || 'Food Item',
      estimatedCalories: p.estimatedCalories || (p.primaryBase100g ? p.primaryBase100g.calories : 0),
      nutrients: p.nutrients || {},
      weightGrams: p.weightGrams || 100,
      dbId: p.bestMatchDbId,
      dbSource: p.bestMatchDbSource,
      componentsDetailList: p.componentsDetailList,
      primaryBase100g: p.primaryBase100g,
      rawNutritionLabel: p.rawNutritionLabel,
    })),
    nutrients: aggregatedNutrients || {},
  }, 'calculation');
  return base;
}
