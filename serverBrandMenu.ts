import type { Express, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { inferBasisFromServingText, toPer100g, parseNutrientNumber } from './server_nutrient_basis';

function getFirestoreDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  let dbId: string | undefined = undefined;
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
    dbId = firebaseConfig.firestoreDatabaseId;
  } catch (e) {
    console.warn('Could not read firestoreDatabaseId from firebase-applet-config.json', e);
  }
  return getFirestore(getApps()[0], dbId);
}

export function normalizeDishKey(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\s*\(v[eg]?\)\s*/gi, '') // strip (ve), (v), (vg) diet markers
    .replace(/['']/g, '')               // strip smart apostrophes
    .replace(/[^a-z0-9\s]/g, ' ')       // non-alphanumeric → space
    .replace(/\s+/g, '_')               // spaces → underscore
    .replace(/^_+|_+$/g, '');           // trim leading/trailing underscores
}

export function normalizeChainKey(name: string): string {
  if (!name) return '';
  let str = String(name || '').trim().toLowerCase();
  
  // Remove apostrophes first: "Sainsbury's" -> "sainsburys", "Jack Daniel's" -> "jack daniels"
  str = str.replace(/['’]/g, '');

  // Explicit brand mappings for known chain variants
  if (/\b(sainsbury|sainsbury_s|sainsburys)\b/i.test(str) || str.includes('sainsbury')) return 'sainsbury';
  if (/\b(mcdonald|mcdonald_s|mcdonalds|maccas|麦当劳)\b/i.test(str) || str.includes('mcdonald')) return 'mcdonalds';
  if (/\b(jack_daniel|jack_daniel_s|jack_daniels)\b/i.test(str) || str.includes('jack_daniel') || str.includes('jack daniel')) return 'jack_daniels';
  if (/\b(honi_poke|honipoke)\b/i.test(str)) return 'honi_poke';
  if (/\b(coco_di_mama|cocodimama)\b/i.test(str)) return 'coco_di_mama';
  
  str = str.replace(/[^a-z0-9]+/g, '_');
  str = str.replace(/^_+|_+$/g, '');
  if (str.endsWith('_s')) {
    str = str.slice(0, -2);
  }
  return str;
}

export async function autoRegisterChainMenuItem(
  supabaseAdmin: any,
  item: any,
  countryCode: string,
  addDebugLog: (msg: string) => void
): Promise<void> {
  try {
    const chainName = String(item?.chainName || '').trim();
    const dishName = String(item?.originalName || item?.name || item?.dishName || '').trim();
    const rawLabel = item?.rawNutritionLabel;
    if (!chainName || !dishName || !rawLabel || typeof rawLabel !== 'object') return;

    const lockedKeysList = Array.isArray(item?.lockedNutrientKeys) ? item.lockedNutrientKeys : null;
    const lockedKeysSet = lockedKeysList ? new Set(lockedKeysList.map((k: string) => k.toLowerCase())) : null;

    const nutrients: Record<string, number> = {};
    const fieldMap: Record<string, string> = {
      calories: 'calories', protein: 'protein', totalFat: 'totalFat',
      saturatedFat: 'saturatedFat', carbohydrates: 'carbohydrates', totalCarbohydrate: 'carbohydrates',
      sugar: 'sugar', totalFibre: 'totalFibre', sodium: 'sodium', salt: 'salt'
    };
    for (const [rawKey, outKey] of Object.entries(fieldMap)) {
      if (lockedKeysSet) {
        const normOutKey = outKey.toLowerCase();
        const isLockedField = lockedKeysSet.has(normOutKey) ||
          (normOutKey === 'carbohydrates' && (lockedKeysSet.has('carbohydrate') || lockedKeysSet.has('carbs'))) ||
          (normOutKey === 'totalfat' && lockedKeysSet.has('fat')) ||
          (normOutKey === 'totalfibre' && (lockedKeysSet.has('fiber') || lockedKeysSet.has('fibre')));

        if (!isLockedField) {
          addDebugLog(`[AutoChainRegister] Omitting AI-estimated field '${outKey}' from official brand database save for "${dishName}" (only printed truth is stored).`);
          continue;
        }
      }

      const n = parseNutrientNumber(rawLabel[rawKey]);
      if (n !== null) nutrients[outKey] = n;
    }
    if (Object.keys(nutrients).length === 0) return; // guard: at least one official nutrient required

    const chain_key = normalizeChainKey(chainName);
    const dish_name_key = normalizeDishKey(dishName);
    if (!chain_key || !dish_name_key) return;

    // Determine basis_type + serving_grams from serving size raw or item weight.
    // IMPORTANT: This function only ever registers restaurant/chain dishes, not packaged goods.
    // Pass assumeDishNotPackage=true so an unlabeled calorie number is treated as a whole-dish
    // total (e.g. "783 kcal" for a sandwich), never as a per-100g rate.
    const ssRaw = String(rawLabel.servingSize || rawLabel.servingSizeRaw || '').trim();
    const estWeight = parseNutrientNumber(item?.estimatedWeightGrams);
    const basisInfo = inferBasisFromServingText(ssRaw, estWeight, true);
    const basis_type = basisInfo.basisType;
    const serving_grams = basisInfo.servingGrams;

    const nutrients_per_100g = toPer100g({
      basisType: basis_type,
      servingGrams: serving_grams,
      nutrients: nutrients,
    });

    // Upsert chain_menu_sources placeholder, marked ready since we have real captured data (soft fail ok)
    try {
      const sourceUrl = `crowdsourced://ocr/${chain_key}`;
      const nowIso = new Date().toISOString();
      await supabaseAdmin.from('chain_menu_sources').upsert({
        chain_key,
        country_code: countryCode,
        url: sourceUrl,
        status: 'ready',
        enabled: true,
        last_success_at: nowIso,
        updated_at: nowIso,
      }, { onConflict: 'country_code,chain_key,url' });
    } catch (e: any) {
      // Soft-fail OK if table missing or schema differs
    }

    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from('brand_menu_items')
      .select('*')
      .eq('country_code', countryCode)
      .eq('chain_key', chain_key)
      .eq('dish_name_key', dish_name_key)
      .maybeSingle();

    if (lookupErr) {
      addDebugLog(`[AutoChainRegister] lookup error, skipping: ${lookupErr.message}`);
      return;
    }

    const ingredients = item?.ingredientsList || item?.ingredients || rawLabel?.ingredients || null;
    const isPartialLocked = lockedKeysList && lockedKeysList.length > 0 && Object.keys(nutrients).length < 4;

    if (!existing) {
      const row = {
        country_code: countryCode,
        chain_key,
        dish_name: dishName,
        dish_name_key,
        serving_grams,
        basis_type,
        nutrients,
        nutrients_per_100g,
        ingredients,
        provenance: isPartialLocked ? 'ocr_partial' : 'ocr_auto',
        confidence: isPartialLocked ? 0.45 : 0.55,
        capture_count: 1,
        source_url: `crowdsourced://ocr/${chain_key}`,
        notes: isPartialLocked
          ? `Auto-captured from photo OCR (Official printed keys: ${lockedKeysList.join(', ')})`
          : 'Auto-captured from photo OCR',
        enabled: true,
        updated_at: new Date().toISOString(),
      };
      const { error: insertErr } = await supabaseAdmin.from('brand_menu_items').insert(row);
      if (insertErr) {
        addDebugLog(`[AutoChainRegister] insert failed for "${dishName}": ${insertErr.message}`);
      } else {
        addDebugLog(`[AutoChainRegister] Registered new dish "${dishName}" for chain "${chain_key}" with ${Object.keys(nutrients).length} official fields.`);
      }
    } else {
      // Exists: Fill null nutrients, null ingredients, null serving_grams. Increment capture_count & confidence.
      const existingNutrients = existing.nutrients || {};
      const mergedNutrients: Record<string, number> = { ...existingNutrients };
      for (const [k, v] of Object.entries(nutrients)) {
        if (existingNutrients[k] === null || existingNutrients[k] === undefined) {
          mergedNutrients[k] = v;
        }
      }

      const mergedNutrients100g = toPer100g({
        basisType: existing.basis_type || basis_type,
        servingGrams: existing.serving_grams || serving_grams,
        nutrients: mergedNutrients,
      });

      const updatedCaptureCount = (existing.capture_count || 1) + 1;
      const updatedConfidence = Math.min(0.95, (existing.confidence || 0.5) + 0.05);

      const updates: Record<string, any> = {
        nutrients: mergedNutrients,
        nutrients_per_100g: mergedNutrients100g,
        capture_count: updatedCaptureCount,
        confidence: updatedConfidence,
        updated_at: new Date().toISOString(),
      };

      if ((existing.serving_grams === null || existing.serving_grams === undefined) && serving_grams) {
        updates.serving_grams = serving_grams;
      }
      if (!existing.ingredients && ingredients) {
        updates.ingredients = ingredients;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('brand_menu_items')
        .update(updates)
        .eq('id', existing.id);

      if (updateErr) {
        addDebugLog(`[AutoChainRegister] update failed for "${dishName}": ${updateErr.message}`);
      } else {
        addDebugLog(`[AutoChainRegister] Updated existing dish "${dishName}" (capture #${updatedCaptureCount}).`);
      }
    }
  } catch (e: any) {
    addDebugLog(`[AutoChainRegister] unexpected error: ${e?.message || e}`);
  }
}

export function cleanDescriptionText(raw: string): string {
  if (!raw) return '';
  let str = String(raw).trim();
  str = str.replace(/^description\s*:\s*/i, '');
  str = str.replace(/\s*salt:\s*[\d.]+g?\s*→\s*sodium\s*\d+mg.*$/i, '');
  str = str.replace(/\s*pasted from menu nutrition panel.*$/i, '');
  return str.trim();
}

async function maybeMarkChainReady(supabaseAdmin: any, chainKey: string, countryCode: string) {
  try {
    await supabaseAdmin
      .from('chain_menu_sources')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('chain_key', chainKey)
      .eq('country_code', countryCode);
  } catch (e) {
    console.warn('maybeMarkChainReady failed:', e);
  }
}

/** Parse YOLK/VMOS-style pasted nutrition panel → dish + macros */
export function parseMenuNutritionPaste(raw: string): {
  dish_name: string;
  description: string;
  nutrients: Record<string, number>;
  serving_grams: number | null;
  notes: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const nonEmpty = String(raw || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!nonEmpty.length) {
    return { dish_name: '', description: '', nutrients: {}, serving_grams: null, notes: '', warnings: ['Empty paste'] };
  }

  const numFrom = (line: string): number | null => {
    const m = String(line).replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) ? n : null;
  };
  const energyFromText = (str: string): number | null => {
    const s = String(str).replace(/,/g, '').trim();
    const kcalMatch = s.match(/(-?\d+(?:\.\d+)?)\s*kcal/i);
    if (kcalMatch) {
      const n = parseFloat(kcalMatch[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const kjMatch = s.match(/(-?\d+(?:\.\d+)?)\s*kj/i);
    if (kjMatch) {
      const kj = parseFloat(kjMatch[1]);
      if (Number.isFinite(kj) && kj > 0) {
        return Math.round((kj / 4.184) * 10) / 10;
      }
    }
    return numFrom(s);
  };
  const isSectionHeader = (line: string) =>
    /^(overview|nutrition|allergens|ingredients|details)$/i.test(line.trim());
  const isNutrientLabel = (line: string): string | null => {
    const t = line.trim().toLowerCase().replace(/\s+/g, ' ');
    if (/^energy\s*\(kcal\)|^energy\s*kcal|^calories?\b/.test(t)) return 'calories';
    if (/^energy\s*\(kj\)|^energy\s*kj/.test(t)) return 'energyKj';
    if (/^fats?\b|^total\s*fat/.test(t) && !/saturat/.test(t)) return 'totalFat';
    if (/saturat/.test(t)) return 'saturatedFat';
    if (/^carbs?\b|^carbohydrates?\b/.test(t) && !/sugar/.test(t)) return 'carbohydrates';
    if (/sugar/.test(t)) return 'sugar';
    if (/^proteins?\b/.test(t)) return 'protein';
    if (/^fibres?\b|^fibers?\b|^total\s*fibre|^total\s*fiber/.test(t)) return 'totalFibre';
    if (/^salt\b/.test(t)) return 'salt';
    if (/^sodium\b/.test(t)) return 'sodium';
    if (/serving\s*size|portion/.test(t)) return 'serving';
    return null;
  };

  let dish_name = nonEmpty[0]
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim() || nonEmpty[0];

  const descParts: string[] = [];
  let i = 1;
  for (; i < nonEmpty.length; i++) {
    const line = nonEmpty[i];
    if (isSectionHeader(line)) {
      i++;
      break;
    }
    if (isNutrientLabel(line)) break;
    descParts.push(line);
  }
  while (i < nonEmpty.length && isSectionHeader(nonEmpty[i])) i++;

  const nutrients: Record<string, number> = {};
  let serving_grams: number | null = null;
  let saltG: number | null = null;

  for (; i < nonEmpty.length; i++) {
    const line = nonEmpty[i];
    if (isSectionHeader(line)) continue;

    const same = line.match(
      /^(energy\s*\(kcal\)|energy\s*kcal|calories?|fats?|total\s*fat|carbs?|carbohydrates?|proteins?|fibres?|fibers?|salt|sodium|of which saturates|saturated(?:\s*fat)?|of which sugars|sugars?|serving\s*size)\s*[:\s]+(.+)$/i
    );
    if (same) {
      const key = isNutrientLabel(same[1]) || isNutrientLabel(line);
      const val = key === 'calories' || key === 'energyKj' ? energyFromText(same[2]) : numFrom(same[2]);
      if (key && val != null) {
        if (key === 'serving') serving_grams = val;
        else if (key === 'salt') saltG = val;
        else if (key === 'calories' || key === 'energyKj') {
          if (nutrients.calories == null) nutrients.calories = val;
        } else nutrients[key] = val;
      }
      continue;
    }

    const key = isNutrientLabel(line);
    if (!key) continue;
    const next = nonEmpty[i + 1];
    if (!next || isNutrientLabel(next) || isSectionHeader(next)) continue;
    const val = key === 'calories' || key === 'energyKj' ? energyFromText(next) : numFrom(next);
    if (val == null) continue;
    i++;
    if (key === 'serving') serving_grams = val;
    else if (key === 'salt') saltG = val;
    else if (key === 'calories' || key === 'energyKj') {
      if (nutrients.calories == null) nutrients.calories = val;
    } else nutrients[key] = val;
  }

  if (saltG != null) {
    nutrients.salt = saltG;
    if (nutrients.sodium == null) {
      nutrients.sodium = Math.round(saltG * 400 * 10) / 10;
    }
  }
  if (nutrients.calories == null) warnings.push('No calories (kcal) found');
  if (nutrients.protein == null) warnings.push('No protein found');
  if (nutrients.carbohydrates == null) warnings.push('No carbs found');
  if (nutrients.totalFat == null) warnings.push('No fat found');

  const description = descParts.join(' ').replace(/\s+/g, ' ').trim();
  const cleanedDesc = cleanDescriptionText(description);

  return { dish_name, description: cleanedDesc, nutrients, serving_grams, notes: cleanedDesc, warnings };
}

/** Parse a multi-dish pasted menu blob (e.g. copy-pasted from a restaurant's website/PDF).
 *  Supports "Dish Name (XXX kcal)" headers followed by an "Ingredients:" line and an optional
 *  "Nutrient Profile:" line. Falls back to the single-item parser if no such headers are found,
 *  so pasting one dish still works exactly as before. Section-header-only lines (no kcal, no
 *  ingredients) are silently skipped. */
export function parseMenuNutritionBulkPaste(raw: string): {
  dishes: Array<{
    dish_name: string;
    description: string;
    nutrients: Record<string, number>;
    serving_grams: number | null;
    notes: string;
    warnings: string[];
  }>;
  warnings: string[];
} {
  const lines = String(raw || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  const dishHeaderRe = /^(.+?)\s*\((\d+(?:\.\d+)?)\s*kcal\)$/i;
  const headerIdxs: number[] = [];
  lines.forEach((l, idx) => {
    if (l && dishHeaderRe.test(l)) headerIdxs.push(idx);
  });

  if (headerIdxs.length === 0) {
    // Not bulk format — fall back to treating the whole paste as one dish.
    const single = parseMenuNutritionPaste(raw);
    return {
      dishes: single.dish_name ? [single] : [],
      warnings: single.dish_name ? [] : ['Could not detect any dish in paste'],
    };
  }

  const dishes: Array<{
    dish_name: string;
    description: string;
    nutrients: Record<string, number>;
    serving_grams: number | null;
    notes: string;
    warnings: string[];
  }> = [];
  const globalWarnings: string[] = [];

  for (let h = 0; h < headerIdxs.length; h++) {
    const startIdx = headerIdxs[h];
    const endIdx = h + 1 < headerIdxs.length ? headerIdxs[h + 1] : lines.length;
    const headerMatch = lines[startIdx].match(dishHeaderRe);
    if (!headerMatch) continue;

    const dish_name = headerMatch[1].trim();
    const calories = parseFloat(headerMatch[2]);
    const blockLines = lines.slice(startIdx + 1, endIdx).filter((l) => l.length > 0);

    let description = '';
    const nutrients: Record<string, number> = { calories };
    const warnings: string[] = [];

    for (const line of blockLines) {
      const ingMatch = line.match(/^ingredients\s*:\s*(.+)$/i);
      if (ingMatch) {
        description = ingMatch[1].trim();
        continue;
      }
      const profileMatch = line.match(/^nutrient\s*profile\s*:\s*(.+)$/i);
      if (profileMatch) {
        const parts = profileMatch[1].split('|').map((p) => p.trim());
        for (const part of parts) {
          const kv = part.match(/^([a-zA-Z ]+?)\s*:\s*([\d.]+)\s*g?\s*(?:\(sodium\s*:\s*([\d.]+)\s*mg\))?/i);
          if (!kv) continue;
          const label = kv[1].trim().toLowerCase();
          const val = parseFloat(kv[2]);
          if (isNaN(val)) continue;
          if (/protein/.test(label)) nutrients.protein = val;
          else if (/carb/.test(label)) nutrients.carbohydrates = val;
          else if (/saturated/.test(label)) nutrients.saturatedFat = val;
          else if (/^fats?$/.test(label)) nutrients.totalFat = val;
          else if (/sugar/.test(label)) nutrients.sugar = val;
          else if (/fib(re|er)/.test(label)) nutrients.totalFibre = val;
          else if (/salt/.test(label)) {
            nutrients.salt = val;
            if (kv[3]) nutrients.sodium = parseFloat(kv[3]);
          }
        }
        continue;
      }
      if (!description) description = line;
      else description += ' ' + line;
    }

    if (nutrients.protein == null) warnings.push('No protein found');
    if (nutrients.carbohydrates == null) warnings.push('No carbs found');
    if (nutrients.totalFat == null) warnings.push('No fat found');

    const cleanedDesc = cleanDescriptionText(description);
    dishes.push({
      dish_name,
      description: cleanedDesc,
      nutrients,
      serving_grams: null,
      notes: cleanedDesc,
      warnings,
    });
  }

  return { dishes, warnings: globalWarnings };
}

const LOCAL_FILE = path.join(process.cwd(), 'brand_menu_items_local.json');

export function loadLocalItems(): any[] {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const text = fs.readFileSync(LOCAL_FILE, 'utf-8');
      return JSON.parse(text) || [];
    }
  } catch (e) {
    console.warn('loadLocalItems failed:', e);
  }
  return [];
}

function saveLocalItems(items: any[]) {
  try {
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.warn('saveLocalItems failed:', e);
  }
}

export function registerBrandMenuRoutes(app: Express) {
  /** Upsert or edit a chain menu source */
  app.post('/api/chain-menu-sources/save', async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const id = req.body?.id; // Optional, present if editing
      const chain_key = String(req.body?.chain_key || '').trim().toLowerCase();
      const display_name = String(req.body?.display_name || '').trim();
      const url = String(req.body?.url || '').trim();
      const country_code = String(req.body?.country_code || 'GB');

      if (!chain_key || !url) {
        return res.status(400).json({ error: 'chain_key and url are required' });
      }

      const row: any = {
        country_code,
        chain_key,
        display_name: display_name || chain_key,
        url,
        source_kind: req.body?.source_kind || 'unknown',
        status: req.body?.status || 'pending',
        priority: req.body?.priority || 100,
        enabled: req.body?.enabled !== false,
        updated_at: new Date().toISOString()
      };

      if (id) {
        row.id = id;
        const { data, error } = await supabaseAdmin
          .from('chain_menu_sources')
          .upsert(row, { onConflict: 'id' })
          .select('*')
          .single();
        if (error) throw error;
        return res.json({ success: true, source: data });
      } else {
        const { data, error } = await supabaseAdmin
          .from('chain_menu_sources')
          .upsert(row, { onConflict: 'country_code,chain_key,url' })
          .select('*')
          .single();
        if (error) throw error;
        return res.json({ success: true, source: data });
      }
    } catch (err: any) {
      console.error('[chain_menu_sources/save] error:', err);
      res.status(500).json({ error: err?.message || 'Failed to save chain menu source' });
    }
  });

  app.get('/api/brand-menu-items', async (req: Request, res: Response) => {
    const chain_key = String(req.query.chain_key || '').trim().toLowerCase();
    const country_code = String(req.query.country_code || 'GB');

    const runLocalFallback = () => {
      let items = loadLocalItems();
      if (chain_key) items = items.filter((it: any) => it.chain_key === chain_key);
      if (country_code) items = items.filter((it: any) => it.country_code === country_code);
      items.sort((a: any, b: any) => String(a.dish_name || '').localeCompare(String(b.dish_name || '')));
      const taggedItems = items.map((it: any) => ({ ...it, _source: 'local_fallback' }));
      return res.json({ success: true, items: taggedItems, fallback: true });
    };

    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      let query = supabaseAdmin
        .from('brand_menu_items')
        .select('*');
        
      if (chain_key) query = query.eq('chain_key', chain_key);
      if (country_code) query = query.eq('country_code', country_code);
      
      const { data, error } = await query.order('dish_name', { ascending: true });
      if (error) {
        return runLocalFallback();
      }
      const taggedItems = (data || []).map((it: any) => ({ ...it, _source: 'supabase' }));

      // Include locally-pending items not yet synced to Supabase so the list matches the
      // count shown in chainItemCounts (which counts synced + pending together).
      let pendingItems: any[] = [];
      try {
        let localItems = loadLocalItems();
        if (chain_key) localItems = localItems.filter((it: any) => it.chain_key === chain_key);
        if (country_code) localItems = localItems.filter((it: any) => it.country_code === country_code);
        const syncedKeys = new Set(
          taggedItems.map((it: any) => `${it.chain_key}::${it.dish_name_key || it.dish_name}`)
        );
        pendingItems = localItems
          .filter((it: any) => !syncedKeys.has(`${it.chain_key}::${it.dish_name_key || it.dish_name}`))
          .map((it: any) => ({ ...it, _source: 'local_pending' }));
      } catch (e) {
        console.warn('[brand-menu-items] pending item merge failed:', e);
      }

      res.json({ success: true, items: [...taggedItems, ...pendingItems] });
    } catch (err: any) {
      return runLocalFallback();
    }
  });

  /** Search brand menu items by dish name across ALL chains (one query, no N+1) */
  app.get('/api/brand-menu-items/search', async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim();
    const country_code = String(req.query.country_code || 'GB');
    if (!q) return res.json({ success: true, items: [] });

    const results: any[] = [];

    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const { data, error } = await supabaseAdmin
        .from('brand_menu_items')
        .select('*')
        .eq('country_code', country_code)
        .ilike('dish_name', `%${q}%`)
        .limit(50);
      if (!error && data) {
        results.push(...data.map((it: any) => ({ ...it, _source: 'supabase' })));
      }
    } catch (e) {
      console.warn('[brand-menu-items/search] supabase query failed:', e);
    }

    try {
      const local = loadLocalItems().filter((it: any) =>
        it.country_code === country_code &&
        (it.dish_name || '').toLowerCase().includes(q.toLowerCase())
      );
      results.push(...local.map((it: any) => ({ ...it, _source: 'local_fallback' })));
    } catch (e) {
      console.warn('[brand-menu-items/search] local search failed:', e);
    }

    res.json({ success: true, items: results.slice(0, 50) });
  });

  app.post('/api/brand-menu-items/import', async (req: Request, res: Response) => {
    const { chain_key, country_code, items } = req.body;
    if (!chain_key || !Array.isArray(items)) {
      return res.status(400).json({ error: 'chain_key and items array required' });
    }
    const rows = items.map((it: any) => ({
      country_code: country_code || 'GB',
      chain_key: chain_key.trim().toLowerCase(),
      dish_name: it.dish_name,
      dish_name_key: normalizeDishKey(it.dish_name),
      serving_grams: it.serving_grams || null,
      nutrients: it.nutrients || {},
      source_url: it.source_url || null,
      notes: it.notes || '',
      enabled: true,
      updated_at: new Date().toISOString()
    }));

    const runLocalFallback = () => {
      const all = loadLocalItems();
      rows.forEach((row: any) => {
        const idx = all.findIndex((it: any) => 
          it.country_code === row.country_code && 
          it.chain_key === row.chain_key && 
          it.dish_name_key === row.dish_name_key
        );
        if (idx >= 0) all[idx] = row;
        else all.push(row);
      });
      saveLocalItems(all);
      return res.json({ success: true, upserted: rows.length, items: rows, fallback: true });
    };

    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const { data, error } = await supabaseAdmin
        .from('brand_menu_items')
        .upsert(rows, { onConflict: 'country_code,chain_key,dish_name_key' })
        .select('*');
      if (error) {
        return runLocalFallback();
      }
      res.json({ success: true, upserted: (data || []).length, items: data });
    } catch (err: any) {
      return runLocalFallback();
    }
  });

  /** Parse + save a pasted nutrition panel (YOLK-style) as one brand menu item */
  app.post('/api/brand-menu-items/paste', async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const chain_key = String(req.body?.chain_key || '').trim().toLowerCase();
      const country_code = String(req.body?.country_code || 'GB');
      const text = String(req.body?.text || req.body?.paste || '');
      if (!chain_key) return res.status(400).json({ error: 'chain_key required' });
      if (!text.trim()) return res.status(400).json({ error: 'paste text required' });

      const parsed = parseMenuNutritionPaste(text);
      if (!parsed.dish_name || parsed.dish_name.length < 2) {
        return res.status(400).json({ error: 'Could not parse dish name from paste', parsed });
      }
      if (parsed.nutrients.calories == null && Object.keys(parsed.nutrients).length === 0) {
        return res.status(400).json({ error: 'Could not parse nutrients from paste', parsed });
      }

      const dish_name_key = normalizeDishKey(parsed.dish_name);
      const row = {
        country_code,
        chain_key,
        dish_name: parsed.dish_name,
        dish_name_key,
        serving_grams: parsed.serving_grams,
        nutrients: parsed.nutrients,
        source_url: req.body?.source_url || null,
        notes: parsed.notes,
        enabled: true,
        updated_at: new Date().toISOString(),
      };

      const runLocalFallback = async () => {
        const all = loadLocalItems();
        const idx = all.findIndex((it: any) => 
          it.country_code === row.country_code && 
          it.chain_key === row.chain_key && 
          it.dish_name_key === row.dish_name_key
        );
        if (idx >= 0) all[idx] = row;
        else all.push(row);
        saveLocalItems(all);
        try {
          await maybeMarkChainReady(supabaseAdmin, chain_key, country_code);
        } catch (_) {}
        return res.json({ success: true, item: { ...row, _source: 'local_fallback' }, parsed, fallback: true });
      };

      const { data, error } = await supabaseAdmin
        .from('brand_menu_items')
        .upsert(row, { onConflict: 'country_code,chain_key,dish_name_key' })
        .select('*')
        .single();
      if (error) {
        return await runLocalFallback();
      }
      try {
        await maybeMarkChainReady(supabaseAdmin, chain_key, country_code);
      } catch (_) {}
      res.json({ success: true, item: { ...data, _source: 'supabase' }, parsed });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'paste failed' });
    }
  });

  /** Parse + save a multi-dish pasted menu blob as many brand menu items at once */
  app.post('/api/brand-menu-items/bulk-paste', async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const chain_key = String(req.body?.chain_key || '').trim().toLowerCase();
      const country_code = String(req.body?.country_code || 'GB');
      const text = String(req.body?.text || req.body?.paste || '');
      if (!chain_key) return res.status(400).json({ error: 'chain_key required' });
      if (!text.trim()) return res.status(400).json({ error: 'paste text required' });

      const { dishes, warnings } = parseMenuNutritionBulkPaste(text);
      if (dishes.length === 0) {
        return res.status(400).json({ error: 'Could not parse any dishes from paste', warnings });
      }

      const results: Array<{ dish_name: string; status: 'saved' | 'error'; source?: string; warnings: string[]; error?: string }> = [];

      for (const dish of dishes) {
        if (!dish.dish_name || dish.dish_name.length < 2) {
          results.push({ dish_name: dish.dish_name || '(unnamed)', status: 'error', warnings: dish.warnings, error: 'Missing dish name' });
          continue;
        }
        if (dish.nutrients.calories == null) {
          results.push({ dish_name: dish.dish_name, status: 'error', warnings: dish.warnings, error: 'No calories found' });
          continue;
        }

        const dish_name_key = normalizeDishKey(dish.dish_name);
        const row = {
          country_code,
          chain_key,
          dish_name: dish.dish_name,
          dish_name_key,
          serving_grams: dish.serving_grams,
          nutrients: dish.nutrients,
          source_url: req.body?.source_url || null,
          notes: dish.notes,
          enabled: true,
          updated_at: new Date().toISOString(),
        };

        try {
          const { error } = await supabaseAdmin
            .from('brand_menu_items')
            .upsert(row, { onConflict: 'country_code,chain_key,dish_name_key' })
            .select('*')
            .single();
          if (error) throw error;
          results.push({ dish_name: dish.dish_name, status: 'saved', source: 'supabase', warnings: dish.warnings });
        } catch (e: any) {
          const all = loadLocalItems();
          const idx = all.findIndex((it: any) =>
            it.country_code === row.country_code &&
            it.chain_key === row.chain_key &&
            it.dish_name_key === row.dish_name_key
          );
          if (idx >= 0) all[idx] = row;
          else all.push(row);
          saveLocalItems(all);
          results.push({ dish_name: dish.dish_name, status: 'saved', source: 'local_fallback', warnings: dish.warnings });
        }
      }

      try {
        await maybeMarkChainReady(supabaseAdmin, chain_key, country_code);
      } catch (_) {}

      const savedToSupabase = results.filter((r) => r.source === 'supabase').length;
      const savedLocalOnly = results.filter((r) => r.source === 'local_fallback').length;
      const errors = results.filter((r) => r.status === 'error').length;

      res.json({
        success: true,
        results,
        summary: { total: dishes.length, savedToSupabase, savedLocalOnly, errors },
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'bulk paste failed' });
    }
  });

  /** Edit/update a brand menu item */
  app.post('/api/brand-menu-items/edit', async (req: Request, res: Response) => {
    const country_code = String(req.body?.country_code || 'GB');
    const chain_key = String(req.body?.chain_key || '').trim().toLowerCase();
    const dish_name_key = String(req.body?.dish_name_key || '').trim();
    const dish_name = String(req.body?.dish_name || '').trim();
    const serving_grams = req.body?.serving_grams != null ? Number(req.body.serving_grams) : null;
    const basis_type = String(req.body?.basis_type || 'per_dish');
    const nutrients = req.body?.nutrients || {};
    const notes = String(req.body?.notes || '').trim();
    const ingredients = req.body?.ingredients != null ? String(req.body.ingredients).trim() : undefined;

    if (!chain_key || !dish_name_key) {
      return res.status(400).json({ error: 'chain_key and dish_name_key are required' });
    }

    const runLocalFallback = () => {
      const all = loadLocalItems();
      const idx = all.findIndex((it: any) => 
        it.country_code === country_code && 
        it.chain_key === chain_key && 
        it.dish_name_key === dish_name_key
      );
      if (idx >= 0) {
        const row = all[idx];
        row.dish_name = dish_name;
        row.serving_grams = serving_grams;
        row.basis_type = basis_type;
        row.nutrients = { ...row.nutrients, ...nutrients };
        row.notes = notes;
        if (ingredients !== undefined) {
          row.ingredients = ingredients;
        }
        row.updated_at = new Date().toISOString();
        saveLocalItems(all);
        return res.json({ success: true, item: row, fallback: true });
      }
      return res.status(404).json({ error: 'Item not found in local cache' });
    };

    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const { data, error } = await supabaseAdmin
        .from('brand_menu_items')
        .update({
          dish_name,
          serving_grams,
          basis_type,
          nutrients,
          notes,
          ...(ingredients !== undefined ? { ingredients } : {}),
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code)
        .eq('chain_key', chain_key)
        .eq('dish_name_key', dish_name_key)
        .select('*')
        .single();

      if (error) {
        return runLocalFallback();
      }
      res.json({ success: true, item: data });
    } catch (err: any) {
      return runLocalFallback();
    }
  });

  /** Delete a brand menu item */
  app.post('/api/brand-menu-items/delete', async (req: Request, res: Response) => {
    const country_code = String(req.body?.country_code || 'GB');
    const chain_key = String(req.body?.chain_key || '').trim().toLowerCase();
    const dish_name_key = String(req.body?.dish_name_key || '').trim();

    if (!chain_key || !dish_name_key) {
      return res.status(400).json({ error: 'chain_key and dish_name_key are required' });
    }

    const runLocalFallback = () => {
      const all = loadLocalItems();
      const filtered = all.filter((it: any) => 
        !(it.country_code === country_code && 
          it.chain_key === chain_key && 
          it.dish_name_key === dish_name_key)
      );
      saveLocalItems(filtered);
      return res.json({ success: true, fallback: true });
    };

    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const { error } = await supabaseAdmin
        .from('brand_menu_items')
        .delete()
        .eq('country_code', country_code)
        .eq('chain_key', chain_key)
        .eq('dish_name_key', dish_name_key);

      if (error) {
        return runLocalFallback();
      }
      res.json({ success: true });
    } catch (err: any) {
      return runLocalFallback();
    }
  });

  /** Push any local-fallback brand menu items into Supabase, removing them locally once synced */
  app.post('/api/brand-menu-items/sync-to-supabase', async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const country_code = String(req.body?.country_code || 'GB');
      const chain_key = req.body?.chain_key ? String(req.body.chain_key).trim().toLowerCase() : null;

      const all = loadLocalItems();
      const toSync = all.filter((it: any) =>
        it.country_code === country_code && (!chain_key || it.chain_key === chain_key)
      );

      if (toSync.length === 0) {
        return res.json({ success: true, synced: 0, failed: 0, remainingLocalOnly: 0 });
      }

      let synced = 0;
      let failed = 0;
      const stillLocal: any[] = [];
      const sampleErrors: string[] = [];

      for (const item of toSync) {
        try {
          const { error } = await supabaseAdmin
            .from('brand_menu_items')
            .upsert(item, { onConflict: 'country_code,chain_key,dish_name_key' })
            .select('*')
            .single();
          if (error) throw error;
          synced++;
        } catch (e: any) {
          failed++;
          stillLocal.push(item);
          const msg = e?.message || String(e);
          console.error('[sync-to-supabase] upsert failed for', item.dish_name_key, ':', msg);
          if (sampleErrors.length < 3 && !sampleErrors.includes(msg)) {
            sampleErrors.push(msg);
          }
        }
      }

      const untouched = all.filter((it: any) =>
        !(it.country_code === country_code && (!chain_key || it.chain_key === chain_key))
      );
      saveLocalItems([...untouched, ...stillLocal]);

      res.json({ success: true, synced, failed, remainingLocalOnly: stillLocal.length, sampleErrors });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'sync failed' });
    }
  });

  /** Preview parse only (no save) */
  app.post('/api/brand-menu-items/parse-paste', async (req: Request, res: Response) => {
    try {
      const text = String(req.body?.text || req.body?.paste || '');
      const parsed = parseMenuNutritionPaste(text);
      res.json({ success: true, parsed });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'parse failed' });
    }
  });

  /** Admin route: Trigger self-cleaning and database deduplication */
  app.post('/api/admin/db-clean', async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      const chainStats = await consolidateBrandMenuItemsAndChains(supabaseAdmin);
      const catalogStats = await cleanUnbrandedFoodCatalog(supabaseAdmin);
      res.json({
        success: true,
        chainStats,
        catalogStats,
        message: 'Self-cleaning database maintenance completed successfully.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Self-cleaning failed' });
    }
  });
}

export async function consolidateBrandMenuItemsAndChains(
  supabaseAdmin: any,
  addDebugLog?: (msg: string) => void
): Promise<{ mergedItemsCount: number; deletedDuplicatesCount: number; updatedChainsCount: number; duplicatesFound: { chain_key: string; dish_name: string; kept: number; removed: number }[] }> {
  let mergedItemsCount = 0;
  let deletedDuplicatesCount = 0;
  let updatedChainsCount = 0;
  const duplicatesFound: { chain_key: string; dish_name: string; kept: number; removed: number }[] = [];

  try {
    if (!supabaseAdmin) return { mergedItemsCount, deletedDuplicatesCount, updatedChainsCount, duplicatesFound };

    // 1. Fetch all brand menu items
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
          if (addDebugLog) addDebugLog(`Deleted empty nutrient item: ${item.chain_key} - ${item.dish_name}`);
          continue;
        }
        const cCode = (item.country_code || 'GB').toUpperCase();
        const normChain = normalizeChainKey(item.chain_key || item.chain_name || '');
        const normDish = normalizeDishKey(item.dish_name || item.dish_name_key || '');
        if (!normChain || !normDish) continue;

        const missingBasis = !item.basis_type || String(item.basis_type).trim() === '';
        if (missingBasis) {
          await supabaseAdmin
            .from('brand_menu_items')
            .update({
              basis_type: 'per_dish',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          item.basis_type = 'per_dish';
          updatedChainsCount++;
        }

        const groupKey = `${cCode}::${normChain}::${normDish}`;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(item);
      }

      for (const [groupKey, items] of groups.entries()) {
        const [cCode, normChain, normDish] = groupKey.split('::');

        if (items.length === 1) {
          const single = items[0];
          const needsBasisFix = single.basis_type === 'per_100g' && (!single.serving_grams || single.serving_grams === 100);
          
          if (single.chain_key !== normChain || single.dish_name_key !== normDish || needsBasisFix) {
            const { error: upErr } = await supabaseAdmin
              .from('brand_menu_items')
              .update({
                chain_key: normChain,
                dish_name_key: normDish,
                ...(needsBasisFix ? { basis_type: 'per_dish', serving_grams: null } : {}),
                updated_at: new Date().toISOString()
              })
              .eq('id', single.id);
            if (!upErr) updatedChainsCount++;
          }
        } else if (items.length > 1) {
          items.sort((a, b) => {
            const aNutCount = Object.values(a.nutrients || {}).filter((v: any) => Number(v) > 0).length;
            const bNutCount = Object.values(b.nutrients || {}).filter((v: any) => Number(v) > 0).length;
            if (bNutCount !== aNutCount) return bNutCount - aNutCount;
            const aCapt = Number(a.capture_count || 1);
            const bCapt = Number(b.capture_count || 1);
            if (bCapt !== aCapt) return bCapt - aCapt;
            return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
          });

          const primary = items[0];
          const duplicates = items.slice(1);

          duplicatesFound.push({
            chain_key: normChain,
            dish_name: items[0].dish_name || normDish,
            kept: 1,
            removed: items.length - 1
          });

          const mergedNutrients = { ...(primary.nutrients || {}) };
          let totalCaptures = Number(primary.capture_count || 1);
          let mergedIngredients = primary.ingredients || null;

          for (const dup of duplicates) {
            totalCaptures += Number(dup.capture_count || 1);
            if (!mergedIngredients && dup.ingredients) {
              mergedIngredients = dup.ingredients;
            }
            if (dup.nutrients && typeof dup.nutrients === 'object') {
              for (const [k, v] of Object.entries(dup.nutrients)) {
                if ((mergedNutrients[k] === undefined || mergedNutrients[k] === null) && v !== null && v !== undefined) {
                  mergedNutrients[k] = Number(v);
                }
              }
            }
          }

          const needsBasisFix = primary.basis_type === 'per_100g' && (!primary.serving_grams || primary.serving_grams === 100);

          const { error: updatePrimaryErr } = await supabaseAdmin
            .from('brand_menu_items')
            .update({
              chain_key: normChain,
              dish_name_key: normDish,
              nutrients: mergedNutrients,
              ingredients: mergedIngredients,
              capture_count: totalCaptures,
              ...(needsBasisFix ? { basis_type: 'per_dish', serving_grams: null } : {}),
              updated_at: new Date().toISOString()
            })
            .eq('id', primary.id);

          if (!updatePrimaryErr) {
            mergedItemsCount++;
            const dupIds = duplicates.map(d => d.id).filter(Boolean);
            if (dupIds.length > 0) {
              const { error: delErr } = await supabaseAdmin
                .from('brand_menu_items')
                .delete()
                .in('id', dupIds);
              if (!delErr) {
                deletedDuplicatesCount += dupIds.length;
              }
            }
          }
        }
      }
    }

    // 1B. Semantic dedup within each chain: catch the same product listed under different
    // names (e.g. a user-typed generic name vs. the official branded product name) by
    // comparing nutrient profiles. The exact-key merge above only catches formatting
    // variations of the SAME name; this catches DIFFERENT names for the SAME product.
    try {
      const { data: postMergeItems, error: postMergeErr } = await supabaseAdmin
        .from('brand_menu_items')
        .select('*');

      if (!postMergeErr && Array.isArray(postMergeItems) && postMergeItems.length > 1) {
        const chainGroups = new Map<string, any[]>();
        for (const item of postMergeItems) {
          const cCode = (item.country_code || 'GB').toUpperCase();
          const normChain = normalizeChainKey(item.chain_key || item.chain_name || '');
          if (!normChain) continue;
          const key = `${cCode}::${normChain}`;
          if (!chainGroups.has(key)) chainGroups.set(key, []);
          chainGroups.get(key)!.push(item);
        }

        // Heuristic: score how "official" a dish name looks vs. a user-typed generic label.
        // Signals for official: multi-word Title Case, retailer qualifiers ("Taste the
        // Difference", "Finest", "Extra Special"), longer descriptive names.
        // Signals for generic/user-typed: '+' separators, all-lowercase, very short.
        const officialNameScore = (name: string): number => {
          const n = String(name || '');
          let score = 0;
          if (/\+/.test(n)) score -= 3;
          if (n === n.toLowerCase()) score -= 2;
          const capWords = (n.match(/\b[A-Z][a-z]/g) || []).length;
          score += capWords;
          if (/taste the difference|finest|extra special|reserve|signature select/i.test(n)) score += 4;
          score += Math.min(n.length / 12, 3);
          return score;
        };

        // Nutrients must be within tolerance across the core macros to be considered the
        // same product; name similarity alone is never sufficient grounds to merge.
        const NUTRIENT_KEYS = ['calories', 'protein', 'carbohydrates', 'totalFat', 'totalFibre'];
        const withinTolerance = (a: any, b: any): boolean => {
          let comparable = 0;
          for (const k of NUTRIENT_KEYS) {
            const av = Number(a?.[k]);
            const bv = Number(b?.[k]);
            if (!Number.isFinite(av) || !Number.isFinite(bv)) continue;
            comparable++;
            const base = Math.max(Math.abs(av), Math.abs(bv), 1);
            if (Math.abs(av - bv) / base > 0.05) return false;
          }
          return comparable >= 3;
        };

        for (const [, items] of chainGroups.entries()) {
          if (items.length < 2) continue;
          const used = new Set<string>();
          for (let i = 0; i < items.length; i++) {
            const a = items[i];
            if (!a?.id || used.has(a.id)) continue;
            const semanticDupes: any[] = [];
            for (let j = i + 1; j < items.length; j++) {
              const b = items[j];
              if (!b?.id || used.has(b.id)) continue;
              // Items with identical dish_name_key were already merged in Step 1; only
              // look at genuinely different names here.
              if ((a.dish_name_key || '') === (b.dish_name_key || '')) continue;
              if (withinTolerance(a.nutrients || {}, b.nutrients || {})) {
                semanticDupes.push(b);
              }
            }
            if (semanticDupes.length === 0) continue;

            const candidates = [a, ...semanticDupes];
            candidates.sort((x, y) => officialNameScore(y.dish_name) - officialNameScore(x.dish_name));
            const primary = candidates[0];
            const dupes = candidates.slice(1);

            const mergedNutrients = { ...(primary.nutrients || {}) };
            let totalCaptures = Number(primary.capture_count || 1);
            let mergedIngredients = primary.ingredients || null;
            for (const dup of dupes) {
              totalCaptures += Number(dup.capture_count || 1);
              if (!mergedIngredients && dup.ingredients) mergedIngredients = dup.ingredients;
              if (dup.nutrients && typeof dup.nutrients === 'object') {
                for (const [k, v] of Object.entries(dup.nutrients)) {
                  if ((mergedNutrients[k] === undefined || mergedNutrients[k] === null) && v !== null && v !== undefined) {
                    mergedNutrients[k] = Number(v);
                  }
                }
              }
            }

            const needsBasisFix = primary.basis_type === 'per_100g' && (!primary.serving_grams || primary.serving_grams === 100);

            const { error: updatePrimaryErr } = await supabaseAdmin
              .from('brand_menu_items')
              .update({
                nutrients: mergedNutrients,
                ingredients: mergedIngredients,
                capture_count: totalCaptures,
                ...(needsBasisFix ? { basis_type: 'per_dish', serving_grams: null } : {}),
                updated_at: new Date().toISOString()
              })
              .eq('id', primary.id);

            if (!updatePrimaryErr) {
              mergedItemsCount++;
              const dupIds = dupes.map(d => d.id).filter(Boolean);
              if (dupIds.length > 0) {
                const { error: delErr } = await supabaseAdmin
                  .from('brand_menu_items')
                  .delete()
                  .in('id', dupIds);
                if (!delErr) {
                  deletedDuplicatesCount += dupIds.length;
                  if (addDebugLog) {
                    addDebugLog(`[SelfCleaning:Semantic] Merged "${dupes.map(d => d.dish_name).join('", "')}" into "${primary.dish_name}" (nutrient match, ${dupIds.length} duplicate row(s) removed).`);
                  }
                }
              }
              used.add(a.id);
              dupes.forEach(d => used.add(d.id));
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[consolidateBrandMenuItemsAndChains:semantic] Error:', err);
    }

    // 2. Consolidate chain_menu_sources
    const { data: sources, error: sourcesErr } = await supabaseAdmin
      .from('chain_menu_sources')
      .select('*');

    if (!sourcesErr && Array.isArray(sources) && sources.length > 0) {
      const sourceGroups = new Map<string, any[]>();
      for (const s of sources) {
        const cCode = (s.country_code || 'GB').toUpperCase();
        const normChain = normalizeChainKey(s.chain_key || s.display_name || '');
        if (!normChain) continue;

        const groupKey = `${cCode}::${normChain}`;
        if (!sourceGroups.has(groupKey)) sourceGroups.set(groupKey, []);
        sourceGroups.get(groupKey)!.push(s);
      }

      for (const [groupKey, sList] of sourceGroups.entries()) {
        const [cCode, normChain] = groupKey.split('::');
        if (sList.length === 1) {
          const single = sList[0];
          if (single.chain_key !== normChain) {
            await supabaseAdmin
              .from('chain_menu_sources')
              .update({ chain_key: normChain, display_name: single.display_name || normChain, updated_at: new Date().toISOString() })
              .eq('id', single.id);
          }
        } else if (sList.length > 1) {
          // Sort to pick best primary source: prefers ready status, non-empty url, or most recently updated
          sList.sort((a, b) => {
            const aReady = a.status === 'ready' ? 1 : 0;
            const bReady = b.status === 'ready' ? 1 : 0;
            if (bReady !== aReady) return bReady - aReady;
            const aHasUrl = a.url ? 1 : 0;
            const bHasUrl = b.url ? 1 : 0;
            if (bHasUrl !== aHasUrl) return bHasUrl - aHasUrl;
            return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
          });

          const primary = sList[0];
          const duplicates = sList.slice(1);

          await supabaseAdmin
            .from('chain_menu_sources')
            .update({ chain_key: normChain, updated_at: new Date().toISOString() })
            .eq('id', primary.id);

          const dupIds = duplicates.map(d => d.id).filter(Boolean);
          if (dupIds.length > 0) {
            const { error: delErr } = await supabaseAdmin.from('chain_menu_sources').delete().in('id', dupIds);
            if (!delErr) {
              deletedDuplicatesCount += dupIds.length;
            }
          }
        }
      }
    }

    if (addDebugLog && (mergedItemsCount > 0 || deletedDuplicatesCount > 0 || updatedChainsCount > 0)) {
      addDebugLog(`[SelfCleaning] Consolidated brand menu items: ${updatedChainsCount} chain keys updated, ${mergedItemsCount} items merged, ${deletedDuplicatesCount} duplicate rows removed.`);
    }
  } catch (err: any) {
    console.warn('[consolidateBrandMenuItemsAndChains] Error:', err);
  }

  return { mergedItemsCount, deletedDuplicatesCount, updatedChainsCount, duplicatesFound };
}

export async function cleanUnbrandedFoodCatalog(
  supabaseAdmin: any,
  addDebugLog?: (msg: string) => void
): Promise<{ purgedBrandedCount: number; purgedZeroMacroCount: number }> {
  let purgedBrandedCount = 0;
  let purgedZeroMacroCount = 0;

  try {
    if (!supabaseAdmin) return { purgedBrandedCount, purgedZeroMacroCount };

    const { data: foodItems, error } = await supabaseAdmin
      .from('food_items')
      .select('*');

    if (error || !Array.isArray(foodItems) || foodItems.length === 0) {
      return { purgedBrandedCount, purgedZeroMacroCount };
    }

    const toDeleteIds: string[] = [];
    const toDeleteKeys: string[] = [];

    for (const fi of foodItems) {
      const name = fi.display_name || '';
      const key = fi.food_key || '';
      const nutrients = fi.nutrients_per_100g || {};
      const cals = Number(nutrients.calories || 0);
      const p = Number(nutrients.protein || 0);
      const c = Number(nutrients.carbohydrates || 0);
      const f = Number(nutrients.totalFat || 0);

      const isBranded = isKnownDatabaseBrandSync(name) || isKnownDatabaseBrandSync(key) || isGroceryBrandSync(name);
      const isZeroMacroCandidate = fi.status === 'candidate' && cals === 0 && p === 0 && c === 0 && f === 0;

      if (isBranded) {
        toDeleteIds.push(fi.food_id);
        toDeleteKeys.push(fi.food_key);
        purgedBrandedCount++;
      } else if (isZeroMacroCandidate) {
        toDeleteIds.push(fi.food_id);
        toDeleteKeys.push(fi.food_key);
        purgedZeroMacroCount++;
      } else {
        if (!fi.basis_type || String(fi.basis_type).trim() === '') {
          await supabaseAdmin
            .from('food_items')
            .update({
              basis_type: 'per_100g',
              updated_at: new Date().toISOString()
            })
            .eq('food_id', fi.food_id);
          fi.basis_type = 'per_100g';
        }
      }
    }

    if (toDeleteIds.length > 0) {
      await supabaseAdmin.from('food_items').delete().in('food_id', toDeleteIds);
      if (toDeleteKeys.length > 0) {
        await supabaseAdmin.from('food_aliases').delete().in('alias_key', toDeleteKeys);
      }
    }

    // Also clean up dish_cache basis_type defaults
    try {
      const { data: dishes, error: dishError } = await supabaseAdmin
        .from('dish_cache')
        .select('*');
      if (!dishError && Array.isArray(dishes)) {
        for (const d of dishes) {
          if (!d.basis_type || String(d.basis_type).trim() === '') {
            await supabaseAdmin
              .from('dish_cache')
              .update({
                basis_type: 'per_100g',
                updated_at: new Date().toISOString()
              })
              .eq('id', d.id);
          }
        }
      }
    } catch (dishErr) {
      console.warn('[cleanUnbrandedFoodCatalog] dish_cache fix error:', dishErr);
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
            if (addDebugLog) addDebugLog(`[SelfCleaning] Deleted ${dupIds.length} duplicates for catalog item: ${key}`);
          }
        }
      }
    }

    if (addDebugLog && (purgedBrandedCount > 0 || purgedZeroMacroCount > 0)) {
      addDebugLog(`[SelfCleaning] Food Catalog Clean-up: Purged ${purgedBrandedCount} branded items and ${purgedZeroMacroCount} 0-macro candidates from unbranded food catalog.`);
    }
  } catch (err: any) {
    console.warn('[cleanUnbrandedFoodCatalog] Error:', err);
  }

  return { purgedBrandedCount, purgedZeroMacroCount };
}

let cachedBrandSet: Set<string> | null = null;
let cachedGroceryBrandSet: Set<string> | null = null;
let lastBrandCacheTime = 0;
const BRAND_CACHE_TTL_MS = 60000; // 1 minute TTL

export async function fetchAllDatabaseBrands(): Promise<{ allBrands: Set<string>; groceryBrands: Set<string> }> {
  const now = Date.now();
  if (cachedBrandSet && cachedGroceryBrandSet && (now - lastBrandCacheTime < BRAND_CACHE_TTL_MS)) {
    return { allBrands: cachedBrandSet, groceryBrands: cachedGroceryBrandSet };
  }

  const allBrands = new Set<string>();
  const groceryBrands = new Set<string>();

  // Baseline seeds to ensure immediate availability before DB returns
  const defaultGrocery = ['sainsbury', 'sainsburys', "sainsbury's", 'tesco', 'asda', 'morrisons', 'aldi', 'lidl', 'waitrose', 'marks and spencer', 'm&s', 'co-op', 'coop', 'kroger', 'safeway', 'whole foods', 'trader joe'];
  const defaultChains = ['mcdonald', 'mcdonalds', "mcdonald's", 'kfc', 'burger king', 'subway', 'starbucks', 'domino', 'pizza hut', 'taco bell', 'popeyes', 'wendy', 'dunkin', 'greggs', 'nando', 'nandos', 'yolk', 'pret', 'itsu', 'wagamama'];

  defaultGrocery.forEach(b => { allBrands.add(b); groceryBrands.add(b); });
  defaultChains.forEach(b => { allBrands.add(b); });

  try {
    const { supabaseAdmin } = await import('./supabaseAdmin.js');

    // 1. Fetch from brand_menu_items
    const { data: bmi } = await supabaseAdmin
      .from('brand_menu_items')
      .select('chain_name, chain_key, category');
    if (bmi && Array.isArray(bmi)) {
      bmi.forEach((r: any) => {
        const name = (r.chain_name || '').toLowerCase().trim();
        const key = (r.chain_key || '').replace(/_/g, ' ').toLowerCase().trim();
        if (name) allBrands.add(name);
        if (key) allBrands.add(key);
        if (r.category && /grocery|supermarket|retail|store/i.test(r.category)) {
          if (name) groceryBrands.add(name);
          if (key) groceryBrands.add(key);
        }
      });
    }

    // 2. Fetch from chain_menu_sources
    const { data: cms } = await supabaseAdmin
      .from('chain_menu_sources')
      .select('chain_name, chain_key, category');
    if (cms && Array.isArray(cms)) {
      cms.forEach((r: any) => {
        const name = (r.chain_name || '').toLowerCase().trim();
        const key = (r.chain_key || '').replace(/_/g, ' ').toLowerCase().trim();
        if (name) allBrands.add(name);
        if (key) allBrands.add(key);
        if (r.category && /grocery|supermarket|retail|store/i.test(r.category)) {
          if (name) groceryBrands.add(name);
          if (key) groceryBrands.add(key);
        }
      });
    }

    // 3. Fetch from food_items (where brand_name is present)
    const { data: fi } = await supabaseAdmin
      .from('food_items')
      .select('brand_name')
      .not('brand_name', 'is', null)
      .limit(1000);
    if (fi && Array.isArray(fi)) {
      fi.forEach((r: any) => {
        if (r.brand_name) {
          const b = String(r.brand_name).toLowerCase().trim();
          if (b) allBrands.add(b);
        }
      });
    }
  } catch (err) {
    console.warn('[fetchAllDatabaseBrands] Supabase fetch warning:', err);
  }

  // 4. Fetch local fallback items
  try {
    const localItems = loadLocalItems();
    localItems.forEach((r: any) => {
      const name = (r.chain_name || '').toLowerCase().trim();
      const key = (r.chain_key || '').replace(/_/g, ' ').toLowerCase().trim();
      if (name) allBrands.add(name);
      if (key) allBrands.add(key);
      if (r.category && /grocery|supermarket|retail|store/i.test(r.category)) {
        if (name) groceryBrands.add(name);
        if (key) groceryBrands.add(key);
      }
    });
  } catch (_) {}

  cachedBrandSet = allBrands;
  cachedGroceryBrandSet = groceryBrands;
  lastBrandCacheTime = now;
  return { allBrands, groceryBrands };
}

export async function isKnownDatabaseBrand(text: string): Promise<boolean> {
  if (!text) return false;
  const { allBrands } = await fetchAllDatabaseBrands();
  const lower = text.toLowerCase();
  for (const b of allBrands) {
    if (!b || b.length < 2) continue;
    const regex = new RegExp(`\\b${b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) return true;
  }
  return false;
}

export function isKnownDatabaseBrandSync(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const set = cachedBrandSet;
  if (!set) {
    // Fallback if not initialized yet
    return /\b(sainsbury|tesco|asda|morrisons|aldi|lidl|waitrose|mcdonald|kfc|starbucks|pret|yolk|greg|nando)\b/i.test(lower);
  }
  for (const b of set) {
    if (!b || b.length < 2) continue;
    const regex = new RegExp(`\\b${b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) return true;
  }
  return false;
}

export function isGroceryBrandSync(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const set = cachedGroceryBrandSet;
  if (!set || set.size === 0) {
    return /\b(sainsbury|tesco|asda|morrisons|aldi|lidl|waitrose|co-op|marks and spencer|m&s|kroger|safeway|whole foods|trader joe)\b/i.test(lower);
  }
  for (const b of set) {
    if (!b || b.length < 2) continue;
    const regex = new RegExp(`\\b${b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) return true;
  }
  return false;
}

let cachedAllBrandItems: any[] | null = null;
let lastBrandItemsCacheTime = 0;
const BRAND_ITEMS_CACHE_TTL_MS = 60000; // 1 minute TTL

export async function fetchAllBrandMenuItems(): Promise<any[]> {
  const now = Date.now();
  if (cachedAllBrandItems && (now - lastBrandItemsCacheTime < BRAND_ITEMS_CACHE_TTL_MS)) {
    return cachedAllBrandItems;
  }

  let items: any[] = [];
  try {
    const { supabaseAdmin } = await import('./supabaseAdmin.js');
    const { data, error } = await supabaseAdmin.from('brand_menu_items').select('*');
    if (data && !error && Array.isArray(data)) {
      items = data;
    }
  } catch (err) {
    console.warn('[fetchAllBrandMenuItems] Supabase fetch warning:', err);
  }

  try {
    const localItems = loadLocalItems();
    if (Array.isArray(localItems)) {
      const existingKeys = new Set(items.map(it => `${it.chain_key || ''}_${it.dish_name_key || normalizeDishKey(it.dish_name || '')}`));
      localItems.forEach(it => {
        const key = `${it.chain_key || ''}_${it.dish_name_key || normalizeDishKey(it.dish_name || '')}`;
        if (!existingKeys.has(key)) {
          items.push(it);
        }
      });
    }
  } catch (_) {}

  cachedAllBrandItems = items;
  lastBrandItemsCacheTime = now;
  return items;
}

export async function searchBrandMenuItems(query: string, explicitChainKey?: string): Promise<any[]> {
  if (!query || query.trim().length < 2) return [];

  const allItems = await fetchAllBrandMenuItems();
  if (!allItems || allItems.length === 0) return [];

  const normQ = normalizeDishKey(query);
  const qLower = query.toLowerCase();

  const scoreDishMatch = (queryKey: string, itemKey: string, chainKey?: string): number => {
    if (queryKey === itemKey) return 999;
    if (chainKey && queryKey === `${chainKey}_${itemKey}`) return 999;
    if (chainKey && `${chainKey}_${itemKey}`.includes(queryKey)) return 500;
    if (queryKey.includes(itemKey) && itemKey.length > 4) return 200;

    const qWords = new Set(queryKey.split('_').filter(w => w.length > 2));
    const iWords = new Set(itemKey.split('_').filter(w => w.length > 2));
    if (qWords.size === 0 || iWords.size === 0) return 0;

    let shared = 0;
    qWords.forEach(w => { if (iWords.has(w)) shared++; });
    const ratio = shared / Math.min(qWords.size, iWords.size);

    if (chainKey && (qLower.includes(chainKey.replace(/_/g, ' ')) || qLower.includes(chainKey))) {
      return ratio * 1.5;
    }
    return ratio;
  };

  const matches: Array<{ item: any; score: number }> = [];

  for (const it of allItems) {
    if (!it.dish_name) continue;

    const normItemKey = it.dish_name_key || normalizeDishKey(it.dish_name);
    const itemChainKey = (it.chain_key || it.chain_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (explicitChainKey && itemChainKey) {
      const expNorm = explicitChainKey.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!itemChainKey.includes(expNorm) && !expNorm.includes(itemChainKey)) {
        continue;
      }
    }

    const score = scoreDishMatch(normQ, normItemKey, itemChainKey);
    const threshold = (explicitChainKey || (itemChainKey && qLower.includes(itemChainKey.replace(/_/g, ' ')))) ? 0.45 : 0.75;

    if (score >= threshold) {
      matches.push({ item: it, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, 5).map(({ item: matchedItem }) => {
    const cleanIngredients = cleanDescriptionText(matchedItem.ingredients || matchedItem.description || '');
    const saltG = matchedItem.nutrients?.salt ?? (matchedItem.nutrients?.sodium ? matchedItem.nutrients.sodium / 400 : undefined);
    const sodiumMg = matchedItem.nutrients?.sodium ?? (saltG ? Math.round(saltG * 400) : undefined);
    const cals = matchedItem.nutrients?.calories ?? null;
    const protein = matchedItem.nutrients?.protein ?? null;
    const fat = matchedItem.nutrients?.totalFat ?? matchedItem.nutrients?.fat ?? null;
    const satFat = matchedItem.nutrients?.saturatedFat ?? null;
    const carbs = matchedItem.nutrients?.carbohydrates ?? matchedItem.nutrients?.carbs ?? null;
    const sugar = matchedItem.nutrients?.sugar ?? null;
    const fiber = matchedItem.nutrients?.totalFibre ?? matchedItem.nutrients?.fiber ?? null;

    return {
      id: `brand_menu_${matchedItem.id || matchedItem.dish_name_key || normalizeDishKey(matchedItem.dish_name)}`,
      source: 'brand_official',
      brandPriority: true,
      searchQuery: query,
      name: matchedItem.dish_name,
      chainName: matchedItem.chain_name || matchedItem.chain_key || 'Brand',
      servingGrams: matchedItem.serving_grams || (matchedItem.basis_type === 'per_100g' ? 100 : null),
      calories: cals != null ? String(cals) : undefined,
      protein: protein != null ? Number(protein) : undefined,
      fat: fat != null ? Number(fat) : undefined,
      saturatedFat: satFat != null ? Number(satFat) : undefined,
      sodium: sodiumMg != null ? Number(sodiumMg) : undefined,
      salt: saltG != null ? Number(saltG) : undefined,
      carbohydrates: carbs != null ? Number(carbs) : undefined,
      sugar: sugar != null ? Number(sugar) : undefined,
      totalFibre: fiber != null ? Number(fiber) : undefined,
      nutrients: matchedItem.nutrients || {
        calories: cals,
        protein,
        totalFat: fat,
        saturatedFat: satFat,
        carbohydrates: carbs,
        sugar,
        sodium: sodiumMg,
        salt: saltG,
        totalFibre: fiber
      },
      ingredients: cleanIngredients,
      basisType: matchedItem.basis_type || 'per_dish',
      sourceUrl: matchedItem.source_url || undefined,
      snippet: `${matchedItem.dish_name} (${matchedItem.chain_name || matchedItem.chain_key}): ${cleanIngredients}. Nutrition: ${cals} kcal, ${protein}g protein, ${carbs}g carbs (sugar ${sugar}g), ${fat}g fat, fiber ${fiber}g, salt ${saltG ?? '—'}g (sodium ${sodiumMg ?? '—'}mg)`
    };
  });
}


