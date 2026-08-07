const fs = require('fs');
const content = `
export async function uploadPhotoToR2(jobId: string, imageBlobOrDataUrl: string): Promise<string> {
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
`;
fs.writeFileSync('src/utils/r2Storage.ts', content);
