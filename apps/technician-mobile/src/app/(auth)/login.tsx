import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('خطای ورود', 'ایمیل یا رمز عبور اشتباه است.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ورود به سیستم</Text>
        <Text style={styles.subtitle}>دسترسی امن تکنسین و شرکت</Text>

        <TextInput
          style={styles.input}
          placeholder="ایمیل سازمانی"
          placeholderTextColor="#8A9BB3"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="رمز عبور"
          placeholderTextColor="#8A9BB3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#090E17" /> : <Text style={styles.buttonText}>ورود به حساب کاربری</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17', justifyContent: 'center' },
  content: { paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8A9BB3', marginBottom: 40, textAlign: 'center' },
  input: { backgroundColor: '#121A28', color: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A3B55' },
  button: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#090E17', fontSize: 16, fontWeight: 'bold' }
});