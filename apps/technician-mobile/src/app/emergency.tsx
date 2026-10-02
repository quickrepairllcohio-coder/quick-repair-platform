import React from 'react';
import { StyleSheet, ScrollView, Linking, View } from 'react-native';
import { Card, Title, Paragraph, Button, List, Divider } from 'react-native-paper';

export default function EmergencyScreen() {
  const handleCall = () => {
    Linking.openURL('tel:09123456789');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:emergency@quickrepair.com');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Card style={s.card} mode="outlined">
        <Card.Content>
          <Title style={s.title}>Emergency Request</Title>
          <Paragraph style={s.warningText}>
            If there is immediate danger to life, fire, gas, carbon monoxide, or serious electrical danger, contact the appropriate emergency service first.
          </Paragraph>
          <Paragraph style={s.subText}>
            Quick Repair will collect the incident details for dispatch when it is safe to do so.
          </Paragraph>
        </Card.Content>

        <Divider style={s.divider} />

        <View style={s.contactSection}>
          <List.Item
            title="Emergency Phone Line"
            description="09123456789"
            left={(props) => <List.Icon {...props} icon="phone-alert" color="#d32f2f" />}
          />
          <Button 
            mode="contained" 
            buttonColor="#d32f2f" 
            icon="phone" 
            onPress={handleCall}
            style={s.button}
          >
            Call Emergency Hotline
          </Button>

          <Divider style={s.divider} />

          <List.Item
            title="Emergency Email Support"
            description="emergency@quickrepair.com"
            left={(props) => <List.Icon {...props} icon="email-alert" color="#1976d2" />}
          />
          <Button 
            mode="outlined" 
            icon="email" 
            onPress={handleEmail}
            style={s.button}
          >
            Send Email Notice
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16, paddingTop: 40 },
  card: { borderRadius: 12, backgroundColor: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  warningText: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 12 },
  subText: { fontSize: 14, color: '#666', lineHeight: 20 },
  divider: { my: 16, marginVertical: 12 },
  contactSection: { paddingHorizontal: 8, paddingBottom: 16 },
  button: { marginTop: 8, marginHorizontal: 8 }
});