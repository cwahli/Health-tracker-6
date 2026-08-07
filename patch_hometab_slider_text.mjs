import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

const targetStr = `Uses the last {rollingDays - 1} logged days to calibrate today's target.`;
const replacementStr = `Uses the last {rollingDays - 1} logged days to calibrate today's target and sets the timeframe for the average indicator.`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/HomeTab.tsx', code);
