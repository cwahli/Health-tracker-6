const fs = require('fs');

let supa = fs.readFileSync('src/utils/supabaseClient.ts', 'utf-8');
supa = supa.replace("import { getAuth, getApp } from 'firebase/auth';", "import { getAuth } from 'firebase/auth';\nimport { getApp } from 'firebase/app';");
fs.writeFileSync('src/utils/supabaseClient.ts', supa);
