import fs from 'fs';
let code = fs.readFileSync('src/components/chat-cards/BiomarkerReviewCard.tsx', 'utf-8');

code = code.replace(
  /export const BiomarkerReviewCard: React\.FC<AgentCardProps> = \(\{ msg, onLogMedical, profile \}\) => \{/,
  `export const BiomarkerReviewCard: React.FC<AgentCardProps> = ({ msg, onLogMedical, profile, biomarkerHistory }) => {`
);

code = code.replace(
  /\{mods\.map\(\(mod: any, i: number\) => \([\s\S]*?<\/div>\n\s*\)\)}/,
  `{mods.map((mod: any, i: number) => {
            let oldValStr = '';
            if (biomarkerHistory) {
              const oldLog = biomarkerHistory.find(h => h.date === mod.date);
              if (oldLog && oldLog.biomarkers && oldLog.biomarkers[mod.keyName]) {
                oldValStr = String(oldLog.biomarkers[mod.keyName]);
              }
            }
            return (
            <div key={i} className="flex flex-col gap-1 text-xs mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                [{mod.date}] {mod.action === 'remove_biomarker' ? 'Remove Entry' : 'Update Value'}
              </span>
              {mod.newValue && (
                <div className="flex flex-col text-indigo-600 dark:text-indigo-400 font-bold">
                  {oldValStr && oldValStr !== String(mod.newValue) && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through truncate">{oldValStr}</span>
                  )}
                  <span>{mod.newValue}</span>
                </div>
              )}
            </div>
          )})} `
);

fs.writeFileSync('src/components/chat-cards/BiomarkerReviewCard.tsx', code);
