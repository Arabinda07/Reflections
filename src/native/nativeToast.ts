import { Capacitor, registerPlugin } from '@capacitor/core';

type NativeToastDuration = 'short' | 'long';

type NativeToastPlugin = {
  show(options: { text: string; duration?: NativeToastDuration }): Promise<void>;
};

const NativeToast = registerPlugin<NativeToastPlugin>('NativeToast');

export const nativeToast = {
  async show({
    text,
    duration = 'short',
  }: {
    text: string;
    duration?: NativeToastDuration;
  }) {
    if (!Capacitor.isNativePlatform() || !text.trim()) {
      return;
    }

    try {
      await NativeToast.show({ text, duration });
    } catch (error) {
      console.warn('[nativeToast] Unable to show native toast.', error);
    }
  },
};
