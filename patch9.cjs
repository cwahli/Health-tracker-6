const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf-8');

code = code.replace(
  '<BugSnapshotFab',
  '<BugSnapshotFab id="bug-snapshot-fab"'
);

fs.writeFileSync('src/components/Header.tsx', code);
