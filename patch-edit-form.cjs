const fs = require('fs');
let content = fs.readFileSync('src/components/NutritionDataBrowserModal.tsx', 'utf8');

content = content.replace(
  "notes: ''",
  "notes: '',\n    basis_type: 'per_dish',\n    serving_grams: ''"
);

content = content.replace(
  "serving_grams: item.serving_grams,",
  "serving_grams: editForm.serving_grams === '' ? null : Number(editForm.serving_grams),\n          basis_type: editForm.basis_type || 'per_dish',"
);

// We need to set the values when editing:
content = content.replace(
  "notes: item.notes || item.ingredients || ''",
  "notes: item.notes || item.ingredients || '',\n                            basis_type: item.basis_type || 'per_dish',\n                            serving_grams: item.serving_grams || ''"
);
content = content.replace(
  "notes: item.notes || item.ingredients || ''",
  "notes: item.notes || item.ingredients || '',\n                            basis_type: item.basis_type || 'per_dish',\n                            serving_grams: item.serving_grams || ''"
);
content = content.replace(
  "notes: item.notes || item.ingredients || ''",
  "notes: item.notes || item.ingredients || '',\n                            basis_type: item.basis_type || 'per_dish',\n                            serving_grams: item.serving_grams || ''"
);

// We need to add the inputs to the UI!
// Search for DESCRIPTION / INGREDIENTS and insert it before that.
const uiInput = `                          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                            <div className="space-y-1">
                              <label className="text-[9px] text-white/50 block font-bold">SERVING BASIS</label>
                              <select
                                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                                value={editForm.basis_type}
                                onChange={(e) => setEditForm({ ...editForm, basis_type: e.target.value })}
                              >
                                <option value="per_dish">Per Dish / Portion</option>
                                <option value="per_100g">Per 100g / 100ml</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-white/50 block font-bold">SERVING SIZE (g/ml)</label>
                              <input
                                type="number"
                                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white font-mono"
                                placeholder="Optional"
                                value={editForm.serving_grams}
                                onChange={(e) => setEditForm({ ...editForm, serving_grams: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-white/50 block font-bold">DESCRIPTION / INGREDIENTS</label>`;

content = content.replaceAll(
  '<div className="space-y-1">\n                            <label className="text-[9px] text-white/50 block font-bold">DESCRIPTION / INGREDIENTS</label>',
  uiInput
);

fs.writeFileSync('src/components/NutritionDataBrowserModal.tsx', content);
