---
status: accepted
---

# 0002 Native Mobile Deployment & Secure Storage

We are bringing Reflections to both Android and iOS native platforms to provide a premium, calm, and highly integrated mobile experience, beginning our rollout with Android. 

Because Reflections is an encrypted private journal (as established in ADR 0001), relying on standard web storage (IndexedDB/localStorage) inside a native webview leaves sensitive decryption keys vulnerable to device rooting or sophisticated extraction. Therefore, we are implementing a Capacitor Secure Storage plugin to store encryption keys and session tokens directly within the hardware-backed enclaves (Android Keystore and iOS Keychain). 

### Migration Strategy
Existing PWA users will be forced to log in fresh on the native app. We explicitly decided against attempting a one-time automatic migration of keys from the webview context to the native Keystore. Webview storage is heavily isolated from standard mobile browser storage (Chrome/Safari), making automatic migration highly brittle. A fresh login guarantees the key is generated and stored securely in the hardware enclave from day one.

### CryptoKey Serialization
Native secure storage plugins only accept string payloads. Since `cryptoKeyCache.ts` currently relies on IndexedDB's structured cloning to store raw Web Crypto `CryptoKey` objects, we will implement an abstraction layer for mobile. On native platforms, the `CryptoKey` will be exported to raw bytes (`crypto.subtle.exportKey("raw")`), encoded into a Base64 string, and stored securely. Upon loading, the string will be decoded and re-imported into a `CryptoKey`. We explicitly avoid re-deriving the key from the passphrase on every boot to preserve fast startup times and battery life.

### Background Privacy & Biometrics
To protect the private sanctuary of the journal, the app will automatically blur the screen when placed in the OS background (app switcher). We are introducing an opt-in "Require Biometrics to Unlock" setting. By default, the app provides visual privacy via the blur but allows immediate resumption. If the user opts in, returning to the app from the background will require a successful biometric scan (FaceID / Fingerprint) to unblur the interface and resume the session.

### Native Keyboard Management
**Superseded (2026-10-11).** The original plan was `resize: 'none'` plus manual padding from `@capacitor/keyboard` events. That was never built. Capacitor 8's core `SystemBars` plugin (`SystemBars.java`, `initWindowInsetsListener`) now pads the WebView by the IME height natively and exposes safe-area insets as CSS variables, and the manifest uses `adjustResize`. We rely on that and add no JS keyboard listeners. Revisit only if a device test shows the Quill cursor hidden behind the keyboard.

### Native Data Export
Standard HTML downloads are unreliable within native webviews. To support the core tenet of user data ownership, encrypted export files will be generated securely in the app's internal cache via `@capacitor/filesystem`. We will then trigger `@capacitor/share` to open the native OS Share Sheet. This empowers the user to save the file exactly where they want (e.g., Google Drive, iCloud, local files) without requiring the app to request invasive global storage permissions.

This decision trades the simplicity of uniform storage (web and mobile using the same IndexedDB logic) for true native-grade security on mobile platforms, ensuring that the user's private writing sanctuary remains protected at the OS level.
