import type { CapacitorConfig } from '@capacitor/cli';

const slug = process.env.MOBILE_APP_ID || 'phablabphone';
const name = process.env.MOBILE_APP_NAME || 'PhabLabPhone';

const pluginsByApp: Record<string, string[]> = {
  captioncast: ['@capgo/capacitor-speech-recognition'],
  tapback: ['@capacitor/haptics'],
  papercheck: ['@capacitor/camera', '@capacitor-mlkit/text-recognition'],
  showmethat: ['@capacitor/camera'],
  counttogether: ['@capacitor/haptics'],
  syncmark: ['@capacitor/haptics'],
  soundrace: ['@capacitor/haptics'],
  framematch: ['@capacitor/camera'],
  relaytap: ['@capacitor/haptics']
};

const config: CapacitorConfig = {
  appId: `com.phablabphone.${slug}`,
  appName: name,
  webDir: `dist/${slug}`,
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false, includePlugins: pluginsByApp[slug] ?? [] },
  ios: { contentInset: 'automatic' }
};

export default config;
