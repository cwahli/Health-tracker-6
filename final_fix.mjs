import fs from 'fs';
let hcode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

hcode = hcode.replace(
  /const todayStr = getCurrentDateInTimezone\(profile\.timezone\);/,
  `const todayStr = getCurrentDateInTimezone(profile.timezone);

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
  }, [todayStr, activeFoodLogs]);`
);

fs.writeFileSync('src/components/HomeTab.tsx', hcode);

let mcode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
// find the onOpenAiReview={setReviewingBiomarkerKey} and remove it
mcode = mcode.replace(/onOpenAiReview=\{setReviewingBiomarkerKey\}\n/g, '');
mcode = mcode.replace(/onCombineBiomarker=\{setCombineBiomarkerKey\}\n/g, '');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mcode);
