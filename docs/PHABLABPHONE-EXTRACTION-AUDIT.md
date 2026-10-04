# PhabLabPhone — extraction audit

Date: 2026-10-05

## Verified source

Current migration source:
- `cdriccarboni/phablab-mobile-suite`
- extraction root: `.split/phablabphone`
- source version: 1.0.0
- app id: phablabphone
- Android applicationId declared by the split: `com.phablabphone.phablabphone`

No independent PhabLabPhone repository was found through the connected GitHub repository searches at audit time.

## What is genuinely PhabLabPhone

The product UI currently exposed by `src/apps.tsx` is a small phone-sensor laboratory:
- microphone level (dBFS)
- orientation (beta/gamma)
- motion magnitude
- 660 Hz tone
- educational disclaimer

The app-specific logic in `src/app-logic.ts` is mostly unrelated to this visible sensor screen. It contains caption, sign, checklist, image-marker, reaction-game and other utilities. Those are strong contamination indicators from the former multi-app engine.

`src/logic.ts` is also broader than the visible PhabLabPhone screen: room pairing, counters, level comparison, sensor statistics, race results and other mini-app behaviours coexist there.

`src/core.tsx` is similarly a shared engine containing PeerJS rooms, QR scanning, camera, speech recognition, haptics, audio analysis and sensor hooks.

## Extraction rule

Do NOT copy the entire monorepo source into a new repository.

The standalone PhabLabPhone repository should contain only:
1. PhabLabPhone UI.
2. Sensor runtime required by that UI.
3. Generic lifecycle/resource cleanup needed by those sensors.
4. Product tests.
5. Product-specific metadata, assets and store documentation.

PeerJS, QR, speech recognition, camera, checklist, sign, reaction-game and other unrelated features should not become dependencies of PhabLabPhone unless a product specification explicitly requires them.

## Current dependency concern

`src/apps.tsx` imports many symbols from `core.tsx`, `logic.ts` and `app-logic.ts` that are not needed by the currently rendered PhabLabPhone screen. This is not acceptable as the final standalone architecture.

The extraction agent must trace actual imports and remove dead/product-crossing dependencies before declaring the standalone repository clean.

## Quality gates

- npm install succeeds
- npm test succeeds
- typecheck succeeds
- Vite production build succeeds
- Capacitor Android sync/build succeeds
- applicationId is exactly `com.phablabphone.phablabphone`
- version/versionCode are explicitly verified
- no other mini-app UI or logic is reachable from PhabLabPhone
- no fake sensor readings
- permission denial and unavailable hardware are handled honestly
- offline/local sensor use works without an account
- PeerJS/networking is removed unless explicitly retained by product scope
- privacy/data-safety text matches actual permissions and telemetry (ideally no analytics/account data)

## Important infrastructure limitation

The connected GitHub integration available to this agent can create branches/files/commits inside an existing repository, but does not expose repository-creation administration. Therefore creation of the new independent GitHub repository must be performed through an authorized GitHub UI/API path or by Gemini/terminal with the user's GitHub credentials.

This is an infrastructure limitation, not a reason to keep the app mixed in the legacy monorepo.
