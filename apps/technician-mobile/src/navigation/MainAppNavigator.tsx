import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// وارد کردن صفحات اصلی پیاده‌سازی شده در فازها
import WalletScreen from '../app/wallet';

// کامپوننت صفحه نمونه برای چت و نقشه (قابل گسترش)
import { View, Text, StyleSheet } from 'react-native';

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainAppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#F8FAFC',
          tabBarStyle: { backgroundColor: '#1E293B', borderTopColor: '#334155', height: 60, paddingBottom: 8 },
          tabBarActiveTintColor: '#38BDF8',
          tabBarInactiveTintColor: '#64748B',
        }}
      >
        <Tab.Screen 
          name="Jobs" 
          children={() => <PlaceholderScreen title="صفحه لیست کارهای ارجاع شده (فاز ۱۱)" />}
          options={{
            title: 'سفارش‌ها',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="briefcase-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="WalletTab" 
          component={WalletScreen} 
          options={{
            title: 'کیف پول (فاز ۱۸)',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="wallet-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="LocationTab" 
          children={() => <PlaceholderScreen title="موقعیت مکانی زنده (فاز ۱۲)" />}
          options={{
            title: 'نقشه و موقعیت',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="map-marker-outline" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#F8FAFC', fontSize: 16 }
});