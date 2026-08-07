function mergeActions(cloudActions = [], localActions = []) {
  const map = new Map();
  (localActions || []).forEach(act => {
    if (!act) return;
    const key = act.id || act.title || act.action || act.recommendation;
    if (key) {
      map.set(key, { ...act, id: act.id || key });
    }
  });
  (cloudActions || []).forEach(cloudAct => {
    if (!cloudAct) return;
    const key = cloudAct.id || cloudAct.title || cloudAct.action || cloudAct.recommendation;
    if (key) {
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...cloudAct, id: cloudAct.id || key });
      } else {
        const localTime = existing.updated_at || existing.createdAt || 0;
        const cloudTime = cloudAct.updated_at || cloudAct.createdAt || 0;
        const isCompleted = existing.completed || cloudAct.completed;
        if (localTime > cloudTime) {
          map.set(key, { ...cloudAct, ...existing, completed: isCompleted, id: existing.id || key });
        } else {
          map.set(key, { ...existing, ...cloudAct, completed: isCompleted, id: cloudAct.id || key });
        }
      }
    }
  });
  return Array.from(map.values());
}

function mergeBenefits(cloudBenefits = [], localBenefits = []) {
  const map = new Map();
  (localBenefits || []).forEach(ben => {
    if (!ben) return;
    const key = ben.id || ben.title || ben.benefit;
    if (key) {
      map.set(key, { ...ben, id: ben.id || key });
    }
  });
  (cloudBenefits || []).forEach(cloudBen => {
    if (!cloudBen) return;
    const key = cloudBen.id || cloudBen.title || cloudBen.benefit;
    if (key) {
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...cloudBen, id: cloudBen.id || key });
      } else {
        const localTime = existing.updated_at || 0;
        const cloudTime = cloudBen.updated_at || 0;
        const isCompleted = existing.completed || cloudBen.completed;
        if (localTime > cloudTime) {
          map.set(key, { ...cloudBen, ...existing, completed: isCompleted, id: existing.id || key });
        } else {
          map.set(key, { ...existing, ...cloudBen, completed: isCompleted, id: cloudBen.id || key });
        }
      }
    }
  });
  return Array.from(map.values());
}
