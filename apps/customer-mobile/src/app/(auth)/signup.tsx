import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function Signup() {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 8) {
      return Alert.alert('Check your information', 'Use your name, email, and a password of at least 8 characters.');
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } }
    });
    setLoading(false);
    if (error) return Alert.alert('Sign up failed', error.message);
    if (!data.session) Alert.alert('Check your email', 'We sent a confirmation link. Confirm your email, then sign in.');
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.top}>
          <View style={[s.mark, { backgroundColor: theme.colors.primary }]}>
            <Text style={s.markText}>QR</Text>
          </View>
          <View>
            <Text variant="titleMedium" style={s.brand}>Create your account</Text>
            <Text style={s.muted}>Get started with Quick Repair.</Text>
          </View>
        </View>
        
        <View style={s.card}>
          <View style={s.iconRow}>
            <Icon source="account-circle-outline" size={32} color={theme.colors.secondary} />
            <Text variant="headlineSmall" style={s.heading}>Your details</Text>
          </View>
          
          <View style={s.row}>
            <TextInput label="First name" mode="outlined" value={firstName} onChangeText={setFirstName} style={[s.input, s.half]} />
            <TextInput label="Last name" mode="outlined" value={lastName} onChangeText={setLastName} style={[s.input, s.half]} />
          </View>
          
          <TextInput label="Email" mode="outlined" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} style={s.input} />
          <TextInput label="Password" mode="outlined" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} style={s.input} />
          
          <Text style={s.hint}>Password must be at least 8 characters.</Text>
          
          <Button mode="contained" loading={loading} disabled={loading} onPress={submit} icon="account-plus-outline" contentStyle={s.buttonContent}>
            Create account
          </Button>
          
          <Link href="/(auth)/login" asChild>
            <Button mode="text" icon="arrow-left" style={{marginTop: 8}}>I already have an account</Button>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { flex: 1, padding: 22, justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  mark: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontWeight: '900' },
  brand: { fontWeight: '900' },
  muted: { color: '#5B6575', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 22, elevation: 2 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  heading: { fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  half: { flex: 1 },
  buttonContent: { height: 52 },
  hint: { color: "#667085", fontSize: 12, marginTop: -4, marginBottom: 10 }
});
