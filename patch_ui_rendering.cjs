const fs = require('fs');
let code = fs.readFileSync('src/components/HealthPlanningResultView.tsx', 'utf8');

const handleAcceptRegex = /\/\/ 1\. Process selected retests[\s\S]*?createdAt: timestamp\n        \}\);\n      \}\n    \}\);/;
const handleAcceptReplacement = `// 1. Process selected retests
    retestList.forEach((item, idx) => {
      if (selectedRetests[idx]) {
        const valStr = item.currentValue !== undefined && item.currentValue !== null && item.currentValue !== '' 
          ? \` (Current: \${item.currentValue}\${item.unit ? ' ' + item.unit : ''})\` 
          : '';
        const recTestName = item.recommendedTestName || (item.name ? \`\${item.name} Panel\` : 'Clinical Test');
        const tf = item.nextScheduledDate || item.retestTimeframe || '3-6 months';
        const itemPrio = item.priority || (item.isProvisional ? 'high' : 'medium');
        
        let explanationText = '';
        if (item.userBenefit || item.gpClinicalJustification) {
          explanationText = \`\${item.userBenefit ? item.userBenefit : ''}\${item.gpClinicalJustification ? ' [Clinical: ' + item.gpClinicalJustification + ']' : ''}\`;
        } else {
          const prioReasonText = item.priorityReason ? \` [Priority Reason: \${item.priorityReason}]\` : '';
          explanationText = \`\${item.reason || 'Repeat test to verify baseline accuracy and eliminate acute confounding variables.'}\${prioReasonText}\`;
        }
        
        acceptedActions.push({
          id: \`action_retest_\${timestamp}_\${idx}\`,
          task: \`Retest \${item.name}\`,
          explanation: \`\${explanationText}\${item.isProvisional ? ' [Provisional reading pending confirmation]' : ''}\${valStr}\`,
          priority: itemPrio.toLowerCase(),
          completed: false,
          type: 'test',
          testName: recTestName,
          timeframe: tf,
          createdAt: timestamp
        });
      }
    });

    // 2. Process selected testing gaps
    gapList.forEach((item, idx) => {
      if (selectedGaps[idx]) {
        const catLabel = item.category === 'long_term' ? 'Long-Term Gap' : 'Short-Term Gap';
        const tf = item.nextScheduledDate || item.timeframe || '3-6 months';
        const itemPrio = item.priority || (item.category === 'short_term' ? 'high' : 'medium');
        
        let explanationText = '';
        if (item.userBenefit || item.gpClinicalJustification) {
          explanationText = \`[\${item.targetCondition || catLabel}] \${item.userBenefit ? item.userBenefit : ''}\${item.gpClinicalJustification ? ' [Clinical: ' + item.gpClinicalJustification + ']' : ''}\`;
        } else {
          const prioReasonText = item.priorityReason ? \` [Priority Reason: \${item.priorityReason}]\` : '';
          explanationText = \`[\${item.targetCondition || catLabel}] \${item.reason || 'Diagnostic gap identified to uncover potential health risks.'}\${prioReasonText}\`;
        }
        
        acceptedActions.push({
          id: \`action_gap_\${timestamp}_\${idx}\`,
          task: \`Perform Diagnostic Test: \${item.testName}\`,
          explanation: explanationText,
          priority: itemPrio.toLowerCase(),
          completed: false,
          type: 'test',
          testName: item.testName,
          timeframe: tf,
          createdAt: timestamp
        });
      }
    });`;

code = code.replace(/\/\/ 1\. Process selected retests[\s\S]*?createdAt: timestamp\n        \}\);\n      \}\n    \}\);/g, handleAcceptReplacement);

fs.writeFileSync('src/components/HealthPlanningResultView.tsx', code);
