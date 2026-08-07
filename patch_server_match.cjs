const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetMatch = `            const canonicalLower = (item.canonicalDbName || item.name || "").trim().toLowerCase();
            const match = visionScoutItems.find((s: any) => {
              const keywordLower = (s.keyword || "").trim().toLowerCase();
              const originalLower = (s.originalName || "").trim().toLowerCase();
              if (!canonicalLower) return false;
              return (
                canonicalLower === keywordLower ||
                canonicalLower === originalLower ||
                (keywordLower.length > 0 && canonicalLower.includes(keywordLower)) ||
                (originalLower.length > 0 && canonicalLower.includes(originalLower)) ||
                (keywordLower.length > 0 && keywordLower.includes(canonicalLower)) ||
                (originalLower.length > 0 && originalLower.includes(canonicalLower))
              );
            });`;

const replMatch = `            const canonicalLower = (item.canonicalDbName || item.name || "").trim().toLowerCase();
            const match = visionScoutItems.find((s: any) => {
              if (item.scoutIndex !== undefined && s.scoutIndex !== undefined && Number(item.scoutIndex) === Number(s.scoutIndex)) {
                return true;
              }
              const keywordLower = (s.keyword || "").trim().toLowerCase();
              const originalLower = (s.originalName || "").trim().toLowerCase();
              if (!canonicalLower) return false;
              return (
                canonicalLower === keywordLower ||
                canonicalLower === originalLower ||
                (keywordLower.length > 0 && canonicalLower.includes(keywordLower)) ||
                (originalLower.length > 0 && canonicalLower.includes(originalLower)) ||
                (keywordLower.length > 0 && keywordLower.includes(canonicalLower)) ||
                (originalLower.length > 0 && originalLower.includes(canonicalLower))
              );
            });`;

if (content.includes(targetMatch)) {
    content = content.replace(targetMatch, replMatch);
    console.log("Successfully patched Dietitian -> Scout matching logic.");
} else {
    console.log("Failed to find targetMatch.");
}

fs.writeFileSync('server.ts', content);
