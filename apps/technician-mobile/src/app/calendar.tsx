import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ایمپورت نسخه سازگار با آپدیت جدید اکسپو
import * as Calendar from 'expo-calendar/legacy';

export default function CalendarScreen() {
  const router = useRouter();

  const [events, setEvents] = useState([
    { id: '1', date: 'امروز', title: 'تعمیر پکیج دیواری', time: '۱۴:۳۰ - ۱۶:۰۰', type: 'job', synced: false },
    { id: '2', date: 'فردا', title: 'نصب کولر گازی', time: '۱۰:۰۰ - ۱۳:۰۰', type: 'job', synced: false },
    { id: '3', date: 'پس‌فردا', title: 'مرخصی / مسدود', time: 'تمام روز', type: 'blocked', synced: false },
  ]);

  // تابع اصلی و عملیاتی برای ثبت در تقویم گوشی
  const syncEventToNativeCalendar = async (event: any) => {
    try {
      // ۱. دریافت دسترسی‌های تقویم
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطا', 'برای ثبت شیفت‌ها، باید دسترسی به تقویم را به برنامه بدهید.');
        return;
      }

      // ۲. پیدا کردن تقویم پیش‌فرض گوشی برای درج رویداد
      let targetCalendarId = null;
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      if (Platform.OS === 'ios') {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        targetCalendarId = defaultCalendar.id;
      } else {
        // در اندروید: پیدا کردن تقویم اصلی گوگل کاربر که اجازه ویرایش دارد
        const primaryCalendars = calendars.filter(c => c.isPrimary && c.allowsModifications);
        if (primaryCalendars.length > 0) {
          targetCalendarId = primaryCalendars[0].id;
        } else {
          // اگر تقویم اصلی پیدا نشد، اولین تقویمی که اجازه ویرایش دارد را انتخاب کن
          const modifiableCalendars = calendars.filter(c => c.allowsModifications);
          if (modifiableCalendars.length > 0) {
            targetCalendarId = modifiableCalendars[0].id;
          }
        }
      }

      if (!targetCalendarId) {
        Alert.alert('خطا', 'هیچ تقویم مجازی در گوشی شما برای ثبت رویداد یافت نشد.');
        return;
      }

      // ۳. تنظیم دقیق زمان رویداد
      const startDate = new Date();
      if (event.date === 'فردا') startDate.setDate(startDate.getDate() + 1);
      if (event.date === 'پس‌فردا') startDate.setDate(startDate.getDate() + 2);
      
      // تنظیم ساعت فرضی برای تست (ساعت ۱۰ صبح)
      startDate.setHours(10, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2); // مدت زمان کار: ۲ ساعت

      // ۴. ثبت نهایی در تقویم دستگاه
      await Calendar.createEventAsync(targetCalendarId, {
        title: `QuickRepair: ${event.title}`,
        startDate: startDate,
        endDate: endDate,
        timeZone: 'Asia/Tehran',
        location: 'محل مشتری ثبت شده در اپلیکیشن',
        notes: 'این رویداد به صورت خودکار توسط پلتفرم QuickRepair همگام‌سازی شده است.',
        alarms: [{ relativeOffset: -60 }] // هشدار ۶۰ دقیقه قبل از شروع
      });

      // ۵. بروزرسانی ظاهر دکمه
      const updatedEvents = events.map(e => 
        e.id === event.id ? { ...e, synced: true } : e
      );
      setEvents(updatedEvents);

      Alert.alert('ثبت موفق!', 'سفارش با موفقیت به تقویم اصلی گوشی شما اضافه شد. یک ساعت قبل به شما هشدار داده می‌شود.');

    } catch (error) {
      Alert.alert('خطا در همگام‌سازی', 'ممکن است گوشی شما اجازه ثبت رویداد را نداده باشد.');
      console.log(error);
    }
  };

  const handleAddVacation = () => {
    Alert.alert('ثبت مرخصی', 'روز مورد نظر مسدود شد و سفارشی دریافت نخواهید کرد.');
  };

  return (
    <View style={s.container}>
      <View style={s.headerNav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>تقویم کاری و شیفت‌ها</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Surface style={s.syncBanner} elevation={0}>
          <View style={s.syncIconBox}>
            <MaterialCommunityIcons name="sync" size={28} color="#2563EB" />
          </View>
          <View style={s.syncTextZone}>
            <Text style={s.syncTitle}>همگام‌سازی هوشمند (فعال)</Text>
            <Text style={s.syncSub}>رویدادها مستقیماً در Google Calendar / Apple Calendar گوشی شما ثبت می‌شوند.</Text>
          </View>
        </Surface>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>برنامه کاری پیش‌رو</Text>
          <TouchableOpacity style={s.addBlockBtn} onPress={handleAddVacation}>
            <MaterialCommunityIcons name="calendar-remove" size={16} color="#EF4444" />
            <Text style={s.addBlockText}>مسدود کردن روز</Text>
          </TouchableOpacity>
        </View>

        {events.map((ev) => (
          <Surface key={ev.id} style={s.eventCard} elevation={0}>
            <View style={s.eventRow}>
              <View style={[s.dateBox, ev.type === 'blocked' && { backgroundColor: '#FEF2F2' }]}>
                <Text style={[s.dateText, ev.type === 'blocked' && { color: '#EF4444' }]}>{ev.date}</Text>
                <Text style={[s.timeText, ev.type === 'blocked' && { color: '#F87171' }]}>{ev.time}</Text>
              </View>
              
              <View style={s.eventDetails}>
                <Text style={s.eventTitle}>{ev.title}</Text>
                {ev.type === 'job' && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>سفارش قطعی</Text>
                  </View>
                )}
              </View>
            </View>

            <Divider style={{ marginVertical: 12, backgroundColor: '#F1F5F9' }} />

            <View style={s.actionRow}>
              {ev.synced ? (
                <View style={s.syncedStatus}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
                  <Text style={s.syncedText}>در تقویم گوشی ثبت شد</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={s.syncBtn} 
                  onPress={() => syncEventToNativeCalendar(ev)}
                >
                  <MaterialCommunityIcons name="cellphone-check" size={18} color="#2563EB" />
                  <Text style={s.syncBtnText}>افزودن به تقویم گوشی</Text>
                </TouchableOpacity>
              )}
            </View>
          </Surface>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 56 : 44, paddingBottom: 20, backgroundColor: '#FFF' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 100 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  syncBanner: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  syncIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  syncTextZone: { flex: 1, marginLeft: 12 },
  syncTitle: { fontSize: 15, fontWeight: '800', color: '#1E3A8A' },
  syncSub: { fontSize: 12, color: '#1E40AF', marginTop: 4, lineHeight: 18 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  addBlockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 4 },
  addBlockText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  eventCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  eventRow: { flexDirection: 'row' },
  dateBox: { width: 70, height: 70, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  dateText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  timeText: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },
  
  eventDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  eventTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  badge: { backgroundColor: '#F0FDF4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, gap: 6 },
  syncBtnText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  
  syncedStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  syncedText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
});