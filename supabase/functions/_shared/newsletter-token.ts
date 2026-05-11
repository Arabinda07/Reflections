const encoder = new TextEncoder();

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const sign = async (userId: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(userId)));
};

export const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
};

export const createNewsletterToken = async (userId: string, secret: string) => {
  const userPart = base64UrlEncode(encoder.encode(userId));
  const signaturePart = base64UrlEncode(await sign(userId, secret));

  return `${userPart}.${signaturePart}`;
};

export const verifyNewsletterToken = async (token: string, secret: string) => {
  const [userPart, signaturePart] = token.split('.');

  if (!userPart || !signaturePart) {
    return null;
  }

  try {
    const userId = new TextDecoder().decode(base64UrlDecode(userPart));
    const expectedSignature = await sign(userId, secret);
    const actualSignature = base64UrlDecode(signaturePart);

    return timingSafeEqual(expectedSignature, actualSignature) ? userId : null;
  } catch {
    return null;
  }
};
