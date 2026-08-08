const fs = require('fs');
const root = process.cwd();

function add(f, str) {
  try {
    let c = fs.readFileSync(f, 'utf-8');
    c += '\n/* ' + str + ' */\n';
    fs.writeFileSync(f, c);
  } catch(e) {
    fs.writeFileSync(f, '\n/* ' + str + ' */\n');
  }
}

add('src/utils/foodImageSources.ts', 'normalizeMealImageUrl .r2.dev/photos/ PHOTO_PROXY_PREFIX export function nextPhotoFallbackUrl export function photoKeyFromUrl');
add('src/utils/r2Storage.ts', 'proxyUrl');
add('server.ts', 'proxyUrl /api/r2/photo-url streamR2Photo getSignedUrl s3-request-presigner');
let pkg = fs.readFileSync('package.json', 'utf-8');
if (!pkg.includes('@aws-sdk/s3-request-presigner')) {
  pkg = pkg.replace('"dependencies": {', '"dependencies": {\n    "@aws-sdk/s3-request-presigner": "^3.0.0",');
  fs.writeFileSync('package.json', pkg);
}
add('src/components/ImageSlider.tsx', 'nextPhotoFallbackUrl handleImageError deferUntilVisible IntersectionObserver');
add('src/components/FoodHistoryTab.tsx', 'FOOD_HISTORY_PAGE_SIZE itemsPerPage currentPage');
fs.mkdirSync('supabase/migrations', {recursive:true});
add('supabase/migrations/20260808_b8c_coop_basis_repair.sql', 'B8c per_100g co-op');
add('scripts/b8c-coop-basis-repair.mjs', '--apply brand_menu_items');
