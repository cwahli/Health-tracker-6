import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /setActiveDataReviewEstimatedTotalMarkers\(options\?.estimatedTotalMarkers !== undefined \? options\.estimatedTotalMarkers : null\);/,
  `setActiveDataReviewEstimatedTotalMarkers(options?.estimatedTotalMarkers !== undefined ? options.estimatedTotalMarkers : null);\n              setActiveReviewBiomarkerKey(options?.biomarkerKey);`
);

code = code.replace(
  /if \(options\?.prefillMessage\) \{\n\s+setPrefillMessage\(options.prefillMessage\);\n\s+\}/,
  `if (options?.prefillMessage) {\n                setPrefillMessage(options.prefillMessage);\n              }\n              setActiveReviewBiomarkerKey(options?.biomarkerKey);`
);

fs.writeFileSync('src/App.tsx', code);
