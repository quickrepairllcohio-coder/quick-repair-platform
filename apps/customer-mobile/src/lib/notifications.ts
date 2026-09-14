import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Quick Repair', importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.status === 'granted'
    ? existing.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const { error } = await supabase.rpc('register_user_device', {
    p_provider: 'expo', p_push_token: token.data, p_platform: Platform.OS,
  });
  if (error) throw error;
  return token.data;
}

export function subscribeToUserNotifications(userId: string, onNotification: (payload: any) => void) {
  const channel = supabase.channel(`user:${userId}:notifications`, { config: { private: true } });
  channel.on('broadcast', { event: 'notification' }, onNotification).subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToPushTokenRefresh() {
  return Notifications.addPushTokenListener(async token => {
    try {
      await supabase.rpc('register_user_device', { p_provider: 'expo', p_push_token: token.data, p_platform: Platform.OS });
    } catch { /* token refresh should never crash the app */ }
  });
}
