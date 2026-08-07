const fs = require('fs');
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
const searchStr = `      const status = getBiomarkerStatus(key, val, normalRange, customDef || def, profile);
      if (status === 'high' || status === 'low' || status === 'critical') {
        list.push({
          key,
          name,
          value: val,
          status,
          normalRange,
          unit
        });
      }`;
const replaceStr = `      const status = getBiomarkerStatus(key, val, normalRange, customDef || def, profile);
      
      let isPlausible = true;
      const rangeMatch = normalRange.match(/([\\d.]+)\\s*-\\s*([\\d.]+)/);
      if (rangeMatch && typeof val === 'number') {
        const rMin = parseFloat(rangeMatch[1]);
        const rMax = parseFloat(rangeMatch[2]);
        if (rMin > 50 && val < rMin * 0.5) isPlausible = false; // Prevents 30 mmol/L for Sodium (min 135)
        if (val < rMin * 0.1 || val > rMax * 20) isPlausible = false;
      }

      if ((status === 'high' || status === 'low' || status === 'critical') && isPlausible) {
        list.push({
          key,
          name,
          value: val,
          status,
          normalRange,
          unit
        });
      }`;

if (code.includes(searchStr)) {
  fs.writeFileSync('src/components/LogChat.tsx', code.replace(searchStr, replaceStr));
  console.log('Biomarker validation logic injected.');
} else {
  console.log('Search string not found in src/components/LogChat.tsx');
}
