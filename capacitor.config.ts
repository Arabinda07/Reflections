import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arabinda.reflections',
  appName: 'Reflections',
  webDir: 'dist',
  server: {
    // During development you can point to your local dev server:
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#121212',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,  // Set true only during dev
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
};

export default config;
