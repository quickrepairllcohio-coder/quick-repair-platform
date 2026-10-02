import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function EmergencyScreen() {
  const router = useRouter();

  const handleCall = () => {
    const phoneNumber = 'tel:+12343778972';
    Linking.canOpenURL(phoneNumber).then(supported => {
      if (supported) {
        Linking.openURL(phoneNumber);
      } else {
        Alert.alert("خطا", "امکان تماس روی این دستگاه وجود ندارد.");
      }
    });
  };

  const handleEmail = () => {
    const email = 'mailto:info@quickrepairs-llc.com?subject=Emergency%20Request';
    Linking.canOpenURL(email).then(supported => {
      if (supported) {
        Linking.openURL(email);
      } else {
        Alert.alert("خطا", "امکان ارسال ایمیل روی این دستگاه وجود ندارد.");
      }
    });
  };

  return (
    <View style={s.container}>
      <Text variant="headlineLarge" style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: 20 }}>
        Emergency Request
      </Text>
      
      <Text style={{ textAlign: 'center', marginBottom: 15, fontSize: 16 }}>
        If there is immediate danger to life, fire, gas, carbon monoxide, or serious electrical danger, contact the appropriate emergency service first.
      </Text>
      
      <Text style={{ textAlign: 'center', marginBottom: 30, fontSize: 16 }}>
        Quick Repair will collect the incident details for dispatch when it is safe to do so.
      </Text>

      <Button icon="phone" mode="contained" buttonColor="#d32f2f" onPress={handleCall} style={s.button}>
        Call Emergency (+1 234 377 8972)
      </Button>

      <Button icon="email" mode="contained" buttonColor="#1976d2" onPress={handleEmail} style={s.button}>
        Email Support (info@quickrepairs-llc.com)
      </Button>

      <Button mode="outlined" onPress={() => router.back()} style={[s.button, { marginTop: 20 }]}>
        Back to Home
      </Button>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  button: { width: '100%', marginVertical: 8, paddingVertical: 5 }
});
