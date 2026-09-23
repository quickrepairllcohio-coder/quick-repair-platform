import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ClientMainApp() {
const [session, setSession] = useState<any>(null);
const [loading, setLoading] = useState(true);

// حالت‌های Auth
const [isSignUp, setIsSignUp] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [fullName, setFullName] = useState('');
const [authLoading, setAuthLoading] = useState(false);

// بررسی نشست فعال کاربر
useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
  setLoading(false);
});

const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
});

return () => subscription.unsubscribe();
}, []);

// ورود / ثبت‌نام
const handleAuth = async () => {
if (!email || !password) {
  Alert.alert('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید.');
  return;
}

setAuthLoading(true);

if (isSignUp) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'customer' } }
  });
  setAuthLoading(false);
  if (error) Alert.alert('خطا در ثبت‌نام', error.message);
  else Alert.alert('ثبت‌نام موفق', 'حساب مشتری شما ساخته شد.');
} else {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setAuthLoading(false);
  if (error) Alert.alert('خطا در ورود', error.message);
}
};

// خروج از حساب کاربری (Logout)
const handleLogout = async () => {
Alert.alert(
  'خروج از حساب',
  'آیا از خروج از حساب کاربری اطمینان دارید؟',
  [
    { text: 'انصراف', style: 'cancel' },
    { 
      text: 'خروج', 
      style: 'destructive', 
      onPress: async () => {
        await supabase.auth.signOut();
        setSession(null);
      } 
    }
  ]
);
};

if (loading) {
return (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#38BDF8" />
  </View>
);
}

// اگر کاربر لاگین نکرده باشد -> فرم لاگین / ساین‌آپ
if (!session) {
return (
  <View style={styles.container}>
    <Text style={styles.title}>{isSignUp ? 'ثبت‌نام مشتری جدید' : 'ورود به سامانه مشتریان'}</Text>
    
    <View style={styles.tabContainer}>
      <TouchableOpacity style={[styles.tab, !isSignUp && styles.activeTab]} onPress={() => setIsSignUp(false)}>
        <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>ورود</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, isSignUp && styles.activeTab]} onPress={() => setIsSignUp(true)}>
        <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>ثبت‌نام</Text>
      </TouchableOpacity>
    </View>

    {isSignUp && (
      <TextInput
        style={styles.input}
        placeholder="نام و نام خانوادگی"
        placeholderTextColor="#94A3B8"
        value={fullName}
        onChangeText={setFullName}
      />
    )}

    <TextInput
      style={styles.input}
      placeholder="ایمیل"
      placeholderTextColor="#94A3B8"
      keyboardType="email-address"
      autoCapitalize="none"
      value={email}
      onChangeText={setEmail}
    />

    <TextInput
      style={styles.input}
      placeholder="رمز عبور"
      placeholderTextColor="#94A3B8"
      secureTextEntry
      value={password}
      onChangeText={setPassword}
    />

    <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={authLoading}>
      {authLoading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.buttonText}>{isSignUp ? 'ثبت‌نام' : 'ورود'}</Text>}
    </TouchableOpacity>
  </View>
);
}

// اگر کاربر لاگین کرده باشد -> داشبورد اصلی خدمات + دکمه خروج
return (
<ScrollView style={styles.dashboardContainer}>
  <View style={styles.header}>
    <View>
      <Text style={styles.welcomeText}>خوش آمدید</Text>
      <Text style={styles.userEmail}>{session.user.email}</Text>
    </View>
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutText}>خروج از حساب</Text>
    </TouchableOpacity>
  </View>

  <Text style={styles.sectionTitle}>انتخاب خدمت مورد نیاز</Text>

  <View style={styles.grid}>
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>⚡ برق‌کاری</Text>
      <Text style={styles.cardSub}>رفع اتصالی، سیم‌کشی</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>🔧 لوله‌کشی</Text>
      <Text style={styles.cardSub}>ترکیدگی، نشت‌یابی</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitle}>❄️ سرمایشی و گرمایشی</Text>
      <Text style={styles.cardSub}>کولر، پکیج، شوفاژ</Text>
    </TouchableOpacity>
  </View>
</ScrollView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
centerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
dashboardContainer: { flex: 1, backgroundColor: '#0F172A', padding: 20, paddingTop: 50 },
title: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 20 },
tabContainer: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, backgroundColor: '#1E293B', padding: 4 },
tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
activeTab: { backgroundColor: '#38BDF8' },
tabText: { color: '#94A3B8', fontWeight: 'bold' },
activeTabText: { color: '#0F172A' },
input: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 14, borderRadius: 8, marginBottom: 12, textAlign: 'right' },
button: { backgroundColor: '#38BDF8', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
buttonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
welcomeText: { color: '#94A3B8', fontSize: 14, textAlign: 'right' },
userEmail: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
logoutButton: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
logoutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
grid: { gap: 12 },
card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#38BDF8' },
cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
cardSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, textAlign: 'right' }
});