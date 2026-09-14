module.exports = ({ config }) => ({
  ...config,
  name: 'Quick Repair Technician',
  slug: 'quick-repair-technician',
  scheme: 'quickrepair-tech',
  version: '1.0.2',
  orientation: 'portrait',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.quickrepair.technician',
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || undefined,
    },
  },
  android: {
    ...config.android,
    package: 'com.quickrepair.technician',
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || undefined },
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    ['expo-image-picker', {
      photosPermission: 'Quick Repair needs photo access for job documentation.',
      cameraPermission: 'Quick Repair needs camera access for before/after job photos.',
      microphonePermission: false
    }],
    ['react-native-maps', {
      androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || undefined,
      iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY || undefined,
    }],
    ['expo-location', {
      locationWhenInUsePermission: 'Quick Repair uses your location for navigation and job dispatch.',
      locationAlwaysAndWhenInUsePermission: 'Quick Repair shares your location with customers while an assigned job is en route or in progress.',
      isAndroidBackgroundLocationEnabled: true,
      isAndroidForegroundServiceEnabled: true,
      isIosBackgroundLocationEnabled: true
    }]
  ],
  extra: {
    ...config.extra,
    eas: { projectId: process.env.EXPO_PROJECT_ID || config.extra?.eas?.projectId },
  },
});
