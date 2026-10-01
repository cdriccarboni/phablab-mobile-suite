import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phablabphone.papercheck',
  appName: "Paper → Checklist",
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' }
};

export default config;
