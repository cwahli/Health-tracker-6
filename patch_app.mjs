import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const replacement = `onReviewWithAgent={(keys) => {
              const userIdentifier = profile?.email?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'guest';
              localStorage.setItem(\`agent1_custom_batch_keys_\${userIdentifier}\`, JSON.stringify(keys));
              sessionStorage.setItem('auto_open_custom_batch_modal', 'true');
              setActiveTab('insights');
            }}
            onOpenAgentChat={(agentType, options) => {
              setActiveAgentType(agentType);
              setPrefillMessage(options?.prefillMessage || null);
              setActiveReviewBiomarkerKey(options?.biomarkerKey);
              if (options?.dataReviewBatchIdx !== undefined) setActiveDataReviewBatchIdx(options.dataReviewBatchIdx);
              if (options?.dataReviewBatchKeys) setActiveDataReviewBatchKeys(options.dataReviewBatchKeys);
              setIsMedicalChatOpen(true);
            }}`;

code = code.replace(
  /onReviewWithAgent=\{\(keys\) => \{\n\s*const userIdentifier = profile\?\.email\?\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, '_'\) \|\| 'guest';\n\s*localStorage\.setItem\(`agent1_custom_batch_keys_\$\{userIdentifier\}`,\s*JSON\.stringify\(keys\)\);\n\s*sessionStorage\.setItem\('auto_open_custom_batch_modal',\s*'true'\);\n\s*setActiveTab\('insights'\);\n\s*\}\}/,
  replacement
);

fs.writeFileSync('src/App.tsx', code);
