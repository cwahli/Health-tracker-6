/**
 * B8c — Print / optionally apply Co-op + grocery basis_type repair via Supabase.
 *
 * Usage:
 *   node scripts/b8c-coop-basis-repair.mjs           # dry-run SELECT only
 *   node scripts/b8c-coop-basis-repair.mjs --apply   # run UPDATEs
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (or .env).
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
/** Project URL only — strip /rest/v1, /v1, trailing slash (common .env mistake). */
function normalizeSupabaseUrl(raw) {
  let u = String(raw || '').trim();
  u = u.replace(/\/rest\/v1\/?$/i, '').replace(/\/v1\/?$/i, '').replace(/\/+$/, '');
  return u;
}
const url = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — cannot run.');
  console.error('SQL file still available: supabase/migrations/20260808_b8c_coop_basis_repair.sql');
  process.exit(1);
}

const supabase = createClient(url, key);

async function preview() {
  const { data, error } = await supabase
    .from('brand_menu_items')
    .select('id, chain_key, dish_name, basis_type, serving_grams, notes')
    .or('chain_key.ilike.%co-op%,chain_key.ilike.%coop%,chain_key.ilike.%co_op%')
    .in('basis_type', ['per_dish', 'total', ''])
    .limit(100);
  if (error) {
    console.error('Preview error:', error.message);
    return [];
  }
  return data || [];
}

async function applyRepair() {
  // Fetch candidates then patch one-by-one (PostgREST has limited regex filters)
  const { data, error } = await supabase
    .from('brand_menu_items')
    .select('id, chain_key, dish_name, basis_type, serving_grams, notes')
    .or(
      [
        'chain_key.ilike.%co-op%',
        'chain_key.ilike.%coop%',
        'chain_key.ilike.%sainsbury%',
        'chain_key.ilike.%tesco%',
        'chain_key.ilike.%asda%',
        'chain_key.ilike.%aldi%',
        'chain_key.ilike.%lidl%',
      ].join(',')
    )
    .in('basis_type', ['per_dish', 'total'])
    .limit(500);

  if (error) throw new Error(error.message);
  const rows = data || [];
  let fixed = 0;
  for (const row of rows) {
    // brand_menu_items has serving_grams + notes (no serving_size column)
    const notes = String(row.notes || '');
    const grams = Number(row.serving_grams);
    const looks100 =
      grams === 100 ||
      Number.isNaN(grams) ||
      /100\s*g/i.test(notes) ||
      /per\s*100/i.test(notes);
    const isCoop = /co[-_]?op|coop/i.test(String(row.chain_key || ''));
    if (!looks100 && !isCoop) continue;
    // Skip large restaurant-style servings for non-100g Co-op rows
    if (!looks100 && isCoop && grams && grams !== 100 && grams > 150) continue;

    const { error: uErr } = await supabase
      .from('brand_menu_items')
      .update({
        basis_type: 'per_100g',
        serving_grams: looks100 || isCoop ? 100 : row.serving_grams || 100,
        notes: notes.includes('[B8c]')
          ? notes
          : `${notes}${notes ? '\n' : ''}[B8c] repaired basis_type → per_100g`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (!uErr) {
      fixed++;
      console.log(`FIXED ${row.chain_key} / ${row.dish_name} (${row.id})`);
    } else {
      console.warn(`FAIL ${row.id}: ${uErr.message}`);
    }
  }
  return fixed;
}

const rows = await preview();
console.log(`Preview Co-op-like per_dish/total rows: ${rows.length}`);
rows.slice(0, 20).forEach((r) => {
  console.log(`  - ${r.chain_key} | ${r.dish_name} | basis=${r.basis_type} g=${r.serving_grams}`);
});

if (!apply) {
  console.log('\nDry-run only. Re-run with --apply to update.');
  console.log('Or run SQL: supabase/migrations/20260808_b8c_coop_basis_repair.sql');
  process.exit(0);
}

const n = await applyRepair();
console.log(`\nApplied repairs: ${n}`);
process.exit(0);

/* --apply brand_menu_items */
