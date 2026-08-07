import fs from 'fs';

// Fix App.tsx biomarkerKey
let aCode = fs.readFileSync('src/App.tsx', 'utf-8');
aCode = aCode.replace(/biomarkerKey: [^,]+,/g, '');
fs.writeFileSync('src/App.tsx', aCode);

// Fix HomeTab ReviewBiomarkerModal
let hCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
hCode = hCode.replace(/<ReviewBiomarkerModal[\s\S]*?\/>/g, '');
hCode = hCode.replace(/\{reviewingBiomarkerKey[\s\S]*?\}\)\}\n\s*<\/div>\n\s*<\/div>/g, '</div>\n      </div>');
fs.writeFileSync('src/components/HomeTab.tsx', hCode);

// Fix MedicalHistoryTab
let mCode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mCode = mCode.replace(/onOpenAiReview=\{[^}]+\}/g, '');
mCode = mCode.replace(/onCombineBiomarker=\{[^}]+\}/g, '');
mCode = mCode.replace(/<BiomarkerExpandedSection/g, '<BiomarkerExpandedSection onOpenAiReview={() => {}} onCombineBiomarker={() => {}}');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mCode);

