// @ts-nocheck
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;

export type UploadFolder = 'products' | 'vendors' | 'documents' | 'profiles' | 'chat';

export async function uploadToCloudinary(
  file: File | Buffer,
  folder: UploadFolder = 'products',
  publicId?: string
): Promise<{ publicId: string; url: string; secureUrl: string }> {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string> = {
    timestamp: String(timestamp),
    folder,
  };
  if (publicId) paramsToSign.public_id = publicId;

  const signature = await generateSignature(paramsToSign);

  const formData = new FormData();
  formData.append('file', file as Blob);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);
  if (publicId) formData.append('public_id', publicId);

  const res = await fetch(`${CLOUDINARY_BASE}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = await generateSignature({ public_id: publicId, timestamp: String(timestamp) });

  const res = await fetch(`${CLOUDINARY_BASE}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      public_id: publicId,
      api_key: API_KEY,
      timestamp: String(timestamp),
      signature,
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloudinary delete failed: ${res.statusText}`);
  }
}

export function getOptimizedUrl(publicId: string, width = 800, height = 600): string {
  return `${CLOUDINARY_BASE}/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/${publicId}`;
}

export function getThumbnailUrl(publicId: string): string {
  return `${CLOUDINARY_BASE}/image/upload/f_auto,q_auto,w_150,h_150,c_fill/${publicId}`;
}

export function getFullSizeUrl(publicId: string): string {
  return `${CLOUDINARY_BASE}/image/upload/f_auto,q_auto/${publicId}`;
}

export function getAvatarUrl(publicId: string): string {
  return `${CLOUDINARY_BASE}/image/upload/f_auto,q_auto,w_200,h_200,c_fill,r_max/${publicId}`;
}

async function generateSignature(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const toSign = `${sorted}${API_SECRET}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(toSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
