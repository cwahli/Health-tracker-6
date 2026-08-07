import fs from 'fs';
let code = fs.readFileSync('src/components/ReviewBiomarkerModal.tsx', 'utf-8');

const importStatement = `import { auth, db } from '../firebase';\nimport { doc, setDoc } from 'firebase/firestore';\nimport { trackApiCall, setActiveQueryId, generateQueryId } from '../utils/apiTracker';`;
code = code.replace(`import { trackApiCall, setActiveQueryId, generateQueryId } from '../utils/apiTracker';`, importStatement);

const saveLogic = `
      setMessages(prev => {
        const newMsgs = [...prev, assistantMsg];
        const uid = auth.currentUser?.uid || 'guest';
        if (uid !== 'guest') {
          const docRef = doc(db, 'users', uid, 'conversations', 'review_' + biomarkerKey);
          setDoc(docRef, {
            id: 'review_' + biomarkerKey,
            userId: uid,
            type: 'medical',
            agentType: 'biomarker_review',
            title: \`Review - \${def.name}\`,
            createdAt: newMsgs[0]?.timestamp || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: newMsgs,
          }, { merge: true }).catch(console.error);
        }
        return newMsgs;
      });
`;

code = code.replace(/setMessages\(prev => \[\.\.\.prev, assistantMsg\]\);/g, saveLogic);

fs.writeFileSync('src/components/ReviewBiomarkerModal.tsx', code);
