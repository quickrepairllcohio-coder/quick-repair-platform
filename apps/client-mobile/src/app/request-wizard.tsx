import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function CustomerRequestWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // فرم ثبت درخواست
  const [serviceType, setServiceType] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmitRequest = async () => {
    if (!serviceType || !address) {
      Alert.alert('خطا', 'لطفاً نوع خدمت و آدرس را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('خطای احراز هویت', 'لطفاً ابتدا وارد حساب کاربری خود شوید.');
        setLoading(false);
        return;
      }

      // ثبت درخواست در جدول مرجع jobs با وضعیت اولیه submitted
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          customer_id: user.id,
          status: 'submitted',
          metadata: {
            service_type: serviceType,
            address: address,
            description: description,
            created_via: 'client_mobile_wizard'
          }
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('موفقیت', 'درخواست شما با موفقیت ثبت شد و در حال بررسی توسط کارشناسان است.');
      // ریست فرم
      setServiceType('');
      setAddress('');
      setDescription('');
      setStep(1);

    } catch (error: any) {
      console.error('Error submitting request:', error);
      Alert.alert('خطا در ثبت درخواست', error.message || 'ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>ثبت درخواست خدمت (فاز ۱۳)</Text>
        <Text style={s.headerSub}>مرحله {step} از ۲</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {step === 1 ? (
          <View>
            <Text style={s.label}>نوع سرویس درخواستی:</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: تعمیر پکیج، برق‌کاری، لوله‌کشی"
              placeholderTextColor="#64748B"
              value={serviceType}
              onChangeText={setServiceType}
            />

            <Text style={s.label}>آدرس دقیق محل خدمت:</Text>
            <TextInput
              style={[s.input, { height: 80 }]}
              placeholder="خیابان، پلاک، واحد..."
              placeholderTextColor="#64748B"
              multiline
              value={address}
              onChangeText={setAddress}
            />

            <TouchableOpacity style={s.btnPrimary} onPress={() => setStep(2)}>
              <Text style={s.btnText}>مرحله بعد</Text>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={s.label}>توضیحات تکمیلی (اختیاری):</Text>
            <TextInput
              style={[s.input, { height: 100 }]}
              placeholder="جزئیات مشکل یا زمان پیشنهادی..."
              placeholderTextColor="#64748B"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={s.rowBtns}>
              <TouchableOpacity style={s.btnSecondary} onPress={() => setStep(1)} disabled={loading}>
                <Text style={s.btnTextSecondary}>قبلی</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnSuccess} onPress={handleSubmitRequest} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.btnText}>ثبت نهایی درخواست</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  headerSub: { fontSize: 12, color: '#38BDF8', marginTop: 4 },
  content: { padding: 20 },
  label: { fontSize: 14, color: '#E2E8F0', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#334155', textAlignVertical: 'top' },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#38BDF8', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSuccess: { flex: 2, backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSecondary: { flex: 1, backgroundColor: '#334155', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#0F172A', fontWeight: 'bold', fontSize: 15 },
  btnTextSecondary: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 15 },
  rowBtns: { flexDirection: 'row', gap: 12, marginTop: 10 }
});