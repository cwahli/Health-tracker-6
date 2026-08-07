const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    if (visionScoutItems && visionScoutItems.length > 0) {
      visionScoutItems.forEach((it: any) => {
        const combined = [
          it.originalName, it.keyword, it.originalLocalName, it.canonicalDbName, it.name,
          ...(it.visualIngredients || []),
          ...(it.components ? it.components.map((c: any) => typeof c === 'string' ? c : c.name || c.searchQuery || c.keyword) : [])
        ].filter(Boolean).join(' ').toLowerCase();`;

const replacement = `    if (visionScoutItems && visionScoutItems.length > 0) {
      visionScoutItems.forEach((it: any) => {
        // If we bypassed the scout (e.g. edit mode), we need to populate queriesToSearch from the existing items
        if (!visionScoutRanAndReturnedItems) {
            if (it.keyword) queriesToSearch.push(it.keyword);
            if (it.originalName) queriesToSearch.push(it.originalName);
            if (it.components) {
               it.components.forEach((c: any) => {
                  const q = typeof c === 'string' ? c : c.searchQuery || c.name || c.keyword;
                  if (q) queriesToSearch.push(q);
               });
            }
        }

        const combined = [
          it.originalName, it.keyword, it.originalLocalName, it.canonicalDbName, it.name,
          ...(it.visualIngredients || []),
          ...(it.components ? it.components.map((c: any) => typeof c === 'string' ? c : c.name || c.searchQuery || c.keyword) : [])
        ].filter(Boolean).join(' ').toLowerCase();`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
