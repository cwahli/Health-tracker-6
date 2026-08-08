const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const target = "import BugTrackerModal from './BugTrackerModal';";
const repl = "import BugTrackerModal from './BugTrackerModal';\nimport BugSnapshotFab from './BugSnapshotFab';";
code = code.replace(target, repl);
fs.writeFileSync('src/components/Header.tsx', code);
