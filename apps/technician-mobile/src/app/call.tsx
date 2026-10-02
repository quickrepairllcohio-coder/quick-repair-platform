import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SecureCallScreen() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // انیمیشن تپش سیگنال ارتباطی
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // تایمر تماس
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={s.container}>
      
      {/* هدر ارتباطی */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-down" size={28} color="#F5A623" />
        </TouchableOpacity>
        
        <View style={s.securityBadge}>
          <MaterialCommunityIcons name="lock-check" size={14} color="#10B981" />
          <Text style={s.securityText}>ENCRYPTED CHANNEL</Text>
        </View>

        <MaterialCommunityIcons name="signal" size={24} color="#F5A623" />
      </View>

      {/* اطلاعات هدف (مشتری) */}
      <View style={s.callerInfo}>
        <View style={s.avatarContainer}>
          <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Avatar.Image size={140} source={{ uri: 'https://i.pravatar.cc/150?img=32' }} style={s.avatar} />
          <View style={s.statusDotGlow} />
        </View>

        <Text style={s.targetCode}>TARGET CLIENT</Text>
        <Text style={s.callerName}>رضا محمدی</Text>
        
        <View style={s.timerBox}>
          <View style={s.liveDot} />
          <Text style={s.timerText}>{formatTime(callDuration)}</Text>
        </View>
      </View>

      {/* پنل کنترل تاکتیکی */}
      <View style={s.actionPanel}>
        
        <View style={s.toolsRow}>
          <TouchableOpacity style={s.toolBtn} onPress={() => setIsVideoOn(!isVideoOn)}>
            <View style={[s.iconBox, isVideoOn && s.iconBoxActive]}>
              <MaterialCommunityIcons name={isVideoOn ? "video" : "video-outline"} size={26} color={isVideoOn ? "#090E17" : "#8A9BB3"} />
            </View>
            <Text style={[s.toolText, isVideoOn && s.toolTextActive]}>دوربین</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.toolBtn} onPress={() => setIsMuted(!isMuted)}>
            <View style={[s.iconBox, isMuted && s.iconBoxActive]}>
              <MaterialCommunityIcons name={isMuted ? "microphone-off" : "microphone"} size={26} color={isMuted ? "#090E17" : "#8A9BB3"} />
            </View>
            <Text style={[s.toolText, isMuted && s.toolTextActive]}>بی‌صدا</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.toolBtn} onPress={() => setIsSpeakerOn(!isSpeakerOn)}>
            <View style={[s.iconBox, isSpeakerOn && s.iconBoxActive]}>
              <MaterialCommunityIcons name={isSpeakerOn ? "volume-high" : "volume-medium"} size={26} color={isSpeakerOn ? "#090E17" : "#8A9BB3"} />
            </View>
            <Text style={[s.toolText, isSpeakerOn && s.toolTextActive]}>بلندگو</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.toolBtn}>
            <View style={s.iconBox}>
              <MaterialCommunityIcons name="camera-flip-outline" size={26} color="#8A9BB3" />
            </View>
            <Text style={s.toolText}>چرخش</Text>
          </TouchableOpacity>
        </View>

        {/* دکمه قطع ارتباط (Terminate) */}
        <TouchableOpacity style={s.endCallBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFFFFF" />
          <Text style={s.endCallText}>قطع ارتباط (TERMINATE)</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#121A28', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', gap: 6 },
  securityText: { color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  callerInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 32, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: 'rgba(245, 166, 35, 0.2)' },
  avatar: { backgroundColor: '#121A28', borderWidth: 2, borderColor: '#F5A623' },
  statusDotGlow: { position: 'absolute', bottom: 10, right: 15, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#090E17', shadowColor: '#10B981', shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  
  targetCode: { fontSize: 11, color: '#8A9BB3', fontWeight: '800', letterSpacing: 3, marginBottom: 8 },
  callerName: { fontSize: 28, fontWeight: '300', color: '#FFFFFF', marginBottom: 24 },
  
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121A28', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, gap: 10, borderWidth: 1, borderColor: '#232E42' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E63946', shadowColor: '#E63946', shadowOpacity: 1, shadowRadius: 5 },
  timerText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },

  actionPanel: { backgroundColor: '#121A28', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: Platform.OS === 'ios' ? 50 : 32, borderWidth: 1, borderColor: '#232E42' },
  
  toolsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  toolBtn: { alignItems: 'center', gap: 10 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#090E17', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232E42' },
  iconBoxActive: { backgroundColor: '#F5A623', borderColor: '#F5A623', shadowColor: '#F5A623', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  toolText: { fontSize: 11, fontWeight: '700', color: '#8A9BB3' },
  toolTextActive: { color: '#F5A623' },
  
  endCallBtn: { flexDirection: 'row', height: 64, borderRadius: 20, backgroundColor: 'rgba(230, 57, 70, 0.1)', justifyContent: 'center', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.4)' },
  endCallText: { color: '#E63946', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});