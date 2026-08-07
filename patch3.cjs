const fs = require('fs');

// 1. Fix types in App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/status: 'pending',/g, "status: 'pending' as const,");
fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix syncUtils.ts arguments
let syncCode = fs.readFileSync('src/utils/syncUtils.ts', 'utf8');
syncCode = syncCode.replace(/completeDbInteraction\(trackId, !error, profile \? JSON\.stringify\(profile\)\.length : 0, error \? error\.message : undefined\);/g, "completeDbInteraction(trackId, !error, profile ? JSON.stringify(profile).length : 0, error ? error.message : undefined, 1);");

syncCode = syncCode.replace(/completeDbInteraction\(trackId, false, 0, err\.message \|\| String\(err\)\);/g, "completeDbInteraction(trackId, false, 0, err.message || String(err), 1);");

syncCode = syncCode.replace(/completeDbInteraction\(trackId, true, JSON\.stringify\(unsyncedFoods\)\.length \+ JSON\.stringify\(unsyncedBiomarkers\)\.length\);/g, "completeDbInteraction(trackId, true, JSON.stringify(unsyncedFoods).length + JSON.stringify(unsyncedBiomarkers).length, undefined, unsyncedFoods.length + unsyncedBiomarkers.length);");

syncCode = syncCode.replace(/completeDbInteraction\(trackId, false, 0, supabaseErr\.message \|\| String\(supabaseErr\)\);/g, "completeDbInteraction(trackId, false, 0, supabaseErr.message || String(supabaseErr), 1);");

fs.writeFileSync('src/utils/syncUtils.ts', syncCode);

// 3. Fix API types in trackApiCall
let typesCode = fs.readFileSync('src/types.ts', 'utf8');
typesCode = typesCode.replace(/\| 'firebase_read' \| 'firebase_write' \| 'firebase_delete'/g, "| 'firebase_read' | 'firebase_write' | 'firebase_delete' | 'supabase_read' | 'supabase_write' | 'supabase_delete'");
fs.writeFileSync('src/types.ts', typesCode);
