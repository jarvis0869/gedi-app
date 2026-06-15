// Dynamic Expo config — replaces app.json.
// Local dev: reads from .env (loaded by expo-dotenv automatically in SDK 51).
// EAS builds: values come from EAS Secrets (set via scripts/setup-eas-secrets.sh).
//
// Fill in EAS_PROJECT_ID after running: eas project:init

const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || '30351279-d372-4f69-97f7-015d615fd35e';

export default {
  expo: {
    name: 'Gedi',
    slug: 'gedi',
    owner: 'jarvis0869',
    version: '1.0.0',
    scheme: 'gedi',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',

    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1A1628',
    },

    // OTA Updates (expo-updates)
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      enabled: true,
      fallbackToCacheTimeout: 0,
      checkAutomatically: 'ON_LOAD',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: 'in.gediapp.app',
      associatedDomains: ['applinks:gediapp.in'],
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Gedi uses your location to show nearby places and verify check-ins.',
        NSLocationAlwaysUsageDescription:
          'Gedi uses your location to show nearby places and verify check-ins.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A1628',
      },
      package: 'in.gediapp.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'https', host: 'gediapp.in', pathPrefix: '/place' },
            { scheme: 'https', host: 'gediapp.in', pathPrefix: '/event' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },

    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FF6B00',
          sounds: [],
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Gedi uses your location to show nearby places and verify check-ins.',
        },
      ],
      'expo-updates',
      'expo-font',
      'expo-splash-screen',
      'expo-status-bar',
      'expo-web-browser',
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      eas: { projectId: EAS_PROJECT_ID },
    },
  },
};
