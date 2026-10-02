import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, Easing, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function RadarScreen() {
  const router = useRouter();
  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  // انیمیشن چرخش رادار و تپش سیگنال‌ها
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0]
  });

  // دیتای شبیه‌سازی شده برای سیگنال‌ها (سفارشات اطراف)
  const signals = [
    { id: 1, top: '30%', left: '20%', code: 'MISSION #102', target: 'نشتی لوله آب', distance: '۱.۲ کیلومتر', reward: '۸۵۰,۰۰۰' },
    { id: 2, top: '60%', left: '70%', code: 'MISSION #103', target: 'اتصالی برق', distance: '۳.۵ کیلومتر', reward: '۱,۲۰۰,۰۰۰' },
    { id: 3, top: '40%', left: '60%', code: 'MISSION #104', target: 'سرویس کولر گازی', distance: '۰.۸ کیلومتر', reward: '۹۵۰,۰۰۰' },
  ];

  return (
    <View style={s.container}>
      
      {/* هدر رادار */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-right" size={32} color="#F5A623" />
        </TouchableOpacity>
        <View style={s.headerTitleBox}>
          <Text style={s.systemText}>SYSTEM ACTIVE</Text>
          <Text style={s.title}>رادار سیگنال منطقه‌ای</Text>
        </View>
        <View style={s.statusDot} />
      </View>

      {/* محیط رادار */}
      <View style={s.radarContainer}>
        {/* دایره‌های پس‌زمینه رادار */}
        <View style={s.radarCircle1} />
        <View style={s.radarCircle2} />
        <View style={s.radarCircle3} />
        
        {/* خط چرخان رادار */}
        <Animated.View style={[s.radarSweep, { transform: [{ rotate: spin }] }]}>
          <View style={s.sweepLine} />
          <View style={s.sweepGradient} />
        </Animated.View>

        {/* سیگنال‌ها (نقاط روی نقشه) */}
        {signals.map((sig) => (
          <TouchableOpacity 
            key={sig.id} 
            style={[s.signalWrapper, { top: sig.top, left: sig.left }]}
            onPress={() => setSelectedSignal(sig)}
            activeOpacity={0.8}
          >
            <Animated.View style={[s.signalPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <View style={[s.signalDot, selectedSignal?.id === sig.id && s.signalDotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* پنل اطلاعات سیگنال انتخاب شده (Bottom Sheet) */}
      <View style={s.bottomPanel}>
        {selectedSignal ? (
          <View style={s.missionCard}>
            <View style={s.missionHeader}>
              <View style={s.missionBadge}>
                <MaterialCommunityIcons name="satellite-uplink" size={16} color="#F5A623" />
                <Text style={s.missionBadgeText}>سیگنال دریافت شد</Text>
              </View>
              <Text style={s.missionCode}>{selectedSignal.code}</Text>
            </View>

            <View style={s.missionDetails}>
              <View>
                <Text style={s.missionTarget}>{selectedSignal.target}</Text>
                <Text style={s.missionDistance}>فاصله از شما: {selectedSignal.distance}</Text>
              </View>
              <View style={s.rewardBox}>
                <Text style={s.rewardLabel}>پاداش (تومان)</Text>
                <Text style={s.rewardValue}>{selectedSignal.reward}</Text>
              </View>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.ignoreBtn} onPress={() => setSelectedSignal(null)}>
                <Text style={s.ignoreText}>نادیده گرفتن</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.acceptBtn} onPress={() => router.push('/jobs/102')}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#090E17" />
                <Text style={s.acceptText}>پذیرش ماموریت</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.scanningBox}>
            <MaterialCommunityIcons name="radar" size={32} color="#4A5A75" />
            <Text style={s.scanningText}>در حال اسکن محیط...</Text>
            <Text style={s.scanningSub}>برای مشاهده جزئیات، روی سیگنال‌های یافت شده کلیک کنید.</Text>
          </View>
        )}
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 20, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#121A28', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  headerTitleBox: { alignItems: 'center' },
  systemText: { fontSize: 10, color: '#F5A623', fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F5A623', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },

  radarContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', marginTop: -50 },
  radarCircle1: { position: 'absolute', width: width * 0.9, height: width * 0.9, borderRadius: width, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.1)' },
  radarCircle2: { position: 'absolute', width: width * 0.6, height: width * 0.6, borderRadius: width, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.2)' },
  radarCircle3: { position: 'absolute', width: width * 0.3, height: width * 0.3, borderRadius: width, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.4)' },
  
  radarSweep: { position: 'absolute', width: width * 0.9, height: width * 0.9, borderRadius: width, alignItems: 'center' },
  sweepLine: { width: 2, height: '50%', backgroundColor: '#F5A623', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  sweepGradient: { position: 'absolute', top: 0, left: '50%', width: '50%', height: '50%', backgroundColor: 'rgba(245, 166, 35, 0.05)', borderTopRightRadius: width },

  signalWrapper: { position: 'absolute', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  signalPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245, 166, 35, 0.4)' },
  signalDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F5A623' },
  signalDotActive: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 10 },

  bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, zIndex: 10 },
  
  scanningBox: { backgroundColor: '#121A28', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  scanningText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', marginTop: 12, marginBottom: 8 },
  scanningSub: { fontSize: 12, color: '#4A5A75', textAlign: 'center' },

  missionCard: { backgroundColor: '#121A28', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F5A623', shadowColor: '#F5A623', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  missionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 166, 35, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  missionBadgeText: { fontSize: 12, color: '#F5A623', fontWeight: '700' },
  missionCode: { fontSize: 11, color: '#8A9BB3', fontWeight: '800', letterSpacing: 1 },
  
  missionDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  missionTarget: { fontSize: 20, color: '#FFFFFF', fontWeight: '800', marginBottom: 6 },
  missionDistance: { fontSize: 13, color: '#8A9BB3', fontWeight: '500' },
  rewardBox: { alignItems: 'flex-end' },
  rewardLabel: { fontSize: 10, color: '#F5A623', fontWeight: '700', marginBottom: 4 },
  rewardValue: { fontSize: 22, color: '#FFFFFF', fontWeight: '900' },

  actionRow: { flexDirection: 'row', gap: 12 },
  ignoreBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090E17', borderWidth: 1, borderColor: '#232E42' },
  ignoreText: { color: '#8A9BB3', fontSize: 14, fontWeight: '700' },
  acceptBtn: { flex: 2, height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#F5A623', shadowColor: '#F5A623', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  acceptText: { color: '#090E17', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});