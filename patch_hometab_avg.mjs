import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

const targetStr = `<span className="text-theme-neutral">{label}</span>`;
const replacementStr = `<span className="text-theme-neutral flex items-center gap-1">
                    {label}
                    {showAverageInBar && getAverageIntake(key, rollingDays) > 0 && (
                      <span className="text-[10px] text-amber-550 dark:text-amber-400 font-normal">
                        ({rollingDays}d avg: {formatValue(getAverageIntake(key, rollingDays))}{unit})
                      </span>
                    )}
                  </span>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/HomeTab.tsx', code);
