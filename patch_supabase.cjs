const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf-8');
server = server.replace('const PORT = Number(process.env.PORT) || 3000;', 'const PORT = 3000;');
server = server.replace('const PORT = Number(process.env.PORT) || 8080;', 'const PORT = 3000;');
fs.writeFileSync('server.ts', server);

let supa = fs.readFileSync('src/utils/supabaseClient.ts', 'utf-8');
supa = supa.replace("import { getAuth } from 'firebase/auth';", "import { getAuth, getApp } from 'firebase/auth';");
supa = supa.replace(
  "const user = getAuth().currentUser;",
  "try { getApp(); } catch (e) { return null; }\n    const user = getAuth().currentUser;"
);
fs.writeFileSync('src/utils/supabaseClient.ts', supa);
