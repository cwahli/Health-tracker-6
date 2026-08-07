import fs from 'fs';
let code = fs.readFileSync('src/components/chat-cards/BiomarkerReviewCard.tsx', 'utf-8');

code = code.replace(
  /const DiffRow = \(\{ label, newVal \}: \{ label: string, newVal: string \}\) => \(/,
  `const DiffRow = ({ label, oldVal, newVal }: { label: string, oldVal?: string, newVal: string }) => (`
);

code = code.replace(
  /<span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-words">\{newVal\}<\/span>/,
  `
    <div className="flex flex-col gap-0.5 w-full">
      {oldVal && oldVal !== newVal && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through truncate">{oldVal}</span>
      )}
      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-words">{newVal}</span>
    </div>`
);

code = code.replace(
  /export const BiomarkerReviewCard: React\.FC<AgentCardProps> = \(\{ msg, onLogMedical \}\) => \{/,
  `import { biomarkerDefinitions } from '../../utils/biomarkers';
export const BiomarkerReviewCard: React.FC<AgentCardProps> = ({ msg, onLogMedical, profile }) => {
  const targetKey = msg.data?.targetBiomarkerKey || msg.data?.proposal?.name || '';
  const currentDef = profile?.customBiomarkers?.[targetKey] || biomarkerDefinitions.find(d => d.key === targetKey) || {};`
);

code = code.replace(
  /\{proposal\.name && <DiffRow label="Name" newVal=\{proposal\.name\} \/>\}/,
  `{proposal.name && <DiffRow label="Name" oldVal={currentDef.name} newVal={proposal.name} />}`
);
code = code.replace(
  /\{proposal\.metric && <DiffRow label="Unit" newVal=\{proposal\.metric\} \/>\}/,
  `{proposal.metric && <DiffRow label="Unit" oldVal={currentDef.unit} newVal={proposal.metric} />}`
);
code = code.replace(
  /\{proposal\.range && <DiffRow label="Range" newVal=\{proposal\.range\} \/>\}/,
  `{proposal.range && <DiffRow label="Range" oldVal={currentDef.normalRange} newVal={proposal.range} />}`
);
code = code.replace(
  /\{proposal\.description && <DiffRow label="Description" newVal=\{proposal\.description\} \/>\}/,
  `{proposal.description && <DiffRow label="Description" oldVal={currentDef.description || currentDef.descriptions?.en} newVal={proposal.description} />}`
);
code = code.replace(
  /\{proposal\.medicalInsight && <DiffRow label="Medical Insight" newVal=\{proposal\.medicalInsight\} \/>\}/,
  `{proposal.medicalInsight && <DiffRow label="Medical Insight" oldVal={(currentDef as any).specificRiskContext || currentDef.medicalInsight || ''} newVal={proposal.medicalInsight} />}`
);

fs.writeFileSync('src/components/chat-cards/BiomarkerReviewCard.tsx', code);
