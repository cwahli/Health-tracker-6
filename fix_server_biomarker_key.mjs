import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// First, add biomarkerKey to the destructuring
code = code.replace(
  /const \{ agentType, userProfile, history, message, engine, numberOfBatches, jsonStr, bucketMapping, batchBiomarkers \} = req\.body;/g,
  `const { agentType, userProfile, history, message, engine, numberOfBatches, jsonStr, bucketMapping, batchBiomarkers, biomarkerKey } = req.body;`
);

// Then, update the dataContext for biomarker_review
code = code.replace(
  /dataContext = customVariableData \? `\\n\\n\$\{customVariableData\}\\n` : `\\n\\nUSER PROFILE:\\n\$\{JSON\.stringify\(cleanProfile, null, 2\)\}\\n`;/g,
  `dataContext = customVariableData ? \`\\n\\n\${customVariableData}\\n\` : \`\\n\\nUSER PROFILE:\\n\${JSON.stringify(cleanProfile, null, 2)}\\n\`;
          if (agentType === "biomarker_review" && biomarkerKey) {
            dataContext += \`\\n\\nBIOMARKER TO REVIEW: \${biomarkerKey}\\n\`;
          }`
);

fs.writeFileSync('server.ts', code);
