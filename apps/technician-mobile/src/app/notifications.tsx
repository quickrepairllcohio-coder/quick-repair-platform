import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const router = useRouter();
  const notis = [
    { id: '1', title: 'تایید مهارت جدید', text: 'ادمین مدرک «نصب اسپلیت» شما را تایید کرد.', time: '۲ ساعت پیش', icon: 'shield-check', color: '#16A34A', bg: '#F0FDF4' },
    { id: '2', title: 'واریز به کیف پول', text: 'مبلغ ۴۵۰,۰۰۰ تومان به حساب شما افزوده شد.', time: '۵ ساعت پیش', icon: 'wallet', color: '#2563EB', bg: '#EFF6FF' },
    { id: '3', title: 'هشدار سیستم', text: 'لطفاً گواهی عدم سوءپیشینه خود را تمدید کنید.', time: 'دیروز', icon: 'alert-circle', color: '#EF4444', bg: '#FEF2F2' }
  ];
  return (
    <View style={s.container}>
      <View style={s.headerNav}><TouchableOpacity style={s.backBtn} onPress={() => router.back()}><MaterialCommunityIcons name="arrow-right" size={24} color="#0F172A" /></TouchableOpacity><Text style={s.headerTitle}>پیام‌ها و هشدارها</Text><View style={{ width: 24 }} /></View>
      <ScrollView contentContainerStyle={s.content}>
        {notis.map(n => (
          <Surface key={n.id} style={s.card} elevation={0}>
            <View style={[s.iconBox, {backgroundColor: n.bg}]}><MaterialCommunityIcons name={n.icon as any} size={24} color={n.color} /></View>
            <View style={s.meta}><Text style={s.title}>{n.title}</Text><Text style={s.text}>{n.text}</Text><Text style={s.time}>{n.time}</Text></View>
          </Surface>
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8FAFC' }, headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 56 : 44, paddingBottom: 20 }, backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 100 }, headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' }, content: { paddingHorizontal: 20 }, card: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 12 }, iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }, meta: { flex: 1, marginLeft: 16 }, title: { fontSize: 14, fontWeight: '800', color: '#0F172A' }, text: { fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 20 }, time: { fontSize: 11, color: '#94A3B8', marginTop: 8 } });