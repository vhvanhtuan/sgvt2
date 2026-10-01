# Capacitor — Wrap frontend as Android app (quick guide)

This file explains the minimal steps to package the `frontend` build into an Android app using Capacitor and use a native barcode scanner plugin.

Prerequisites
- Node.js + npm installed
- Android Studio with Android SDK (API 31+ recommended)

Quick commands (run inside `d:\web\sgvt2\frontend`)

1. Install Capacitor core & CLI

```bash
npm install @capacitor/core @capacitor/cli --save
npx cap --version
```

2. Initialize Capacitor (only if not already initialized)

```bash
npx cap init "SGVT Cargo Scanner" com.sgvt.cargo
# This creates capacitor.config.json (already present in this repo)
```

3. Build web assets

```bash
npm run build
# ensure the compiled web app is in the folder specified by `webDir` (default: build)
```

4. Add Android platform

```bash
npx cap add android
npx cap sync
```

5. Install a native barcode scanner plugin (recommended)

```bash
npm install @capacitor-community/barcode-scanner
npx cap sync
```

6. Open the Android project in Android Studio

```bash
npx cap open android
```

7. Android permission notes
- Add Camera permission to `android/app/src/main/AndroidManifest.xml` if the plugin doesn't add it automatically:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```
- Plugin typically requests runtime permission; verify plugin docs.

8. Usage in web code
- The page already attempts to detect Capacitor/BarcodeScanner and call native plugin first. When running as a Capacitor app the native plugin will be used and camera streaming works without HTTPS.

9. Build a release APK

Open Android Studio → Build → Generate Signed Bundle / APK → follow steps.

Troubleshooting
- If camera doesn't start, check runtime permission in Android Settings for the app.
- If plugin APIs differ, consult the plugin README: https://github.com/capacitor-community/barcode-scanner

If you want, I can:
- add a `scripts` section example to `package.json` to automate `build && npx cap copy android && npx cap open android`,
- or create a minimal Android native wrapper project with the barcode plugin preconfigured.
