import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

// 1. Add showAverageInBar state
code = code.replace(
  /const \[rollingEnabled, setRollingEnabled\] = React\.useState<boolean>\(\(\) => \{/,
  `const [showAverageInBar, setShowAverageInBar] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('showAverageInBar');
    return saved !== null ? saved === 'true' : false;
  });

  React.useEffect(() => {
    localStorage.setItem('showAverageInBar', String(showAverageInBar));
  }, [showAverageInBar]);

  const getAverageIntake = React.useCallback((key: string, numDays: number) => {
    let totalIntake = 0;
    for (let d = 0; d < numDays; d++) {
      const parts = todayStr.split('-');
      const todayDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const targetDate = new Date(todayDate);
      targetDate.setDate(todayDate.getDate() - d);
      
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = \`\${yyyy}-\${mm}-\${dd}\`;
      
      const dayFoods = activeFoodLogs.filter(f => f.date === targetDateStr);
      const dayTotal = dayFoods.reduce((acc, curr) => {
        return acc + (Number(curr.nutrients?.[key]) || 0);
      }, 0);
      totalIntake += dayTotal;
    }
    return numDays > 0 ? totalIntake / numDays : 0;
  }, [todayStr, activeFoodLogs]);

  const [rollingEnabled, setRollingEnabled] = React.useState<boolean>(() => {`
);

// 2. Add the checkbox inside Target Budget Settings
code = code.replace(
  /\{\/\* Toggle \*\/\}/,
  `{/* Toggle Average Indicator */}
              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show {rollingDays}-Day Average</span>
                  <p className="text-[10px] text-slate-400">Display average indicator in top nutrient bars</p>
                </div>
                <button
                  onClick={() => setShowAverageInBar(!showAverageInBar)}
                  className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer \${
                    showAverageInBar ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                  }\`}
                >
                  <span
                    className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                      showAverageInBar ? 'translate-x-6' : 'translate-x-1'
                    }\`}
                  />
                </button>
              </div>
              
              {/* Toggle */}`
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
