const fs = require('fs');

let content = fs.readFileSync('src/jobs/MedicalAgentExecutor.ts', 'utf8');

content = content.replace(
  "text: string;",
  "text: string;\n  images?: string[];\n  photoUrl?: string;"
);

content = content.replace(
  "jobId,\n    text,",
  "jobId,\n    text,\n    images,\n    photoUrl,"
);

content = content.replace(
  "const bodyData: any = {",
  "const bodyData: any = {\n    photoUrl: photoUrl,"
);

fs.writeFileSync('src/jobs/MedicalAgentExecutor.ts', content);
console.log('Patched MedicalAgentExecutor.ts');
