/**
 * Gate: B11 — image sync, preserve originals, dedupe, lazy fetch cap.
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
  const full = path.join(root, p);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : '';
};

const sources = read('src/utils/foodImageSources.ts');
const dedupe = read('src/utils/foodLogDedupe.ts');
const app = read('src/App.tsx');
const resolver = read('src/utils/imageResolver.ts');
const slider = read('src/components/ImageSlider.tsx');
const syncSvc = read('src/services/SyncService.ts');
const syncUtils = read('src/utils/syncUtils.ts');

check(
  'I1 isUsableImageUrl rejects placeholders + /photos proxy',
  sources.includes('export function isUsableImageUrl') &&
    sources.includes('image_removed_for_snapshot') &&
    sources.includes('/photos/')
);

check(
  'I1b B11d r2.dev → proxy + fallback helpers',
  sources.includes('nextPhotoFallbackUrl') &&
    sources.includes('.r2.dev/photos/') &&
    sources.includes('PHOTO_PROXY_PREFIX')
);

check(
  'I2 resolveMealImageCandidates + rehydrateFoodImagesFromDonors',
  sources.includes('export function resolveMealImageCandidates') &&
    dedupe.includes('export function rehydrateFoodImagesFromDonors') &&
    dedupe.includes('export function foodLogFingerprint')
);

check(
  'I3 fingerprint uses toYYYYMMDD',
  dedupe.includes('toYYYYMMDD') && dedupe.includes('foodLogFingerprint')
);

check(
  'I4 App uses mergeFoodLogsDeduped + rehydrate + fetch cap',
  app.includes('mergeFoodLogsDeduped') &&
    app.includes('rehydrateFoodImagesFromDonors') &&
    app.includes('MAX_IMAGE_FETCH_PER_SYNC') &&
    app.includes('isUsableImageUrl')
);

check(
  'I5 imageResolver uses isUsableImageUrl / normalizeMealImageUrl',
  resolver.includes('isUsableImageUrl') && resolver.includes('normalizeMealImageUrl')
);

check(
  'I6 ImageSlider loading=lazy + SyncService dedupes',
  slider.includes('loading="lazy"') &&
    syncSvc.includes('mergeFoodLogsDeduped') &&
    syncUtils.includes('mergeBiomarkerHistory')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
