// react-native-onesignal requires a native module that only exists in a
// custom dev client / production build with it actually compiled in — not
// in Expo Go (confirmed live: it crashes on Android inside Expo Go with
// "TurboModuleRegistry.getEnforcing(...): 'OneSignal' could not be found"),
// and not on web either (no implementation there at all). In every one of
// those environments, just requiring the module throws synchronously — its
// own top-level code calls TurboModuleRegistry.getEnforcing('OneSignal') the
// instant it's evaluated, not lazily on first use — so a Platform.OS check
// alone isn't enough (it only ruled out web, not Expo Go on Android/iOS).
// Wrapping the require itself in try/catch is what actually covers every
// environment lacking the native module, regardless of platform.
let OneSignalModule = null;
try {
  OneSignalModule = require('react-native-onesignal').OneSignal;
} catch (e) {
  console.warn('react-native-onesignal unavailable in this environment (Expo Go or web) — push notifications disabled here.');
}

export const OneSignal = OneSignalModule;
