const fs = require('fs');
let code = fs.readFileSync('src/components/HealthPlanningResultView.tsx', 'utf8');

const priorityBadgeRegex = /\{item\.priority && \([\s\S]*?PRIORITY\n\s*?<\/span>\n\s*?\}\)/;
const priorityBadgeReplacement = `{item.priority && (
                            <span className={\`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border \${
                              item.priority.toLowerCase() === 'high'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : item.priority.toLowerCase() === 'low'
                                ? 'bg-slate-100 dark:bg-slate-800 text-theme-text-secondary border-theme-border'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }\`}>
                              {item.priority.toUpperCase()} PRIORITY
                            </span>
                          )}`;
                          
code = code.replace(priorityBadgeRegex, priorityBadgeReplacement);

// Gap badge:
const gapPriorityBadgeRegex = /\{item\.priority && \([\s\S]*?PRIORITY\n\s*?<\/span>\n\s*?\}\)/g;
// Wait, replacing globally using a regex could be tricky since it might match the first one we just replaced. Let's just do it again.
code = code.replace(/\{item\.priority && \([\s\S]*?PRIORITY\n\s*?<\/span>\n\s*?\}\)/g, priorityBadgeReplacement);

// Fix Calendar for retest
code = code.replace(/\{item\.retestTimeframe && \(/, "{(item.nextScheduledDate || item.retestTimeframe) && (");
code = code.replace(/\{safeStr\(item\.retestTimeframe\)\}/, "{safeStr(item.nextScheduledDate || item.retestTimeframe)}");

// Fix Calendar for gap
code = code.replace(/\{item\.timeframe && \(/, "{(item.nextScheduledDate || item.timeframe) && (");
code = code.replace(/\{safeStr\(item\.timeframe\)\}/, "{safeStr(item.nextScheduledDate || item.timeframe)}");

fs.writeFileSync('src/components/HealthPlanningResultView.tsx', code);
