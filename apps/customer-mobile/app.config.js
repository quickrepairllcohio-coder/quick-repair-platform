module.exports = ({ config }) => ({
  ...config,
  name: 'Quick Repair',
  slug: 'quick-repair',
  scheme: 'quickrepair',
  version: '1.0.2',
  orientation: 'portrait',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.quickrepair.customer',
    supportsTablet: true,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || undefined,
    },
  },
  android: {
    ...config.android,
    package: 'com.quickrepair.customer',
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || undefined },
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    ['react-native-maps', {
      androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || undefined,
      iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || undefined,
    }],
    ['expo-location', {
      locationWhenInUsePermission: 'Quick Repair uses your location to show service and technician arrival information.'
    }]
  ],
  extra: {
    ...config.extra,
    eas: { projectId: process.env.EXPO_PROJECT_ID || config.extra?.eas?.projectId },
  },
});
