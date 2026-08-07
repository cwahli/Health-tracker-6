const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/    let syncRootId = '';\n    const abortWithLocalFallback = async \(\) => {/, "    let syncRootId = '';\n    let tProfileId = '';\n    const abortWithLocalFallback = async () => {");
fs.writeFileSync('src/App.tsx', appCode);
