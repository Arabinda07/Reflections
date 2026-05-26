import { supabase } from '../src/supabaseClient';
import { cryptoService, isEncryptedEnvelope } from './cryptoService';
import { requireCurrentCryptoSession } from './cryptoSessionStore';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const NOTE_ATTACHMENT_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'audio/aac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'text/plain',
]);
const MIME_TYPES_BY_FEATURE: Record<string, Set<string>> = {
  avatar: IMAGE_MIME_TYPES,
  notes: NOTE_ATTACHMENT_MIME_TYPES,
};

const SAFE_PATH_SEGMENT = /^[a-zA-Z0-9_-]+$/;

const getExtension = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!extension || !SAFE_PATH_SEGMENT.test(extension)) {
    throw new Error('File extension is not allowed');
  }
  return extension;
};

const assertSafePathSegment = (value: string, label: string) => {
  if (!SAFE_PATH_SEGMENT.test(value)) {
    throw new Error(`${label} contains unsafe characters`);
  }
};

const assertUploadAllowed = (file: File, featureName: string) => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large');
  }

  const allowedTypes = MIME_TYPES_BY_FEATURE[featureName] || NOTE_ATTACHMENT_MIME_TYPES;
  if (!file.type || !allowedTypes.has(file.type)) {
    throw new Error('File type not allowed');
  }
};

const assertCurrentUserOwnsPath = async (path: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !path.startsWith(`${user.id}/`)) {
    throw new Error('Storage path does not belong to the authenticated user');
  }
};

const storageAad = (path: string) => {
  const userId = path.split('/')[0] || '';
  return {
    table: 'storage.objects',
    rowId: path,
    userId,
  };
};

const isEncryptedNoteFilePath = (path: string) => path.includes('/notes/');

const encryptedFile = async (file: File, path: string) => {
  const encryptedPayload = await cryptoService.encryptBytes(
    requireCurrentCryptoSession(),
    storageAad(path),
    new Uint8Array(await file.arrayBuffer()),
  );
  return new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });
};

const decryptFileUrl = async (signedUrl: string, path: string) => {
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error('Encrypted file could not be downloaded');
  const envelope = await response.json();
  if (!isEncryptedEnvelope(envelope)) throw new Error('Stored file is not encrypted');
  const bytes = await cryptoService.decryptBytes(requireCurrentCryptoSession(), storageAad(path), envelope);
  return URL.createObjectURL(new Blob([bytes]));
};

export const storageService = {
  // Since bucket is private, we must use signed URLs
  async getSignedUrl(path: string): Promise<string> {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path; // Already a URL
    await assertCurrentUserOwnsPath(path);
    
    const { data, error } = await supabase.storage
      .from('app-files')
      .createSignedUrl(path, 3600); // 1 hour validity
      
    if (error) {
      console.error('Supabase Storage Error (getSignedUrl):', error.message, error);
      return '';
    }
    if (isEncryptedNoteFilePath(path)) {
      return decryptFileUrl(data.signedUrl, path);
    }

    return data.signedUrl;
  },

  async uploadFile(file: File, userId: string, featureName: string, itemId: string): Promise<string> {
    assertUploadAllowed(file, featureName);
    assertSafePathSegment(userId, 'userId');
    assertSafePathSegment(featureName, 'featureName');
    assertSafePathSegment(itemId, 'itemId');

    const extension = getExtension(file);
    const uuid = crypto.randomUUID();
    const path = featureName === 'notes'
      ? `${userId}/${featureName}/${itemId}/${uuid}.enc`
      : `${userId}/${featureName}/${itemId}/${uuid}.${extension}`;
    const uploadBody = featureName === 'notes' ? await encryptedFile(file, path) : file;
    
    const { error } = await supabase.storage
      .from('app-files')
      .upload(path, uploadBody, { 
        cacheControl: '3600',
        contentType: featureName === 'notes' ? 'application/json' : file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage Error (uploadFile):', error.message, error);
      throw error;
    }
    return path;
  },

  async deleteFile(path: string): Promise<void> {
    if (!path || path.startsWith('http')) return;
    await assertCurrentUserOwnsPath(path);
    
    const { error } = await supabase.storage
      .from('app-files')
      .remove([path]);
      
    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  async deleteFiles(paths: string[]): Promise<void> {
    if (!paths.length) return;
    const validPaths = paths.filter(p => p && !p.startsWith('http'));
    if (!validPaths.length) return;
    await Promise.all(validPaths.map(assertCurrentUserOwnsPath));

    const { error } = await supabase.storage
      .from('app-files')
      .remove(validPaths);
      
    if (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  },

  async deleteUserPrefix(userId: string): Promise<void> {
    assertSafePathSegment(userId, 'userId');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('Storage prefix does not belong to the authenticated user');
    }

    const pathsToDelete: string[] = [];
    const pageSize = 1000;
    const walkPrefix = async (prefix: string): Promise<void> => {
      let offset = 0;

      for (;;) {
        const { data, error } = await supabase.storage
          .from('app-files')
          .list(prefix, { limit: pageSize, offset });

        if (error) throw error;

        for (const item of data || []) {
          const itemPath = `${prefix}/${item.name}`;
          if (item.id) {
            pathsToDelete.push(itemPath);
          } else {
            await walkPrefix(itemPath);
          }
        }

        if (!data || data.length < pageSize) {
          return;
        }

        offset += pageSize;
      }
    };

    await walkPrefix(userId);
    if (pathsToDelete.length > 0) {
      await storageService.deleteFiles(pathsToDelete);
    }
  },
};
