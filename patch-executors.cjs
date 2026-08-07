const fs = require('fs');

function patchExecutor(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "images?: string[];",
    "images?: string[];\n  photoUrl?: string;"
  );
  content = content.replace(
    "const { jobId, text, images, mode, profile,",
    "const { jobId, photoUrl, text, images, mode, profile,"
  );
  content = content.replace(
    "Object.keys(bodyData).forEach(key => {",
    "if (photoUrl) bodyData.photoUrl = photoUrl;\n  Object.keys(bodyData).forEach(key => {"
  );
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patchExecutor('src/jobs/FoodAgentExecutor.ts');
patchExecutor('src/jobs/MedicalAgentExecutor.ts');
