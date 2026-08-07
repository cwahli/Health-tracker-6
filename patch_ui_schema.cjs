const fs = require('fs');
let code = fs.readFileSync('src/components/HealthPlanningResultView.tsx', 'utf8');

code = code.replace(
  /export interface RetestBiomarkerItem \{[\s\S]*?reason\?: string;\n\}/,
  "export interface RetestBiomarkerItem {\n  key?: string;\n  name: string;\n  currentValue?: string | number;\n  unit?: string;\n  retestTimeframe?: string;\n  recommendedTestName?: string;\n  isProvisional?: boolean;\n  priority?: 'high' | 'medium' | 'low' | 'High' | 'Medium' | 'Low';\n  priorityReason?: string;\n  reason?: string;\n  lastTestedDate?: string;\n  nextScheduledDate?: string;\n  userBenefit?: string;\n  gpClinicalJustification?: string;\n}"
);

code = code.replace(
  /export interface TestingGapItem \{[\s\S]*?targetCondition\?: string;\n\}/,
  "export interface TestingGapItem {\n  testName: string;\n  category?: 'short_term' | 'long_term';\n  timeframe?: string;\n  priority?: 'high' | 'medium' | 'low' | 'High' | 'Medium' | 'Low';\n  priorityReason?: string;\n  reason?: string;\n  targetCondition?: string;\n  nextScheduledDate?: string;\n  userBenefit?: string;\n  gpClinicalJustification?: string;\n}"
);

fs.writeFileSync('src/components/HealthPlanningResultView.tsx', code);
