const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const abortReplacement = `
      // Supabase Fallback Syncing
      try {
        console.log("[Offline Recovery] Firebase quota exceeded, but attempting to sync with Supabase...");
        let sf = foodLogs;
        let sb = biomarkerHistory;
        
        const deletedFoods = profile?.deletedFoodLogIds || {};
        const deletedBios = profile?.deletedBiomarkerLogIds || {};
        
        await syncLogsWithTimeBuckets(db, uid, sf, sb, deletedFoods, deletedBios, (f, b) => {
          sf = f;
          sb = b;
          setFoodLogs(f);
          setBiomarkerHistory(b);
        });

        const { serverFoods, serverBiomarkers } = await fetchAllConsolidatedLogs(db, uid, deletedFoods, deletedBios);
        if (serverFoods.length > 0) {
          setFoodLogs(prevFoods => mergeByRecency(prevFoods, serverFoods));
        }
        if (serverBiomarkers.length > 0) {
          setBiomarkerHistory(prevBio => mergeByRecency(prevBio, serverBiomarkers));
        }
      } catch (sbErr) {
        console.warn("[Offline Recovery] Supabase sync also failed.", sbErr);
      }
      
      setSyncState('local');
      if (typeof syncRootId !== 'undefined' && syncRootId) completeInteraction(syncRootId, false, 0, 'Firebase Quota Exceeded');
      if (typeof tProfileId !== 'undefined' && tProfileId) completeInteraction(tProfileId, false, 0, 'Firebase Quota Exceeded');
      (window as any).isManualSyncExecuting = false;
    };
`;

appCode = appCode.replace(/      setSyncState\('local'\);\n    };\n\n    if \(forcePull\) {/g, abortReplacement + "\n    if (forcePull) {");

fs.writeFileSync('src/App.tsx', appCode);
