/**
 * Gate: B11d R2 photo proxy/signed + B13 lazy page + B8c Co-op repair artifacts
 */
import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) {
    console.log(`PASS: ${desc}`);
    pass++;
  } else {
    console.error(`FAIL: ${desc}`);
    fail++;
  }
}

const root = process.cwd();
const read = (p) => {
  const f = path.join(root, p);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf-8') : '';
};

const sources = read('src/utils/foodImageSources.ts');
const r2 = read('src/utils/r2Storage.ts');
const server = read('server.ts');
const slider = read('src/components/ImageSlider.tsx');
const hist = read('src/components/FoodHistoryTab.tsx');
const sql = read('supabase/migrations/20260808_b8c_coop_basis_repair.sql');
const repair = read('scripts/b8c-coop-basis-repair.mjs');
const pkg = read('package.json');

// B11d
check(
  'B11d normalize rewrites r2.dev → /photos/',
  sources.includes('normalizeMealImageUrl') &&
    sources.includes('.r2.dev/photos/') &&
    sources.includes('PHOTO_PROXY_PREFIX')
);
check(
  'B11d nextPhotoFallbackUrl + photoKeyFromUrl',
  sources.includes('export function nextPhotoFallbackUrl') &&
    sources.includes('export function photoKeyFromUrl')
);
check(
  'B11d upload returns proxyUrl',
  server.includes('proxyUrl') &&
    r2.includes('proxyUrl') &&
    server.includes('/api/r2/photo-url')
);
check(
  'B11d photo stream + signed optional',
  server.includes('streamR2Photo') &&
    (server.includes('getSignedUrl') || server.includes('s3-request-presigner')) &&
    pkg.includes('@aws-sdk/s3-request-presigner')
);
check(
  'B11d ImageSlider error fallback',
  slider.includes('nextPhotoFallbackUrl') && slider.includes('handleImageError')
);

// B13
check(
  'B13 FOOD_HISTORY_PAGE_SIZE + page slice',
  hist.includes('FOOD_HISTORY_PAGE_SIZE') &&
    hist.includes('itemsPerPage') &&
    hist.includes('currentPage')
);
check(
  'B13 ImageSlider deferUntilVisible / IntersectionObserver',
  slider.includes('deferUntilVisible') && slider.includes('IntersectionObserver')
);

// B8c
check(
  'B8c SQL migration Co-op per_100g',
  sql.includes('B8c') && sql.includes('per_100g') && sql.includes('co-op')
);
check(
  'B8c repair script dry-run/--apply',
  repair.includes('--apply') && repair.includes('brand_menu_items')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
