import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phablabphone.signme',
  appName: "SignMe",
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' }
};

export default config;
