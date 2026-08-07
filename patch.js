const fs = require('fs');
let content = fs.readFileSync('server_vision_scout.ts', 'utf8');

content = content.replace(/- AMBIGUITY & COMPLETENESS: Extract EVERYTHING, including blurred items or unknown liquids \(use generic names like 'unknown beverage' and 'Low' cBRANCH B/g, "- AMBIGUITY & COMPLETENESS: Extract EVERYTHING, including blurred items or unknown liquids (use generic names like 'unknown beverage' and 'Low' confidence).\n\nBRANCH B");
content = content.replace(/=== SYSTEM CONSTRAINTS ===EM CONSTRAINTS ===/g, "=== SYSTEM CONSTRAINTS ===");
content = content.replace(/"Top Row"\)\.\nSTEP 3/g, '"Top Row").\n\nSTEP 3');

fs.writeFileSync('server_vision_scout.ts', content);
