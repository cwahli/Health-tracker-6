const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/    const abortWithLocalFallback = async \(\) => {/, "    let syncRootId = '';\n    let tProfileId = '';\n    const abortWithLocalFallback = async () => {");
appCode = appCode.replace(/    const syncRootId = logInteraction\('sync'/g, "    syncRootId = logInteraction('sync'");
appCode = appCode.replace(/    let tProfileId = '';\n/g, "");

fs.writeFileSync('src/App.tsx', appCode);
