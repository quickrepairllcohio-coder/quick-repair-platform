import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrderStore } from '../store/useOrderStore';
import { Alert } from 'react-native';

export default function OrderWizardScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [problemText, setProblemText] = useState('');
  const [timing, setTiming] = useState('immediate');
  const publishOrder = useOrderStore((state: any) => state.publishOrder);

  const nextStep = () => { if (step < 3) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); else router.back(); };

  const handleSubmit = () => {
    publishOrder({
      id: Math.floor(Math.random() * 10000),
      service: 'تعمیر لوازم خانگی',
      problem: problemText || 'مشکل ثبت نشده',
      timing: timing,
      price: 95000,
      distance: '۲.۵ کیلومتر'
    });
    Alert.alert('موفقیت!', 'سفارش شما در شبکه ثبت شد و در حال جستجوی نزدیک‌ترین تکنسین هستیم.');
    router.push('/customer-demo');
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={prevStep}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>ثبت درخواست جدید</Text>
        <View style={{ width: 40 }} />
      </View>
      <ProgressBar progress={step / 3} color="#2563EB" style={s.progressBar} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={s.stepContainer}>
            <Text style={s.stepTitle}>دقیقاً چه مشکلی پیش آمده؟</Text>
            <Text style={s.stepSub}>متخصصین ما با اطلاعات دقیق‌تر، سریع‌تر مشکل را حل می‌کنند.</Text>
            <TextInput style={s.textArea} placeholder="مثال: ماشین لباسشویی روشن می‌شود اما..." placeholderTextColor="#94A3B8" multiline numberOfLines={4} textAlignVertical="top" value={problemText} onChangeText={setProblemText} />
            <View style={s.attachmentRow}>
              <TouchableOpacity style={s.attachBtn}><MaterialCommunityIcons name="camera-outline" size={24} color="#2563EB" /><Text style={s.attachText}>افزودن عکس</Text></TouchableOpacity>
              <TouchableOpacity style={s.attachVoiceBtn}><MaterialCommunityIcons name="microphone" size={24} color="#EF4444" /></TouchableOpacity>
            </View>
          </View>
        )}
        {step === 2 && (
          <View style={s.stepContainer}>
            <Text style={s.stepTitle}>چه زمانی تکنسین اعزام شود؟</Text>
            <View style={s.timingOptions}>
              <TouchableOpacity style={[s.timingBox, timing === 'immediate' && s.timingBoxActive]} onPress={() => setTiming('immediate')}>
                <MaterialCommunityIcons name="rocket-launch-outline" size={28} color={timing === 'immediate' ? '#2563EB' : '#64748B'} />
                <Text style={[s.timingText, timing === 'immediate' && s.timingTextActive]}>همین الان (فوری)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.timingBox, timing === 'scheduled' && s.timingBoxActive]} onPress={() => setTiming('scheduled')}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={28} color={timing === 'scheduled' ? '#2563EB' : '#64748B'} />
                <Text style={[s.timingText, timing === 'scheduled' && s.timingTextActive]}>زمان‌بندی شده</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {step === 3 && (
          <View style={s.stepContainer}>
            <Text style={s.stepTitle}>بررسی و تایید نهایی</Text>
            <Surface style={s.summaryCard} elevation={0}>
              <View style={s.summaryRow}><Text style={s.summaryLabel}>نوع سرویس:</Text><Text style={s.summaryValue}>تعمیرات</Text></View>
              <View style={s.summaryRow}><Text style={s.summaryLabel}>زمان حضور:</Text><Text style={s.summaryValue}>{timing === 'immediate' ? 'فوری' : 'زمان‌بندی شده'}</Text></View>
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}><Text style={s.summaryLabel}>هزینه پایه:</Text><Text style={s.priceValue}>۹۵,۰۰۰ تومان</Text></View>
            </Surface>

            {/* نشان‌های امنیتی اضافه شده */}
            <View style={s.securityContainer}>
              <Surface style={s.securityBadge} elevation={0}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                <View style={s.securityTextCol}>
                  <Text style={s.securityTitle}>پرداخت امن (Escrow)</Text>
                  <Text style={s.securitySub}>وجه شما تا زمان رضایت از کار در صندوق پلتفرم امانت می‌ماند.</Text>
                </View>
              </Surface>
              <Surface style={s.securityBadge} elevation={0}>
                <MaterialCommunityIcons name="certificate" size={24} color="#D97706" />
                <View style={s.securityTextCol}>
                  <Text style={s.securityTitle}>بیمه خسارت و گارانتی</Text>
                  <Text style={s.securitySub}>این سرویس دارای ۳۰ روز گارانتی کیفیت خدمات می‌باشد.</Text>
                </View>
              </Surface>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.nextBtn} onPress={step === 3 ? handleSubmit : nextStep}>
          <Text style={s.nextBtnText}>{step === 3 ? 'تایید و ثبت نهایی' : 'مرحله بعد'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 56 : 44, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  progressBar: { height: 4, backgroundColor: '#E2E8F0' },
  content: { padding: 24 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  stepSub: { fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  textArea: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', height: 120, marginBottom: 16 },
  attachmentRow: { flexDirection: 'row', gap: 12 },
  attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderRadius: 16, height: 56, gap: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  attachText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  attachVoiceBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  timingOptions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  timingBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9' },
  timingBoxActive: { borderColor: '#2563EB', backgroundColor: '#F8FAFC' },
  timingText: { fontSize: 14, fontWeight: '800', color: '#475569', marginTop: 12 },
  timingTextActive: { color: '#2563EB' },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#0F172A', fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  priceValue: { fontSize: 16, color: '#10B981', fontWeight: '900' },
  securityContainer: { marginTop: 16, gap: 12 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  securityTextCol: { flex: 1, marginLeft: 12 },
  securityTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  securitySub: { fontSize: 11, color: '#64748B', lineHeight: 18 },
  footer: { padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#F1F5F9', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  nextBtn: { backgroundColor: '#2563EB', height: 60, borderRadius: 100, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});