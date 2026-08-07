import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

code = code.replace(
  /agentType\?: string \| null;/,
  `agentType?: string | null;
  biomarkerKey?: string;`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
