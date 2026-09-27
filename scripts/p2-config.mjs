export const P2_IDS = [
  'wallcheck', 'captioncast', 'signme', 'lagcheck', 'tapback', 'papercheck',
  'comparesound', 'showmethat', 'counttogether', 'phablabphone', 'framematch', 'relaytap',
];

export const P2_VERSION_CODE = 2;
export const P2_VERSION_NAME = '1.0.1-beta.1';

export const MANAGED_PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.VIBRATE',
];

// Le scan QR d'appairage (BarcodeDetector) du patch local est conservé :
// les apps à salle gardent CAMERA. Les quatre apps P1 ne sont pas listées.
export const P2_PERMISSIONS = {
  wallcheck: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.INTERNET'],
  captioncast: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.INTERNET'],
  signme: ['android.permission.CAMERA', 'android.permission.INTERNET'],
  lagcheck: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'],
  tapback: ['android.permission.CAMERA', 'android.permission.INTERNET', 'android.permission.VIBRATE'],
  papercheck: ['android.permission.CAMERA', 'android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
  comparesound: ['android.permission.RECORD_AUDIO'],
  showmethat: ['android.permission.CAMERA', 'android.permission.INTERNET'],
  counttogether: ['android.permission.CAMERA', 'android.permission.INTERNET', 'android.permission.VIBRATE'],
  phablabphone: ['android.permission.RECORD_AUDIO'],
  framematch: ['android.permission.CAMERA'],
  relaytap: ['android.permission.CAMERA', 'android.permission.INTERNET', 'android.permission.VIBRATE'],
};

export const P2_PLUGINS = {
  wallcheck: [],
  captioncast: ['speech'],
  signme: [],
  lagcheck: [],
  tapback: ['haptics'],
  papercheck: ['camera', 'mlkit'],
  comparesound: [],
  showmethat: ['camera'],
  counttogether: ['haptics'],
  phablabphone: [],
  framematch: ['camera'],
  relaytap: ['haptics'],
};

export const P2_ROOM_APPS = ['wallcheck', 'captioncast', 'signme', 'tapback', 'showmethat', 'counttogether', 'relaytap'];

export function isP2(id) {
  return Object.prototype.hasOwnProperty.call(P2_PERMISSIONS, id);
}

export function versionFor(id) {
  if (isP2(id)) return { versionCode: P2_VERSION_CODE, versionName: P2_VERSION_NAME };
  return { versionCode: 1, versionName: '1.0.0' };
}

export function applyAndroidManifest(xml, id) {
  if (!isP2(id)) return null;
  const wanted = new Set(P2_PERMISSIONS[id]);
  let manifest = xml.replace(/[ \t]*<uses-permission\b[^>]*\/>\s*/g, '');
  manifest = manifest.replace(/[ \t]*<uses-feature\b[^>]*\/>\s*/g, '');
  if (!manifest.includes('xmlns:tools=')) {
    manifest = manifest.replace(
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"',
    );
  }
  const lines = [];
  for (const perm of MANAGED_PERMISSIONS) {
    if (wanted.has(perm)) lines.push(`    <uses-permission android:name="${perm}" />`);
    else lines.push(`    <uses-permission android:name="${perm}" tools:node="remove" />`);
  }
  if (wanted.has('android.permission.CAMERA')) {
    lines.push('    <uses-feature android:name="android.hardware.camera" android:required="false" />');
  }
  if (wanted.has('android.permission.RECORD_AUDIO')) {
    lines.push('    <uses-feature android:name="android.hardware.microphone" android:required="false" />');
  }
  if (!manifest.includes('<application')) throw new Error('Manifest has no application tag');
  return manifest.replace('<application', `${lines.join('\n')}\n    <application`);
}

export function pluginDependencyLines(id) {
  const keys = isP2(id) ? P2_PLUGINS[id] : null;
  if (!keys) return null;
  const map = {
    camera: "    implementation project(':capacitor-camera')",
    haptics: "    implementation project(':capacitor-haptics')",
    mlkit: "    implementation project(':capacitor-mlkit-text-recognition')",
    speech: "    implementation project(':capgo-capacitor-speech-recognition')",
  };
  return [
    "    implementation project(':capacitor-android')",
    "    implementation project(':capacitor-app')",
    "    implementation project(':capacitor-share')",
    "    implementation project(':capacitor-splash-screen')",
    "    implementation project(':capacitor-status-bar')",
    ...keys.map((key) => map[key]),
  ].join('\n');
}

export function rewritePluginGradle(text, id) {
  const deps = pluginDependencyLines(id);
  if (!deps) return text;
  if (!/dependencies \{[\s\S]*?\n\}/.test(text)) throw new Error('capacitor.build.gradle has no dependencies block');
  return text.replace(/dependencies \{[\s\S]*?\n\}/, `dependencies {\n${deps}\n}`);
}
