const fs = require('fs');

let supa = fs.readFileSync('src/utils/supabaseClient.ts', 'utf-8');
supa = supa.replace(/typeof import\.meta !== 'undefined' && import\.meta\.env\?\.VITE_SUPABASE_URL/g, "typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined");
supa = supa.replace(/typeof import\.meta !== 'undefined' && import\.meta\.env\?\.VITE_SUPABASE_ANON_KEY/g, "typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined");
fs.writeFileSync('src/utils/supabaseClient.ts', supa);
