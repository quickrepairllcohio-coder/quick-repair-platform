import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// تنظیمات نمایش نوتیفیکیشن وقتی اپلیکیشن باز است
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationAPI = {
  async registerForPushNotificationsAsync(userId: string) {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5A623',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('دسترسی به نوتیفیکیشن رد شد!');
        return;
      }

      // دریافت توکن اکسپو (Expo Push Token)
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      // ذخیره توکن در پروفایل کاربر در سوپابیس
      if (token && userId) {
        await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
      }
      
    } else {
      console.log('نوتیفیکیشن فقط روی گوشی واقعی کار می‌کند (نه شبیه‌ساز)');
    }

    return token;
  },

  // تابع ارسال نوتیفیکیشن (این تابع در آینده می‌تواند مستقیماً از سمت بک‌اند سوپابیس هم فراخوانی شود)
  async sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }
};