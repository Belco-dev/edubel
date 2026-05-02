// Cryptographic signature for report card authenticity.
// HMAC-SHA256 over a canonical payload. Secret key is bundled — this stops
// casual fraud (photoshopping marks, hand-edited copies) but is not a true
// anti-fraud system without a backend.

const SECRET_KEY = 'EDUBEL_REPORT_AUTH_v1_d8f3a92e7c1b4f56a0e9c2d1b8f7a3c5e';

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  // base64url
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface ReportPayload {
  s: string;   // student name
  c: string;   // class
  y: string;   // academic year
  t: string;   // term name
  p: number;   // overall percentage (1 decimal)
  r: number;   // rank
  sc: string;  // school name
  ts: number;  // issued timestamp (ms)
}

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function fromBase64Url(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

export async function buildVerifyUrl(payload: ReportPayload, origin?: string): Promise<string> {
  const json = JSON.stringify(payload);
  const data = toBase64Url(json);
  const sig = await hmacSha256(SECRET_KEY, data);
  const base = origin || window.location.origin;
  return `${base}/verify#d=${data}&s=${sig}`;
}

export async function verifySignature(data: string, sig: string): Promise<{ valid: boolean; payload: ReportPayload | null }> {
  try {
    const expected = await hmacSha256(SECRET_KEY, data);
    if (expected !== sig) return { valid: false, payload: JSON.parse(fromBase64Url(data)) };
    const payload = JSON.parse(fromBase64Url(data)) as ReportPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}
