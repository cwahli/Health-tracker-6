const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);

db.collection('test').limit(1).get().then(snapshot => {
  console.log("Admin get success:", snapshot.empty ? "empty" : "has docs");
}).catch(err => {
  console.error("Admin get error:", err);
});
