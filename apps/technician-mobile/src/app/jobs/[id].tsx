import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform, TextInput, Animated, KeyboardAvoidingView } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MissionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // دریافت شناسه ماموریت از رادار
  
  const [step, setStep] = useState<'briefing' | 'invoice'>('briefing');
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('850000'); // اجرت پایه
  const [isTransmitting, setIsTransmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const invoiceAnim = useRef(new Animated.Value(0)).current;

  const formatNumber = (num: string) => {
    return num.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const totalAmount = (parseInt(partsCost.replace(/,/g, '') || '0') + parseInt(laborCost.replace(/,/g, '') || '0')).toLocaleString();

  const handleEndMission = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setStep('invoice');
      Animated.timing(invoiceAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  };

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      // در دنیای واقعی: اینجا به مشتری سیگنال ارسال می‌شود تا صفحه ستاره‌ها برایش باز شود
      router.replace('/'); // بازگشت به داشبورد فرماندهی
    }, 2000);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      
      {/* هدر عملیاتی */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => step === 'invoice' ? setStep('briefing') : router.back()}>
          <MaterialCommunityIcons name={step === 'invoice' ? "arrow-right" : "chevron-right"} size={28} color="#F5A623" />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.systemText}>{step === 'briefing' ? 'ACTIVE MISSION' : 'FINANCIAL TERMINAL'}</Text>
          <Text style={s.title}>MISSION #{id || '102'}-ALPHA</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {step === 'briefing' && (
          <Animated.View style={{ opacity: fadeAnim }}>
            
            {/* کارت هدف (Target Briefing) */}
            <View style={s.targetCard}>
              <View style={s.targetHeader}>
                <View style={s.statusBadge}>
                  <View style={s.statusDotGlow} />
                  <Text style={s.statusText}>در حال اعزام</Text>
                </View>
                <Text style={s.etaText}>وصول: T-12m</Text>
              </View>

              <Text style={s.targetTitle}>نشتی شدید لوله آب</Text>
              
              <View style={s.locationBox}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#8A9BB3" />
                <Text style={s.locationText}>بلوار اندرزگو، خیابان سلیمانی، برج افق، واحد ۴۲</Text>
              </View>

              <View style={s.clientRow}>
                <Avatar.Image size={40} source={{ uri: 'https://i.pravatar.cc/150?img=32' }} style={s.clientAvatar} />
                <View style={s.clientInfo}>
                  <Text style={s.clientName}>رضا م. (مشتری VIP)</Text>
                  <Text style={s.clientHistory}>۵ ماموریت موفق قبلی</Text>
                </View>
              </View>
            </View>

            {/* ابزارهای تاکتیکی (Tactical Tools) */}
            <Text style={s.sectionTitle}>ابزارهای تاکتیکی</Text>
            <View style={s.toolsGrid}>
              <TouchableOpacity style={s.toolBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="navigation-variant" size={28} color="#F5A623" />
                <Text style={s.toolText}>مسیریابی (Radar)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.toolBtn} onPress={() => router.push('/call')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="phone-lock" size={28} color="#F5A623" />
                <Text style={s.toolText}>ارتباط امن (Comms)</Text>
              </TouchableOpacity>
            </View>

            {/* دکمه پایان عملیات */}
            <TouchableOpacity style={s.endMissionBtn} onPress={handleEndMission} activeOpacity={0.8}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#090E17" />
              <Text style={s.endMissionText}>پایان عملیات و صدور فاکتور</Text>
            </TouchableOpacity>

          </Animated.View>
        )}

        {step === 'invoice' && (
          <Animated.View style={{ opacity: invoiceAnim }}>
            
            <View style={s.invoiceCard}>
              <View style={s.invoiceHeader}>
                <MaterialCommunityIcons name="receipt-text-outline" size={24} color="#F5A623" />
                <Text style={s.invoiceTitle}>ترمینال صدور فاکتور</Text>
              </View>

              {/* ورودی هزینه‌ها */}
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>هزینه قطعات مصرفی (تومان)</Text>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={s.invoiceInput}
                    placeholder="0"
                    placeholderTextColor="#4A5A75"
                    keyboardType="number-pad"
                    value={formatNumber(partsCost)}
                    onChangeText={(val) => setPartsCost(val)}
                  />
                  <MaterialCommunityIcons name="cog-outline" size={20} color="#4A5A75" />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>اجرت عملیات (تومان)</Text>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={s.invoiceInput}
                    placeholder="0"
                    placeholderTextColor="#4A5A75"
                    keyboardType="number-pad"
                    value={formatNumber(laborCost)}
                    onChangeText={(val) => setLaborCost(val)}
                  />
                  <MaterialCommunityIcons name="wrench-outline" size={20} color="#4A5A75" />
                </View>
              </View>

              <View style={s.divider} />

              {/* جمع کل */}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>مبلغ نهایی قابل پرداخت:</Text>
                <Text style={s.totalValue}>{totalAmount} <Text style={s.totalCurrency}>T</Text></Text>
              </View>
            </View>

            <View style={s.transmitBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#8A9BB3" />
              <Text style={s.transmitInfo}>با تایید شما، فاکتور رمزنگاری شده مستقیماً به پنل مشتری ارسال می‌گردد.</Text>
            </View>

            <TouchableOpacity 
              style={[s.transmitBtn, isTransmitting && s.transmitBtnActive]} 
              onPress={handleTransmit} 
              disabled={isTransmitting}
            >
              <MaterialCommunityIcons name={isTransmitting ? "satellite-uplink" : "send-lock"} size={24} color="#090E17" />
              <Text style={s.transmitText}>{isTransmitting ? 'در حال ارسال سیگنال...' : 'ارسال فاکتور به مشتری'}</Text>
            </TouchableOpacity>

          </Animated.View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#121A28', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  headerTitleBox: { alignItems: 'center' },
  systemText: { fontSize: 10, color: '#F5A623', fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },

  content: { padding: 24, paddingBottom: 40 },

  /* استایل‌های بریفینگ */
  targetCard: { backgroundColor: '#121A28', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#232E42', marginBottom: 32 },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245, 166, 35, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.3)' },
  statusDotGlow: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5A623', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
  statusText: { fontSize: 12, color: '#F5A623', fontWeight: '700' },
  etaText: { fontSize: 13, color: '#8A9BB3', fontWeight: '700', letterSpacing: 1 },
  
  targetTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#090E17', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#232E42', marginBottom: 24 },
  locationText: { flex: 1, fontSize: 13, color: '#8A9BB3', lineHeight: 20 },
  
  clientRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#232E42', paddingTop: 20 },
  clientAvatar: { backgroundColor: '#232E42' },
  clientInfo: { marginLeft: 12 },
  clientName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  clientHistory: { fontSize: 11, color: '#F5A623', fontWeight: '600' },

  sectionTitle: { fontSize: 13, color: '#4A5A75', fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  toolsGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  toolBtn: { flex: 1, backgroundColor: '#121A28', paddingVertical: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  toolText: { fontSize: 12, color: '#8A9BB3', fontWeight: '700', marginTop: 12 },

  endMissionBtn: { backgroundColor: '#F5A623', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  endMissionText: { color: '#090E17', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  /* استایل‌های فاکتور */
  invoiceCard: { backgroundColor: '#121A28', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.4)', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, marginBottom: 24 },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: '#232E42', paddingBottom: 20, marginBottom: 24 },
  invoiceTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, color: '#8A9BB3', fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#090E17', borderWidth: 1, borderColor: '#232E42', borderRadius: 16, paddingHorizontal: 16, height: 60 },
  invoiceInput: { flex: 1, fontSize: 20, color: '#FFFFFF', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  divider: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#232E42', marginVertical: 24, borderRadius: 1 },
  
  totalRow: { alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#8A9BB3', fontWeight: '600', marginBottom: 8 },
  totalValue: { fontSize: 36, fontWeight: '900', color: '#F5A623', letterSpacing: 1 },
  totalCurrency: { fontSize: 18, color: '#F5A623', fontWeight: '600' },

  transmitBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245, 166, 35, 0.05)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.1)' },
  transmitInfo: { flex: 1, fontSize: 11, color: '#8A9BB3', lineHeight: 18 },

  transmitBtn: { backgroundColor: '#F5A623', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  transmitBtnActive: { opacity: 0.8 },
  transmitText: { color: '#090E17', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});