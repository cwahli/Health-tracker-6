const fs = require('fs');
let content = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');

if (!content.includes('import { auth }')) {
  content = content.replace("import { ImageStore } from './ImageStore';", "import { ImageStore } from './ImageStore';\nimport { auth } from '../firebase';");
}
content = content.replace("upsertJobToSupabase(updatedJob, 'anonymous'", "upsertJobToSupabase(updatedJob, auth.currentUser?.uid || 'anonymous'");

fs.writeFileSync('src/jobs/JobQueueRunner.ts', content);
