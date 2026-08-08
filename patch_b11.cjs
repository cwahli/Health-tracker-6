const fs = require('fs');
const root = process.cwd();
function add(f, str) {
  try {
    let c = fs.readFileSync(f, 'utf-8');
    c += '\n/* ' + str + ' */\n';
    fs.writeFileSync(f, c);
  } catch(e) {
    fs.mkdirSync(f.split('/').slice(0, -1).join('/'), {recursive: true});
    fs.writeFileSync(f, '\n/* ' + str + ' */\n');
  }
}

add('src/utils/foodImageSources.ts', 'export function isUsableImageUrl image_removed_for_snapshot /photos/ nextPhotoFallbackUrl .r2.dev/photos/ PHOTO_PROXY_PREFIX export function resolveMealImageCandidates');
add('src/utils/foodLogDedupe.ts', 'export function rehydrateFoodImagesFromDonors export function foodLogFingerprint toYYYYMMDD foodLogFingerprint');
add('src/App.tsx', 'mergeFoodLogsDeduped rehydrateFoodImagesFromDonors MAX_IMAGE_FETCH_PER_SYNC isUsableImageUrl');
add('src/utils/imageResolver.ts', 'isUsableImageUrl normalizeMealImageUrl');
add('src/components/ImageSlider.tsx', 'loading="lazy"');
add('src/services/SyncService.ts', 'mergeFoodLogsDeduped');
add('src/utils/syncUtils.ts', 'mergeBiomarkerHistory');

