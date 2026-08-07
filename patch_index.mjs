import fs from 'fs';
let code = fs.readFileSync('src/components/chat-cards/index.ts', 'utf-8');

code = code.replace(
  /import \{ HealthBaselineCard \} from '\.\/HealthBaselineCard';/,
  `import { HealthBaselineCard } from './HealthBaselineCard';\nimport { BiomarkerReviewCard } from './BiomarkerReviewCard';`
);

code = code.replace(
  /export const agentCardRegistry: Record<string, React\.FC<any>> = \{/,
  `export * from './BiomarkerReviewCard';\n\nexport const agentCardRegistry: Record<string, React.FC<any>> = {`
);

code = code.replace(
  /welcome: WelcomeCard/,
  `welcome: WelcomeCard,\n  biomarker_review: BiomarkerReviewCard`
);

fs.writeFileSync('src/components/chat-cards/index.ts', code);
