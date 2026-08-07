const fs = require('fs');
let content = fs.readFileSync('src/components/NutritionDataBrowserModal.tsx', 'utf8');

const target = `  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(
        \`/api/admin/food-catalog?type=\${catalogType}&status=\${catalogStatus}&search=\${encodeURIComponent(catalogSearch)}\`
      );`;

const replace = `  const loadCatalog = async (q?: string) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(
        \`/api/admin/food-catalog?type=\${catalogType}&status=\${catalogStatus}&search=\${encodeURIComponent(q !== undefined ? q : catalogSearch)}\`
      );`;

content = content.replace(target, replace);

const uiTarget = `                  <input
                    type="text"
                    className={\`\${inputCls} flex-1\`}
                    placeholder="Search catalog..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadCatalog()}
                  />
                  <button onClick={loadCatalog} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-bold">
                    Search
                  </button>`;

const uiReplace = `                  <input
                    type="text"
                    className={\`\${inputCls} flex-1\`}
                    placeholder="Search catalog..."
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      loadCatalog(e.target.value);
                    }}
                  />`;

content = content.replace(uiTarget, uiReplace);

// We need to fix the button with onClick={loadCatalog} because loadCatalog now expects a string or event if we don't wrap it.
// Oh wait, onClick={loadCatalog} would pass a MouseEvent as `q` which is BAD!
content = content.replace('onClick={loadCatalog}', 'onClick={() => loadCatalog()}');

fs.writeFileSync('src/components/NutritionDataBrowserModal.tsx', content);
