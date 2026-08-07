const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');

const target1 = `              <>
                <StepItem label="Reading your photos..." status={step1Status}>
                  {scoutInstruction && (
                    <div className="flex flex-col gap-1 mt-1 mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutInstruction}</span>
                      <ScratchpadMarkdownViewer content={scoutInstruction} />
                    </div>
                  )}
                  {scoutScratchpad && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutScratchpad}</span>
                      <ScratchpadMarkdownViewer content={scoutScratchpad} />
                    </div>
                  )}
                  {scoutAnswer && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutResult}</span>
                      <ScratchpadMarkdownViewer content={scoutAnswer} />
                    </div>
                  )}
                </StepItem>
                
                <StepItem label="Searching nutrition databases..." status={step2Status}>
                  {dbSearchLog && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.databaseLog}</span>
                      <ScratchpadMarkdownViewer content={dbSearchLog} />
                    </div>
                  )}
                </StepItem>
                
                <StepItem label="Checking your biomarker profile..." status={step3Status}>
                  {dietitianInstruction && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianInstruction}</span>
                      <ScratchpadMarkdownViewer content={dietitianInstruction} />
                    </div>
                  )}
                </StepItem>
                
                <StepItem label="Consulting the clinical AI model..." status={step4Status}>
                  {dietitianScratchpad && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianScratchpad}</span>
                      <ScratchpadMarkdownViewer content={dietitianScratchpad} />
                    </div>
                  )}
                  {dietitianAnswer && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianResult}</span>
                      <ScratchpadMarkdownViewer content={dietitianAnswer} />
                    </div>
                  )}
                </StepItem>
              </>`;

const replacement1 = `              <>
                {/* Render live streaming progress chunks cleanly without generic titles */}
                {scoutInstruction && (
                  <div className="flex flex-col gap-1 mt-1 mb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutInstruction}</span>
                    <ScratchpadMarkdownViewer content={scoutInstruction} />
                  </div>
                )}
                {scoutScratchpad && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutScratchpad}</span>
                    <ScratchpadMarkdownViewer content={scoutScratchpad} />
                  </div>
                )}
                {scoutAnswer && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.visionScoutResult}</span>
                    <ScratchpadMarkdownViewer content={scoutAnswer} />
                  </div>
                )}
                
                {dbSearchLog && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.databaseLog}</span>
                    <ScratchpadMarkdownViewer content={dbSearchLog} />
                  </div>
                )}
                
                {dietitianInstruction && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianInstruction}</span>
                    <ScratchpadMarkdownViewer content={dietitianInstruction} />
                  </div>
                )}
                
                {dietitianScratchpad && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianScratchpad}</span>
                    <ScratchpadMarkdownViewer content={dietitianScratchpad} />
                  </div>
                )}
                {dietitianAnswer && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianResult}</span>
                    <ScratchpadMarkdownViewer content={dietitianAnswer} />
                  </div>
                )}
              </>`;

const target2 = `              <>
                <StepItem label="Gathering your recent history..." status={step1Status} />
                <StepItem label="Checking your biomarker profile..." status={step2Status}>
                  {dietitianInstruction && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianInstruction}</span>
                      <ScratchpadMarkdownViewer content={dietitianInstruction} />
                    </div>
                  )}
                </StepItem>
                <StepItem label="Consulting the clinical AI model..." status={step3Status}>
                  {dietitianScratchpad && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianScratchpad}</span>
                      <ScratchpadMarkdownViewer content={dietitianScratchpad} />
                    </div>
                  )}
                  {dietitianAnswer && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianResult}</span>
                      <ScratchpadMarkdownViewer content={dietitianAnswer} />
                    </div>
                  )}
                </StepItem>
              </>`;

const replacement2 = `              <>
                {/* Render live streaming progress chunks cleanly without generic titles */}
                {dietitianInstruction && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianInstruction}</span>
                    <ScratchpadMarkdownViewer content={dietitianInstruction} />
                  </div>
                )}
                {dietitianScratchpad && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianScratchpad}</span>
                    <ScratchpadMarkdownViewer content={dietitianScratchpad} />
                  </div>
                )}
                {dietitianAnswer && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t.dietitianResult}</span>
                    <ScratchpadMarkdownViewer content={dietitianAnswer} />
                  </div>
                )}
              </>`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
fs.writeFileSync('src/components/chat-cards/FoodCard.tsx', code);
