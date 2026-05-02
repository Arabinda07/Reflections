import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

export const parseJsonBody = async <T = Record<string, unknown>>(
  req: any,
  maxBytes = 250_000,
): Promise<T> => {
  if (req.body !== undefined && req.body !== null) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
      throw new HttpError(413, 'Request body too large');
    }
    return (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) as T;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) {
      throw new HttpError(413, 'Request body too large');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return (raw ? JSON.parse(raw) : {}) as T;
};

export const readRawBody = async (req: any, maxBytes = 250_000): Promise<string> => {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > maxBytes) throw new HttpError(413, 'Request body too large');
    return req.body.toString('utf8');
  }

  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
      throw new HttpError(413, 'Request body too large');
    }
    return req.body;
  }

  if (req.body !== undefined && req.body !== null) {
    const raw = JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
      throw new HttpError(413, 'Request body too large');
    }
    return raw;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new HttpError(413, 'Request body too large');
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};

export const createSupabaseAuthClient = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return createClient(url, anonKey);
};

export const createSupabaseAdminClient = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRoleKey) {
    throw new HttpError(500, 'Supabase service role is not configured');
  }

  return createClient(url, serviceRoleKey);
};

export const requireUser = async (supabaseAuth: ReturnType<typeof createClient>, authorization?: string) => {
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!token) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  return data.user;
};

export const getClientIp = (req: any) => {
  const forwardedFor = String(req.headers?.['x-forwarded-for'] || '');
  return (
    forwardedFor.split(',')[0]?.trim() ||
    String(req.headers?.['x-real-ip'] || '') ||
    String(req.socket?.remoteAddress || 'unknown')
  );
};

export const hashForLogs = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const timingSafeEqualHex = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const getErrorStatusCode = (error: unknown) =>
  error instanceof HttpError ? error.statusCode : 500;

export const getErrorMessage = (error: unknown, fallback = 'Request failed') =>
  error instanceof Error ? error.message : fallback;
