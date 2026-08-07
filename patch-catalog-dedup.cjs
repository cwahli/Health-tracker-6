const fs = require('fs');
let content = fs.readFileSync('serverBrandMenu.ts', 'utf8');

const target = `    if (toDeleteIds.length > 0) {
      await supabaseAdmin.from('food_items').delete().in('food_id', toDeleteIds);
      if (toDeleteKeys.length > 0) {
        await supabaseAdmin.from('food_aliases').delete().in('alias_key', toDeleteKeys);
      }
    }`;

const dedupLogic = `    if (toDeleteIds.length > 0) {
      await supabaseAdmin.from('food_items').delete().in('food_id', toDeleteIds);
      if (toDeleteKeys.length > 0) {
        await supabaseAdmin.from('food_aliases').delete().in('alias_key', toDeleteKeys);
      }
    }

    // Deduplicate food items
    const { data: deduplicatedItems, error: dedupErr } = await supabaseAdmin.from('food_items').select('*');
    if (!dedupErr && Array.isArray(deduplicatedItems)) {
      const groups = new Map<string, any[]>();
      for (const item of deduplicatedItems) {
        const key = item.food_key || '';
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      }

      for (const [key, items] of groups.entries()) {
        if (items.length > 1) {
          items.sort((a, b) => {
             const aConf = a.confidence || 0;
             const bConf = b.confidence || 0;
             if (aConf !== bConf) return bConf - aConf;
             return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          const primary = items[0];
          const duplicates = items.slice(1);
          const dupIds = duplicates.map(d => d.food_id).filter(Boolean);
          if (dupIds.length > 0) {
            await supabaseAdmin.from('food_items').delete().in('food_id', dupIds);
            if (addDebugLog) addDebugLog(\`[SelfCleaning] Deleted \${dupIds.length} duplicates for catalog item: \${key}\`);
          }
        }
      }
    }`;

content = content.replace(target, dedupLogic);
fs.writeFileSync('serverBrandMenu.ts', content);
