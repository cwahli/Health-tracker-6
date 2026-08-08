const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const target = "import BugSnapshotFab from './BugSnapshotFab';";
const repl = "import BugSnapshotFab, { BugSnapshotSettingsToggle } from './BugSnapshotFab';";
code = code.replace(target, repl);

const target2 = "{/* Undo & Snapshots Control inside Settings */}";
const repl2 = "{/* Undo & Snapshots Control inside Settings */}\n              <BugSnapshotSettingsToggle />";
code = code.replace(target2, repl2);

fs.writeFileSync('src/components/Header.tsx', code);
