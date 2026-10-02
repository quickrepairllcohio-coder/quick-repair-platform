import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AddMissionScreen() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!serviceType || !location) {
      Alert.alert('اخطار سیستم', 'لطفاً نوع خدمات و آدرس منطقه را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      // دریافت آیدی مدیر فعلی برای ثبت به عنوان صادرکننده فرمان
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('خطای دسترسی', 'لطفاً مجدداً وارد سیستم شوید.');
        return;
      }

      // ارسال اطلاعات به دیتابیس
      const { error } = await supabase.from('missions').insert([
        {
          customer_id: user.id, // در اینجا شرکت (HQ) نقش صادرکننده را دارد
          service_type: serviceType,
          location_text: location,
          labor_cost: laborCost ? parseFloat(laborCost) : 0,
          status: 'searching' // وضعیت اولیه: در حال جستجوی تکنسین
        }
      ]);

      if (error) throw error;

      Alert.alert('عملیات موفق', 'ماموریت جدید با موفقیت به شبکه مخابره شد.', [
        { text: 'بازگشت به مرکز فرماندهی', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('خطای ارتباطی', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>صدور فرمان جدید</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.iconWrapper}>
          <View style={s.glowRing}>
            <MaterialCommunityIcons name="radar" size={48} color="#00E5FF" />
          </View>
          <Text style={s.subtitle}>مختصات و نوع عملیات را برای مخابره به شبکه تکنسین‌ها وارد کنید.</Text>
        </View>

        {/* فیلدهای فرم */}
        <View style={s.inputContainer}>
          <Text style={s.label}>نوع خدمات (مثال: تعمیر پکیج دیواری)</Text>
          <View style={s.inputBox}>
            <MaterialCommunityIcons name="tools" size={20} color="#00E5FF" />
            <TextInput style={s.input} placeholder="عنوان ماموریت..." placeholderTextColor="#4A5A75" value={serviceType} onChangeText={setServiceType} />
          </View>
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>مختصات / آدرس دقیق</Text>
          <View style={[s.inputBox, { height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color="#00E5FF" style={{ marginTop: 2 }} />
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="آدرس محل اعزام..." placeholderTextColor="#4A5A75" multiline value={location} onChangeText={setLocation} />
          </View>
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>دستمزد پایه (تومان) - اختیاری</Text>
          <View style={s.inputBox}>
            <MaterialCommunityIcons name="cash" size={20} color="#00E5FF" />
            <TextInput style={s.input} placeholder="مثال: 500000" placeholderTextColor="#4A5A75" keyboardType="numeric" value={laborCost} onChangeText={setLaborCost} />
          </View>
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#090E17" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#090E17" />
              <Text style={s.submitBtnText}>مخابره به شبکه</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 20, backgroundColor: '#121A28', borderBottomWidth: 1, borderColor: '#232E42' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  iconWrapper: { alignItems: 'center', marginBottom: 40 },
  glowRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0, 229, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)', marginBottom: 16 },
  subtitle: { fontSize: 13, color: '#8A9BB3', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 12, color: '#00E5FF', fontWeight: '800', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121A28', borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: '#232E42' },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginLeft: 12 },
  submitBtn: { backgroundColor: '#00E5FF', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  submitBtnText: { color: '#090E17', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});