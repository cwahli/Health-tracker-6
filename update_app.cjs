const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const dynamicStylesEnd = `
  if (profile.themeOverrides && Array.isArray(profile.themeOverrides)) {
    profile.themeOverrides.forEach(override => {
      colorCss += \`
        \${override.selector} {
          \${override.property}: \${override.variable} !important;
        }
      \`;
    });
  }

  colorCss += \`
    }
  \`;
`;

code = code.replace(/  colorCss \+= \`\n    \}\n  \`;/s, dynamicStylesEnd);

fs.writeFileSync('src/App.tsx', code);
