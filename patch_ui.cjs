const fs = require('fs');
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf8');

const target = `                    {msg.agentUnavailable && (
                      <div className="mt-3 flex flex-col gap-3">
                        {msg.data?.scoutItems && msg.data.scoutItems.length > 0 && (
                          <div className="mb-2">
                            <NutritionLabelTable activeScoutItems={msg.data.scoutItems} />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">`;

const repl = `                    {msg.agentUnavailable && (
                      <div className="mt-3 flex flex-col gap-3">
                        {msg.data?.scoutItems && msg.data.scoutItems.length > 0 && (
                          <div className="mb-2">
                            <NutritionLabelTable activeScoutItems={msg.data.scoutItems} />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="text-xs text-slate-500 font-medium">Select model for retry:</div>
                          <LLMSelector
                            selectedModelId={selectedModelId}
                            variant="inline"
                            onChangeModelId={(id) => {
                              onChangeModelId(id);
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">`;

code = code.replace(target, repl);
fs.writeFileSync('src/components/LogChat.tsx', code);
console.log("Done UI");
