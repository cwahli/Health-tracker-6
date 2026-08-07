import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

code = code.replace(
  /if \(parsed\) \{/,
  `if (parsed) {\n              parsed.targetBiomarkerKey = reviewBiomarkerKey;`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
