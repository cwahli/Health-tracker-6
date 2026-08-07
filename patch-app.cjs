const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "images: stagedImages,",
  "images: stagedImages,\n            photoUrl: job.photoUrl,"
);
content = content.replace(
  "images: stagedImages,",
  "images: stagedImages,\n            photoUrl: job.photoUrl,"
); // in case there's a second one for medical

fs.writeFileSync('src/App.tsx', content);
console.log('Patched App.tsx');
