import type { CapacitorConfig } from '@capacitor/cli';

const slug = process.env.MOBILE_APP_ID || 'phablabphone';
const name = process.env.MOBILE_APP_NAME || 'PhabLabPhone';

const config: CapacitorConfig = {
  appId: `com.phablabphone.${slug}`,
  appName: name,
  webDir: `dist/${slug}`,
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' }
};

export default config;
