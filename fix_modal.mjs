import fs from 'fs';
let code = fs.readFileSync('src/components/ReviewBiomarkerModal.tsx', 'utf-8');

code = code.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/,
  `      </div>\n    </div>\n  );\n}`
);
fs.writeFileSync('src/components/ReviewBiomarkerModal.tsx', code);
