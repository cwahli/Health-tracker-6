import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
const app = initializeApp({});
const db1 = getFirestore(app, "mydb");
const db2 = initializeFirestore(app, { localCache: memoryLocalCache() }, "mydb");
