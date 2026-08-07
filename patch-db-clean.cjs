const fs = require('fs');

let content = fs.readFileSync('serverBrandMenu.ts', 'utf8');

const target = `    // 1. Fetch all brand menu items
    const { data: allItems, error: itemsErr } = await supabaseAdmin
      .from('brand_menu_items')
      .select('*');

    if (!itemsErr && Array.isArray(allItems) && allItems.length > 0) {
      const groups = new Map<string, any[]>();
      for (const item of allItems) {`;

const replace = `    // 1. Fetch all brand menu items
    const { data: allItems, error: itemsErr } = await supabaseAdmin
      .from('brand_menu_items')
      .select('*');

    if (!itemsErr && Array.isArray(allItems) && allItems.length > 0) {
      const groups = new Map<string, any[]>();
      for (const item of allItems) {
        // Filter out zero-nutrient items
        const nuts = item.nutrients || {};
        const isZero = Object.values(nuts).every(v => Number(v) === 0 || v === null || v === undefined);
        const cal = Number(nuts.calories || 0);
        if (isZero || cal <= 0) {
          await supabaseAdmin.from('brand_menu_items').delete().eq('id', item.id);
          deletedDuplicatesCount++;
          if (addDebugLog) addDebugLog(\`Deleted empty nutrient item: \${item.chain_key} - \${item.dish_name}\`);
          continue;
        }`;

content = content.replace(target, replace);
fs.writeFileSync('serverBrandMenu.ts', content);
