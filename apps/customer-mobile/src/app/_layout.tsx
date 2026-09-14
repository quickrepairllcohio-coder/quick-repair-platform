import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { appTheme } from '../lib/theme';
import { registerForPushNotifications, subscribeToPushTokenRefresh } from '../lib/notifications';
import { attachNotificationRouting } from '../lib/notificationRouting';

function RootNavigator() {
  const { session, loading } = useAuth();
  useEffect(() => { if (!session) return; registerForPushNotifications().catch(() => undefined); const stopRouting = attachNotificationRouting(); const tokenListener = subscribeToPushTokenRefresh(); return () => { stopRouting(); tokenListener.remove(); }; }, [session]);
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appTheme.colors.background }}><ActivityIndicator color={appTheme.colors.primary} /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}

export default function RootLayout() {
  return <SafeAreaProvider><PaperProvider theme={appTheme}><AuthProvider><RootNavigator /></AuthProvider></PaperProvider></SafeAreaProvider>;
}
