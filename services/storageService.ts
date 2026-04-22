import { supabase } from '../src/supabaseClient';

export const storageService = {
  // Since bucket is private, we must use signed URLs
  async getSignedUrl(path: string): Promise<string> {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path; // Already a URL
    
    const { data, error } = await supabase.storage
      .from('app-files')
      .createSignedUrl(path, 3600); // 1 hour validity
      
    if (error) {
      console.error('Supabase Storage Error (getSignedUrl):', error.message, error);
      return '';
    }
    return data.signedUrl;
  },

  async uploadFile(file: File, userId: string, featureName: string, itemId: string): Promise<string> {
    const extension = file.name.split('.').pop();
    const uuid = crypto.randomUUID();
    const path = `${userId}/${featureName}/${itemId}/${uuid}.${extension}`;
    
    const { error } = await supabase.storage
      .from('app-files')
      .upload(path, file, { 
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase Storage Error (uploadFile):', error.message, error);
      throw error;
    }
    return path;
  },

  async deleteFile(path: string): Promise<void> {
    if (!path || path.startsWith('http')) return;
    
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

    const { error } = await supabase.storage
      .from('app-files')
      .remove(validPaths);
      
    if (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  }
};
