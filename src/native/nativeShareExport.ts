import { Capacitor } from '@capacitor/core';

export interface ShareExportOptions {
  filename: string;
  data: string | Uint8Array;
  mimeType: string;
  title?: string;
  dialogTitle?: string;
}

const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const nativeShareExport = {
  async exportFile(options: ShareExportOptions): Promise<{ success: boolean; uri?: string }> {
    const {
      filename,
      data,
      mimeType,
      title = 'Export from Reflections',
      dialogTitle = 'Share or save export',
    } = options;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        let fileData: string;
        if (data instanceof Uint8Array) {
          fileData = uint8ArrayToBase64(data);
        } else {
          fileData = data;
        }

        const writtenFile = await Filesystem.writeFile({
          path: filename,
          data: fileData,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title,
          url: writtenFile.uri,
          dialogTitle,
        });

        return { success: true, uri: writtenFile.uri };
      } catch (error) {
        console.warn('[nativeShareExport] Native filesystem/share failed:', error);
        // Fall back to web download if native share fails or was dismissed
      }
    }

    // Web fallback using Blob download
    if (typeof document !== 'undefined') {
      const blob = new Blob([data as BlobPart], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 100);
      return { success: true };
    }

    return { success: false };
  },
};
