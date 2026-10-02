import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export const LocationAPI = {
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },
  
  async getCurrentLocation() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) throw new Error('دسترسی به مکان‌یاب (GPS) رد شد.');
    
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  // قابلیت جدید: تبدیل رایگان مختصات به متن با استفاده از سرویس بومی گوشی
  async getAddressFromCoords(lat: number, lon: number) {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geocode.length > 0) {
        const place = geocode[0];
        // ترکیب استان، شهر و خیابان
        const addressParts = [place.region, place.city, place.street].filter(Boolean);
        return addressParts.join('، ');
      }
      return '';
    } catch (error) {
      console.log('Reverse geocode error', error);
      return '';
    }
  },

  // قابلیت جدید: ارسال مختصات به اپلیکیشن‌های مسیریاب (Google Maps / Waze / Apple Maps)
  openNavigation(lat: number, lon: number, label: string = 'محل مشتری') {
    const latLng = `${lat},${lon}`;
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        // بک‌آپ: اگر هیچ مپ بومی باز نشد، لینک وب گوگل مپ باز شود
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
      });
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  }
};