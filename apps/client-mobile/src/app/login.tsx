import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ClientAuthScreen() {
const [isSignUp, setIsSignUp] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [fullName, setFullName] = useState('');
const [loading, setLoading] = useState(false);

const handleAuth = async () => {
if (!email || !password) {
  Alert.alert('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید.');
  return;
}

setLoading(true);

if (isSignUp) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'customer'
      }
    }
  });

  setLoading(false);

  if (error) {
    Alert.alert('خطا در ثبت‌نام', error.message);
  } else {
    Alert.alert('ثبت‌نام موفق', 'حساب مشتری با موفقیت ساخته شد.');
  }
} else {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    Alert.alert('خطا در ورود', error.message);
  } else {
    Alert.alert('ورود موفق', 'به سامانه مشتریان خوش آمدید.');
  }
}
};

return (
<View style={styles.container}>
  <Text style={styles.title}>{isSignUp ? 'ثبت‌نام مشتری جدید' : 'ورود مشتریان'}</Text>
  
  <View style={styles.tabContainer}>
    <TouchableOpacity 
      style={[styles.tab, !isSignUp && styles.activeTab]} 
      onPress={() => setIsSignUp(false)}
    >
      <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>ورود</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.tab, isSignUp && styles.activeTab]} 
      onPress={() => setIsSignUp(true)}
    >
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

  <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
    {loading ? (
      <ActivityIndicator color="#0F172A" />
    ) : (
      <Text style={styles.buttonText}>{isSignUp ? 'ایجاد حساب مشتری' : 'ورود به اپلیکیشن'}</Text>
    )}
  </TouchableOpacity>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 20 },
tabContainer: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, backgroundColor: '#1E293B', padding: 4 },
tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
activeTab: { backgroundColor: '#38BDF8' },
tabText: { color: '#94A3B8', fontWeight: 'bold' },
activeTabText: { color: '#0F172A' },
input: { backgroundColor: '#1E293B', color: '#F8FAFC', padding: 14, borderRadius: 8, marginBottom: 12, textAlign: 'right' },
button: { backgroundColor: '#38BDF8', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
buttonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 }
});