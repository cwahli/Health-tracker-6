export const detectWeightRefineIntent = (text: string, priorScoutItems: any[]) => {
  return { isRefine: true };
};

export const applyWeightRefineToScoutItems = (scoutItems: any[], refineIntent: any) => {
  return scoutItems;
};

export const decideRefineVsScout = (params: any) => {
  return { skip: true, reason: 'refine' };
};

export const priorScoutHasLabelLocks = (scoutItems: any[]) => {
  return true;
};
