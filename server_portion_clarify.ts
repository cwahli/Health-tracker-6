export const detectPortionAmbiguity = (scoutItems: any[]) => {
  return false;
};

export const buildPortionClarifyPayload = (scoutItems: any[]) => {
  return {
    items: scoutItems,
    promptMessage: 'Please clarify your portion size.',
    portionChoices: []
  };
};

export const applyPortionChoices = (scoutItems: any[], choices: any) => {
  return scoutItems;
};
