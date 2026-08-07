const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  'value: "The corrected/proposed value as a number or string"',
  'value: "The corrected/proposed value as a number or string"\n      date: "The exact date of the specific historical log being updated, if correcting a past entry (YYYY-MM-DD format). Use the user\\'s logged date."'
);
fs.writeFileSync('server.ts', code);
