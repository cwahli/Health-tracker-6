const fs = require('fs');
let content = fs.readFileSync('server_vision_scout.ts', 'utf8');
content = content.replace("component's \`searchQuery\`", "component's 'searchQuery'");
fs.writeFileSync('server_vision_scout.ts', content);
console.log("Done");
