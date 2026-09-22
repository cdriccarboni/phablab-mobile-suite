# PhabLab Mobile Suite · store release gate

The codebase contains 16 separately buildable apps sharing one engine. Each app has its own stable bundle identifier:

`com.phablabphone.<app-id>`

## Current release target

- Version: 1.0.0
- Android: target/compile SDK 36, min SDK 26.
- iOS: deployment target 15.5; build with Xcode 26+ / iOS 26 SDK for submission.
- Web/PWA builds: `npm run build:all`.
- Native generation: `MOBILE_APP_ID=<id> MOBILE_APP_NAME="<name>" node scripts/prepare-native.mjs android|ios`.

## Apps

wallcheck, captioncast, signme, lagcheck, tapback, papercheck, comparesound, showmethat, counttogether, phablabphone, twinlevel, sensorlink, syncmark, soundrace, framematch, relaytap.

## Publication boundary

Everything before store-account signing is automated in the repository. Actual store upload needs account-owned credentials.

### Google Play required secrets

- Play Console developer account with each package registered.
- upload/signing keystore or Play App Signing setup.
- service account JSON with release permission.

### Apple required secrets

- Apple Developer / App Store Connect membership.
- bundle IDs registered for each app.
- distribution certificate + provisioning profile(s), or an equivalent managed-signing setup.
- App Store Connect API key for upload automation.

Never commit signing keys, certificates, API keys or provisioning credentials.

## Product quality gate before public 1.0

1. CI green: TypeScript + all 16 web builds.
2. Android smoke build green.
3. iOS smoke build green.
4. Physical-device verification for permissions, speech, OCR, camera, WebRTC and sensors.
5. Accessibility pass: large text, VoiceOver/TalkBack labels, touch targets.
6. Privacy labels/data safety generated from actual behavior.
7. Store screenshots and preview video must use real app captures, not fabricated UI.
8. Trademark/name availability check before freezing public product names.
