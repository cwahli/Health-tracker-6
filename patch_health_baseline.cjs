const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/HealthBaselineCard.tsx', 'utf8');

// 1. Move timelineToOptimal
code = code.replace(
  /\{timelineToOptimal && \([\s\S]*?\}\)/g, 
  ''
);

const headerTarget = `<div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {agentConfig?.displayName || t.healthCoach}
            </h2>
          </div>`;
          
const headerReplacement = `${headerTarget}
          
          {timelineToOptimal && (
            <div className="py-4 space-y-3">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-4 h-4" />
                <span>{t.timelineToOptimal}</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{timelineToOptimal}</p>
            </div>
          )}`;

code = code.replace(headerTarget, headerReplacement);

// 2. Remove Global Action Plan
const globalActionRegex = /<div className="space-y-2">\s*<h3 className="text-base font-semibold text-theme-text">\{t\.globalActionPlan\}<\/h3>[\s\S]*?\}\)\(\)\}\s*<\/div>/;
code = code.replace(globalActionRegex, '');

fs.writeFileSync('src/components/chat-cards/HealthBaselineCard.tsx', code);
