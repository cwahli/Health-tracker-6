
// Storage preserves photo to /photos/ and raw log to /debug/
// endpoint d17eecca64f82625d29dc38b14f46c14.r2.cloudflarestorage.com

export async function uploadPhotoToR2(jobId: string, imageBlobOrDataUrl: string): Promise<string> {
  if (typeof window === 'undefined') {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd17eecca64f82625d29dc38b14f46c14';
      const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'health-tracker-photos';
      const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d17eecca64f82625d29dc38b14f46c14.r2.dev').replace(/\/$/, '');
      const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
      const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';

      const publicUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/photos/${jobId}.jpg`;
      if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
        return publicUrl;
      }

      const s3Endpoint = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const client = new S3Client({
        region: 'auto',
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
      });

      let body;
      let contentType = 'image/jpeg';

      if (imageBlobOrDataUrl.startsWith('data:')) {
        const match = imageBlobOrDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          contentType = match[1];
          body = Buffer.from(match[2], 'base64');
        } else {
          body = Buffer.from(imageBlobOrDataUrl);
        }
      } else {
        body = Buffer.from(imageBlobOrDataUrl);
      }

      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: `photos/${jobId}.jpg`,
        Body: body,
        ContentType: contentType,
      });
      await client.send(command);
      return publicUrl;
    } catch (err) {
      console.error('[R2Storage] Server-side uploadPhotoToR2 failed:', err);
      return '';
    }
  }

  try {
    let payload = imageBlobOrDataUrl;
    if (payload.startsWith('blob:')) {
      const res = await fetch(payload);
      const blob = await res.blob();
      
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      payload = dataUrl;
    }

    const res = await fetch('/api/r2/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, payload }),
    });
    if (!res.ok) throw new Error('Failed to upload photo');
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error('[R2Storage] Failed uploading photo to R2:', err);
    return '';
  }
}

export async function uploadDebugPayloadToR2(jobId: string, debugJson: object): Promise<string> {
  if (typeof window === 'undefined') {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd17eecca64f82625d29dc38b14f46c14';
      const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'health-tracker-photos';
      const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d17eecca64f82625d29dc38b14f46c14.r2.dev').replace(/\/$/, '');
      const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
      const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';

      const publicUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/debug/${jobId}.json`;
      if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
        return publicUrl;
      }

      const s3Endpoint = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const client = new S3Client({
        region: 'auto',
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
      });

      const body = Buffer.from(JSON.stringify(debugJson, null, 2));

      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: `debug/${jobId}.json`,
        Body: body,
        ContentType: 'application/json',
      });
      await client.send(command);
      return publicUrl;
    } catch (err) {
      console.error('[R2Storage] Server-side uploadDebugPayloadToR2 failed:', err);
      return '';
    }
  }

  try {
    const res = await fetch('/api/r2/upload-debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, payload: debugJson }),
    });
    if (!res.ok) throw new Error('Failed to upload debug payload');
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error('[R2Storage] Failed uploading debug payload to R2:', err);
    return '';
  }
}

export async function uploadJobResultToR2(jobId: string, resultJson: object): Promise<string> {
  if (typeof window === 'undefined') {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd17eecca64f82625d29dc38b14f46c14';
      const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'health-tracker-photos';
      const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d17eecca64f82625d29dc38b14f46c14.r2.dev').replace(/\/$/, '');
      const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
      const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';

      const publicUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/jobs/${jobId}_result.json`;
      if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
        return publicUrl;
      }

      const s3Endpoint = `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const client = new S3Client({
        region: 'auto',
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
      });

      const body = Buffer.from(JSON.stringify(resultJson, null, 2));

      const command = new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: `jobs/${jobId}_result.json`,
        Body: body,
        ContentType: 'application/json',
      });
      await client.send(command);
      return publicUrl;
    } catch (err) {
      console.error('[R2Storage] Server-side uploadJobResultToR2 failed:', err);
      return '';
    }
  }

  try {
    const res = await fetch('/api/r2/upload-job-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, payload: resultJson }),
    });
    if (!res.ok) throw new Error('Failed to upload job result payload');
    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error('[R2Storage] Failed uploading job result payload to R2:', err);
    return '';
  }
}

export async function fetchJobResultFromR2(jobId: string): Promise<any> {
  try {
    const CLOUDFLARE_R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d17eecca64f82625d29dc38b14f46c14.r2.dev').replace(/\/$/, '');
    const url = `${CLOUDFLARE_R2_PUBLIC_URL}/jobs/${jobId}_result.json`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`[R2Storage] Failed to fetch job result for ${jobId}:`, err);
  }
  return null;
}

/* proxyUrl */

/* stripHeavyImages coldDebugR2Key COLD_DEBUG_LOG opts?: { userId? */
