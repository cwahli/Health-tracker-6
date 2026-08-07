import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

code = code.replace(
  /userProfile: lightProfile,\n\s*engine: selectedModelId\n\s*\};/g,
  `userProfile: lightProfile,
        engine: selectedModelId,
        biomarkerKey: reviewBiomarkerKey
      };`
);

code = code.replace(
  /userProfile: lightProfile\n\s*\};/g,
  `userProfile: lightProfile,
        biomarkerKey: reviewBiomarkerKey
      };`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
