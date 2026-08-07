const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        parsedData.itemsBreakdown = itemsBreakdown.map((item: any, idx: number) => {
          const preMatch = preCalculatedItems.find((p: any) => {
            if (item.scoutIndex !== undefined && item.scoutIndex !== null && p.scoutIndex !== undefined && p.scoutIndex !== null) {
              return item.scoutIndex === p.scoutIndex;
            }
            const itemLower = (item.canonicalDbName || item.name || "").trim().toLowerCase();
            const pOrigLower = (p.originalName || "").trim().toLowerCase();
            const pKwLower = (p.keyword || "").trim().toLowerCase();
            if (!itemLower) return false;
            if (itemLower === pOrigLower || itemLower === pKwLower || (pKwLower.length > 0 && itemLower.includes(pKwLower)) || (itemLower.length > 0 && pKwLower.includes(itemLower))) {
              return true;
            }
            const itemTokens = itemLower.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 3);
            const pTokens = \`\${pOrigLower} \${pKwLower}\`.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 3);
            return itemTokens.some((t: string) => pTokens.includes(t));
          }) || (rawFoodData.itemsBreakdown.length === preCalculatedItems.length ? preCalculatedItems[idx] : null);`;

const replacement = `        parsedData.itemsBreakdown = itemsBreakdown.map((item: any, idx: number) => {
          const preMatch = preCalculatedItems.find((p: any) => {
            if (item.scoutIndex !== undefined && item.scoutIndex !== null && p.scoutIndex !== undefined && p.scoutIndex !== null) {
              return item.scoutIndex === p.scoutIndex;
            }
            const itemLower = (item.canonicalDbName || item.name || "").trim().toLowerCase();
            const pOrigLower = (p.originalName || "").trim().toLowerCase();
            const pKwLower = (p.keyword || "").trim().toLowerCase();
            if (!itemLower) return false;
            if (itemLower === pOrigLower || itemLower === pKwLower) {
              return true;
            }
            return false; // Fuzzy token matching was causing ID collisions (e.g. Meatball wrap matching Falafel wrap because they both share "wrap").
          }) || preCalculatedItems[idx] || null;`; // Fallback to index if no exact match

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync('server.ts', content);
    console.log("Successfully patched preMatch in server.ts");
} else {
    console.log("Failed to find target string in server.ts");
}
