import { MealBuild, ComparisonSet } from './types';
import { migrateMealSchema } from './consolidate';

export function fromPendingFoodLog(log: any, meta?: Partial<MealBuild>): MealBuild {
  if (!log) return migrateMealSchema({});
  
  const items = Array.isArray(log.itemsBreakdown) ? log.itemsBreakdown : (Array.isArray(log.items) ? log.items : []);
  
  const meal: MealBuild = {
    id: meta?.id || Math.random().toString(36).substring(2, 9),
    schemaVersion: 1,
    version: meta?.version || 1,
    mode: meta?.mode || 'new_log',
    items: items.map((i: any, index: number) => ({
      ...i,
      scoutIndex: i.scoutIndex ?? index,
    })),
    nutrients: log.nutrients || {},
    content: {
      name: log.name || log.title,
      benefits: log.benefits || [],
      risks: log.risks || [],
      recommendation: log.recommendation || '',
      verdict: log.verdict || '',
      message: log.message || '',
    },
    imageUrls: log.imageUrls || [],
    ...meta
  };
  
  return migrateMealSchema(meal);
}

export function toPendingFoodLog(meal: MealBuild): any {
  return {
    itemsBreakdown: meal.items,
    items: meal.items,
    nutrients: meal.nutrients || {},
    name: meal.content?.name || 'Meal',
    title: meal.content?.name || 'Meal',
    benefits: meal.content?.benefits || [],
    risks: meal.content?.risks || [],
    recommendation: meal.content?.recommendation || '',
    verdict: meal.content?.verdict || '',
    message: meal.content?.message || '',
    imageUrls: meal.imageUrls || [],
    photoUrl: meal.photoUrl,
    debugUrl: meal.coldDebugUrl,
    scoutConfidence: meal.scoutConfidence,
    scoutContentType: meal.scoutContentType,
    receiptTable: meal.receiptTable,
    dangerBadges: meal.dangerBadges,
    biomarkerStatus: meal.biomarkerStatus,
    savable: meal.savable,
    degradedStages: meal.degradedStages,
    date: meal.date,
  };
}

export function fromEvaluationComparison(comparison: any, scoutItems: any[], meta?: any): ComparisonSet {
  const set: ComparisonSet = {
    id: meta?.id || Math.random().toString(36).substring(2, 9),
    schemaVersion: 1,
    version: 1,
    mode: 'compare',
    optionMeals: [],
    ...meta
  };
  
  if (comparison && Array.isArray(comparison.options)) {
    set.optionMeals = comparison.options.map((opt: any, index: number) => {
      // Find matching scout items
      const items = (opt.items || []).map((optItem: any) => {
        const scoutMatch = scoutItems?.find(s => s.name === optItem.name || s.name === optItem.title);
        return {
          ...scoutMatch,
          ...optItem,
          scoutIndex: scoutMatch?.scoutIndex,
        };
      });
      
      const meal: MealBuild = {
        id: Math.random().toString(36).substring(2, 9),
        schemaVersion: 1,
        version: 1,
        mode: 'compare_option',
        parentComparisonId: set.id,
        items,
        nutrients: opt.nutrients || {},
        content: {
          name: opt.name || opt.title || `Option ${index + 1}`,
          benefits: opt.benefits || [],
          risks: opt.risks || [],
          recommendation: opt.recommendation || '',
          verdict: opt.verdict || '',
          message: opt.message || '',
        }
      };
      return meal;
    });
  }
  
  return set;
}

export function toEvaluationPayload(set: ComparisonSet): { mode: 'evaluation'; comparison: any, scoutItems?: any[], message?: string } {
  return {
    mode: 'evaluation',
    comparison: {
      options: set.optionMeals.map(meal => ({
        ...toPendingFoodLog(meal),
        name: meal.content?.name,
        title: meal.content?.name,
      }))
    },
    scoutItems: set.optionMeals.flatMap(m => m.items),
    message: set.content?.message || 'Comparison ready.'
  };
}

export function fromActiveMeal(activeMeal: any): MealBuild {
  const meal = fromPendingFoodLog(activeMeal, { mode: 'edit', id: activeMeal.id });
  return meal;
}
