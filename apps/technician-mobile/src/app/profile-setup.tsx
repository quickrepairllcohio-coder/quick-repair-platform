import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ProfileAPI } from '../lib/services/profileApi';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('customer');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [documentsUrl, setDocumentsUrl] = useState(''); // فیلد جدید مدارک

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      
      const profile = await ProfileAPI.getProfile(user.id);
      if (profile) {
        setRole(profile.role);
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setCompanyName(profile.company_name || '');
        setDocumentsUrl(profile.documents_url || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMockUpload = () => {
    // شبیه‌سازی آپلود فایل - در آینده با Expo DocumentPicker متصل می‌شود
    Alert.alert('مدارک', 'مدرک با موفقیت اسکن و در فضای ابری ذخیره شد.');
    setDocumentsUrl('https://storage.supabase.co/mock-doc-url.pdf');
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert('اخطار', 'نام و نام خانوادگی الزامی است.');
      return;
    }

    setSaving(true);
    try {
      const updates: any = { first_name: firstName, last_name: lastName, documents_url: documentsUrl };
      if (role === 'company_hq') updates.company_name = companyName;

      await ProfileAPI.updateProfile(userId, updates);
      
      if (role === 'customer') router.replace('/customer-demo');
      else if (role === 'company_hq') router.replace('/company-dashboard');
      else router.replace('/');
      
    } catch (error: any) {
      Alert.alert('خطا', error.message);
    } finally {
      setSaving(false);
    }
  };

  const isCustomer = role === 'customer';
  const isCompany = role === 'company_hq';
  const theme = {
    bg: isCustomer ? '#F8FAFC' : isCompany ? '#121A28' : '#090E17',
    card: isCustomer ? '#FFFFFF' : isCompany ? '#1A2436' : '#121A28',
    text: isCustomer ? '#0F172A' : '#FFFFFF',
    subText: isCustomer ? '#64748B' : '#8A9BB3',
    accent: isCustomer ? '#10B981' : isCompany ? '#00E5FF' : '#F5A623',
    border: isCustomer ? '#E2E8F0' : '#232E42'
  };

  if (loading) return <View style={[s.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <MaterialCommunityIcons name={isCustomer ? "account-heart" : isCompany ? "domain" : "account-hard-hat"} size={48} color={theme.accent} />
          <Text style={[s.title, { color: theme.text }]}>تکمیل حساب کاربری</Text>
        </View>

        <View style={[s.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: theme.subText }]}>نام</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.subText} value={firstName} onChangeText={setFirstName} />
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: theme.subText }]}>نام خانوادگی</Text>
            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.subText} value={lastName} onChangeText={setLastName} />
          </View>

          {isCompany && (
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: theme.subText }]}>نام حقوقی شرکت</Text>
              <TextInput style={[s.input, { color: theme.text, borderColor: theme.border }]} placeholderTextColor={theme.subText} value={companyName} onChangeText={setCompanyName} />
            </View>
          )}

          {/* بخش آپلود مدارک برای تکنسین و شرکت */}
          {!isCustomer && (
            <View style={s.uploadSection}>
              <Text style={[s.label, { color: theme.subText }]}>مدارک تایید هویت (جواز کسب / کارت ملی)</Text>
              <TouchableOpacity style={[s.uploadBtn, { borderColor: theme.border, backgroundColor: theme.bg }]} onPress={handleMockUpload}>
                <MaterialCommunityIcons name={documentsUrl ? "check-circle" : "cloud-upload"} size={24} color={documentsUrl ? "#10B981" : theme.accent} />
                <Text style={[s.uploadText, { color: documentsUrl ? "#10B981" : theme.subText }]}>
                  {documentsUrl ? 'مدارک با موفقیت بارگذاری شد' : 'لمس کنید تا فایل مدارک آپلود شود'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[s.submitBtn, { backgroundColor: theme.accent }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={isCustomer ? '#FFFFFF' : '#090E17'} /> : (
              <Text style={[s.submitBtnText, { color: isCustomer ? '#FFFFFF' : '#090E17' }]}>ذخیره و ورود به سیستم</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingTop: Platform.OS === 'android' ? 80 : 100 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 22, fontWeight: '900', marginTop: 16 },
  formCard: { padding: 24, borderRadius: 24, borderWidth: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { height: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, fontWeight: '600' },
  uploadSection: { marginBottom: 24 },
  uploadBtn: { height: 64, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadText: { fontSize: 13, fontWeight: '600' },
  submitBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitBtnText: { fontSize: 15, fontWeight: '900' }
});