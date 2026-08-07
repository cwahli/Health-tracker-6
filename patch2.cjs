const fs = require('fs');
let code = fs.readFileSync('src/utils/syncUtils.ts', 'utf8');

const helpers = `
let lastDbOpId = 0;
export const dispatchDbInteraction = (
  type,
  path,
  data,
  database,
  docCount = 1
) => {
  const id = \`\${database.toLowerCase()}_op_\${++lastDbOpId}_\${Date.now()}\`;
  window.dispatchEvent(new CustomEvent('db_op_start', {
    detail: { id, type, path, data, database, docCount }
  }));
  return id;
};

export const completeDbInteraction = (
  id, 
  success, 
  sizeBytes, 
  errorMsg, 
  finalDocCount
) => {
  window.dispatchEvent(new CustomEvent('db_op_complete', {
    detail: { id, success, sizeBytes, errorMsg, finalDocCount }
  }));
};
`;

code = code.replace("export const upsertProfileToSupabase = async", helpers + "\nexport const upsertProfileToSupabase = async");

// Now let's inject them into the supabase calls.
// 1. upsertProfileToSupabase
code = code.replace(
  `  try {\n    const { error } = await supabase.from('profiles').upsert(profileToSupabaseRow(profile, uid));`,
  `  const trackId = dispatchDbInteraction('upload', \`users/\${uid} (Profile)\`, profile, 'Supabase');\n  try {\n    const { error } = await supabase.from('profiles').upsert(profileToSupabaseRow(profile, uid));\n    completeDbInteraction(trackId, !error, profile ? JSON.stringify(profile).length : 0, error ? error.message : undefined);`
);

code = code.replace(
  `    if (error) console.warn('[Supabase Sync] Profile upsert warning:', error.message);\n  } catch (err) {\n    console.error('[Supabase Sync] Failed to upsert profile:', err);`,
  `    if (error) console.warn('[Supabase Sync] Profile upsert warning:', error.message);\n  } catch (err: any) {\n    completeDbInteraction(trackId, false, 0, err.message || String(err));\n    console.error('[Supabase Sync] Failed to upsert profile:', err);`
);

// 2. syncLogsWithTimeBuckets
code = code.replace(
  `  // 1. Supabase Sync (Primary Database)\n  try {`,
  `  // 1. Supabase Sync (Primary Database)\n  const trackId = dispatchDbInteraction('upload', \`users/\${uid} (Food & Biomarker Logs)\`, { foods: unsyncedFoods, bios: unsyncedBiomarkers }, 'Supabase', unsyncedFoods.length + unsyncedBiomarkers.length);\n  try {`
);

code = code.replace(
  `      } else if (syncedBioIds.has(updatedLocalBiomarkers[i].id)) {\n        updatedLocalBiomarkers[i] = { ...updatedLocalBiomarkers[i], sync_state: 'synced' };\n      }\n    }\n  } catch (supabaseErr) {\n    console.error('[Supabase Sync] Failed to sync logs:', supabaseErr);\n  }`,
  `      } else if (syncedBioIds.has(updatedLocalBiomarkers[i].id)) {\n        updatedLocalBiomarkers[i] = { ...updatedLocalBiomarkers[i], sync_state: 'synced' };\n      }\n    }\n    completeDbInteraction(trackId, true, JSON.stringify(unsyncedFoods).length + JSON.stringify(unsyncedBiomarkers).length);\n  } catch (supabaseErr: any) {\n    completeDbInteraction(trackId, false, 0, supabaseErr.message || String(supabaseErr));\n    console.error('[Supabase Sync] Failed to sync logs:', supabaseErr);\n  }`
);

// 3. fetchAllConsolidatedLogs
code = code.replace(
  `  // Primary: Fetch from Supabase\n  try {`,
  `  // Primary: Fetch from Supabase\n  const trackId = dispatchDbInteraction('download', \`users/\${uid} (All Logs)\`, null, 'Supabase');\n  try {`
);

code = code.replace(
  `          serverBiomarkers.push(supabaseRowToBiomarkerLog(row));\n        }\n      });\n    }\n  } catch (err) {\n    console.error('[Supabase Fetch] Failed to load logs from Supabase:', err);\n  }`,
  `          serverBiomarkers.push(supabaseRowToBiomarkerLog(row));\n        }\n      });\n    }\n    completeDbInteraction(trackId, true, JSON.stringify(serverFoods).length + JSON.stringify(serverBiomarkers).length, undefined, serverFoods.length + serverBiomarkers.length);\n  } catch (err: any) {\n    completeDbInteraction(trackId, false, 0, err.message || String(err));\n    console.error('[Supabase Fetch] Failed to load logs from Supabase:', err);\n  }`
);

fs.writeFileSync('src/utils/syncUtils.ts', code);
