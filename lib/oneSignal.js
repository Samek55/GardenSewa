import { Platform } from 'react-native';

// react-native-onesignal has no web implementation — a plain static import
// crashes Metro's web bundle with "Cannot read properties of undefined
// (reading 'getEnforcing')", because the module's own top-level code reaches
// for a native module that doesn't exist on web. That crash happens purely
// from importing the module, even if every call site already guards its own
// usage with Platform.OS !== 'web' — a static `import` always runs regardless
// of any runtime check. A Platform-guarded `require()` (a runtime call, only
// executed on native) avoids that, centralized here so every screen imports
// from this one safe place instead of repeating the guard.
export const OneSignal = Platform.OS !== 'web' ? require('react-native-onesignal').OneSignal : null;
