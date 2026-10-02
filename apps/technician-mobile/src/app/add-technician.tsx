import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { CompanyAPI } from '../lib/services/companyApi';

export default function AddTechnicianScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState('40'); // پیش‌فرض 40 درصد
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || phone.length < 10 || !commission) {
      Alert.alert('اخطار', 'تمامی فیلدها را به درستی تکمیل کنید.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('نشست نامعتبر است');

      const commRate = parseFloat(commission);
      if (commRate < 0 || commRate > 100) throw new Error('درصد کمیسیون باید بین 0 تا 100 باشد');

      await CompanyAPI.inviteTechnician(user.id, phone, firstName, lastName, commRate);
      
      Alert.alert('استخدام موفق', 'تکنسین به لیست ناوگان اضافه شد. به محض نصب اپلیکیشن و ورود با این شماره، به شرکت شما متصل می‌شود.', [
        { text: 'بازگشت به داشبورد', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('خطا', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#00E5FF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>افزودن نیروی جدید</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="shield-account-outline" size={32} color="#00E5FF" style={{ marginBottom: 12 }} />
          <Text style={s.infoText}>
            با ثبت اطلاعات تکنسین، یک دعوت‌نامه امن در سرور ایجاد می‌شود. درصد تعیین شده به صورت خودکار در تمام فاکتورهای این شخص اعمال خواهد شد.
          </Text>
        </View>

        <View style={s.formBox}>
          <View style={s.inputGroup}>
            <Text style={s.label}>نام تکنسین</Text>
            <TextInput style={s.input} placeholder="مثال: علی" placeholderTextColor="#4A5A75" value={firstName} onChangeText={setFirstName} />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>نام خانوادگی</Text>
            <TextInput style={s.input} placeholder="مثال: رضایی" placeholderTextColor="#4A5A75" value={lastName} onChangeText={setLastName} />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>شماره موبایل ورود (بدون صفر یا با صفر)</Text>
            <TextInput style={s.input} keyboardType="phone-pad" placeholder="مثال: 09123456789" placeholderTextColor="#4A5A75" value={phone} onChangeText={setPhone} />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>سهم تکنسین از دستمزدها (درصد %)</Text>
            <TextInput style={s.input} keyboardType="numeric" maxLength={3} placeholder="مثال: 40" placeholderTextColor="#4A5A75" value={commission} onChangeText={setCommission} />
          </View>

          <TouchableOpacity style={s.submitBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#121A28" /> : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color="#121A28" />
                <Text style={s.submitBtnText}>ثبت و تایید تکنسین</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121A28' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 16, backgroundColor: '#090E17', borderBottomWidth: 1, borderColor: '#1A2436' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 24 },
  infoCard: { backgroundColor: 'rgba(0, 229, 255, 0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)', marginBottom: 24 },
  infoText: { color: '#8A9BB3', fontSize: 13, lineHeight: 22, fontWeight: '500' },
  formBox: { backgroundColor: '#1A2436', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#232E42' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#8A9BB3', marginBottom: 8, marginLeft: 4 },
  input: { height: 56, backgroundColor: '#090E17', borderWidth: 1, borderColor: '#232E42', borderRadius: 16, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  submitBtn: { backgroundColor: '#00E5FF', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitBtnText: { color: '#121A28', fontSize: 15, fontWeight: '900' }
});