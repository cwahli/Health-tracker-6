import 'dotenv/config';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// 1. Load Firebase and R2 Configurations
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err: any) {
    console.error('Error parsing firebase-applet-config.json:', err.message);
  }
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd17eecca64f82625d29dc38b14f46c14';
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'health-tracker-photos';
const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d17eecca64f82625d29dc38b14f46c14.r2.dev').replace(/\/$/, '');
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';

console.log('=== Firestore Migration Env Diagnostic ===');
console.log('Firebase Project ID:', firebaseConfig?.projectId || 'Missing');
console.log('Firestore Database ID:', firebaseConfig?.firestoreDatabaseId || '(default)');
console.log('CLOUDFLARE_ACCOUNT_ID:', CLOUDFLARE_ACCOUNT_ID);
console.log('CLOUDFLARE_R2_BUCKET_NAME:', CLOUDFLARE_R2_BUCKET_NAME);
console.log('CLOUDFLARE_R2_PUBLIC_URL:', CLOUDFLARE_R2_PUBLIC_URL);
console.log('CLOUDFLARE_R2_ACCESS_KEY_ID:', CLOUDFLARE_R2_ACCESS_KEY_ID ? 'Present' : 'Missing');
console.log('CLOUDFLARE_R2_SECRET_ACCESS_KEY:', CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Present' : 'Missing');
console.log('==========================================');

// 2. Initialize Clients
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig?.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT
  });
}

// Support custom database instances if provided
const db = getFirestore(firebaseConfig?.firestoreDatabaseId ? firebaseConfig.firestoreDatabaseId : undefined);

let s3Client: S3Client | null = null;
if (CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn('Warning: Cloudflare R2 credentials are missing or incomplete. S3Client cannot be initialized.');
}

async function uploadBase64ToR2(id: string, base64Data: string, index: number = 0): Promise<string> {
  const safeId = String(id || 'unknown').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  const suffix = index > 0 ? `_${index}` : '';
  const objectKey = `photos/${safeId}${suffix}.jpg`;
  const publicUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${objectKey}`;

  if (!s3Client) {
    console.warn(`[R2 Upload] No S3Client available for ID ${id}, index ${index}. Skipping upload.`);
    return publicUrl;
  }

  try {
    let body: Buffer;
    let contentType = 'image/jpeg';

    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        body = Buffer.from(match[2], 'base64');
      } else {
        body = Buffer.from(base64Data);
      }
    } else {
      body = Buffer.from(base64Data, 'base64');
    }

    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    console.log(`[R2 Upload] Successfully uploaded photo for ID ${id}, key: ${objectKey}`);
    return publicUrl;
  } catch (err) {
    console.error(`[R2 Upload] Failed uploading photo for ID ${id}:`, err);
    throw err;
  }
}

async function runMigration() {
  console.log('\n--- Starting Firestore to Cloudflare R2 Image Migration ---');

  let foodImagesSnap;
  try {
    foodImagesSnap = await db.collectionGroup('foodImages').get();
  } catch (err: any) {
    console.error('Error fetching collection group foodImages from Firestore:', err.message || err);
    process.exit(1);
  }

  if (foodImagesSnap.empty) {
    console.log('No foodImages documents found in Firestore.');
    process.exit(0);
  }

  console.log(`Successfully fetched ${foodImagesSnap.size} foodImages documents.`);
  let migratedCount = 0;
  let docsUpdatedCount = 0;
  let skippedCount = 0;

  for (const docSnap of foodImagesSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    const parentUser = docSnap.ref.parent.parent;
    const userId = parentUser ? parentUser.id : 'unknown_user';

    let hasChanges = false;
    let updatedImageUrl = data.imageUrl || null;
    let updatedImageUrls = Array.isArray(data.imageUrls) ? [...data.imageUrls] : [];

    // 1. Process single imageUrl field
    if (typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:image/')) {
      hasChanges = true;
      try {
        console.log(`[Firestore Migrate] Uploading imageUrl for doc ${docId} (User ${userId})...`);
        const r2Url = await uploadBase64ToR2(docId, data.imageUrl, 0);
        updatedImageUrl = r2Url;
        migratedCount++;
      } catch (uploadErr) {
        console.error(`Skipping update for single imageUrl in doc ${docId} due to upload failure.`);
      }
    }

    // 2. Process imageUrls array field
    if (Array.isArray(data.imageUrls)) {
      for (let i = 0; i < data.imageUrls.length; i++) {
        const url = data.imageUrls[i];
        if (typeof url === 'string' && url.startsWith('data:image/')) {
          hasChanges = true;
          try {
            console.log(`[Firestore Migrate] Uploading imageUrls[${i}] for doc ${docId} (User ${userId})...`);
            const r2Url = await uploadBase64ToR2(docId, url, i);
            updatedImageUrls[i] = r2Url;
            migratedCount++;
          } catch (uploadErr) {
            console.error(`Skipping update for imageUrls[${i}] in doc ${docId} due to upload failure.`);
          }
        }
      }
    }

    // 3. Update Firestore Document
    if (hasChanges) {
      console.log(`Updating doc ID: ${docId} (User: ${userId}) in Firestore with clean R2 links...`);
      try {
        await docSnap.ref.update({
          imageUrl: updatedImageUrl,
          imageUrls: updatedImageUrls
        });
        docsUpdatedCount++;
        console.log(`Firestore doc ID ${docId} updated successfully!`);
      } catch (updateErr: any) {
        console.error(`Failed to update Firestore document ${docId}:`, updateErr.message || updateErr);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n=== Firestore Migration Completed ===');
  console.log(`Total inspected documents: ${foodImagesSnap.size}`);
  console.log(`Skipped documents (already using URLs or empty): ${skippedCount}`);
  console.log(`Migrated individual images: ${migratedCount}`);
  console.log(`Updated database documents in Firestore: ${docsUpdatedCount}`);
  console.log('=====================================\n');
}

runMigration().catch((err) => {
  console.error('Unexpected migration error:', err);
  process.exit(1);
});
