const fs = require('fs');

function addJobId(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "const bodyData: any = {",
    "const bodyData: any = {\n    jobId,"
  );
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

addJobId('src/jobs/FoodAgentExecutor.ts');
addJobId('src/jobs/MedicalAgentExecutor.ts');
