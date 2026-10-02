import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LocationAPI } from '../lib/services/locationApi';

export default function ActiveMissionScreen() {
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // استیت‌های فاکتور
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [baseCost, setBaseCost] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  useEffect(() => {
    fetchActiveMission();
  }, []);

  const fetchActiveMission = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // پیدا کردن ماموریتی که به این تکنسین محول شده و هنوز تمام نشده است
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('technician_id', user.id)
        .in('status', ['assigned', 'en_route', 'in_progress'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setMission(data);
      else router.replace('/'); // اگر ماموریتی نبود برگرد به رادار

    } catch (error) {
      console.log('No active mission found');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const updateMissionStatus = async (newStatus: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('missions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', mission.id);

      if (error) throw error;
      setMission({ ...mission, status: newStatus });
    } catch (error: any) {
      Alert.alert('خطا', 'مشکل در تغییر وضعیت');
    } finally {
      setProcessing(false);
    }
  };

  const handleNavigation = () => {
    if (mission?.latitude && mission?.longitude) {
      LocationAPI.openNavigation(mission.latitude, mission.longitude, 'محل مشتری');
    } else {
      Alert.alert('خطا', 'مختصات مشتری در دسترس نیست');
    }
  };

  const handleCompleteMission = async () => {
    if (!baseCost) {
      Alert.alert('اخطار', 'وارد کردن دستمزد پایه الزامی است.');
      return;
    }

    setProcessing(true);
    const bCost = parseFloat(baseCost) || 0;
    const pCost = parseFloat(partsCost) || 0;
    const total = bCost + pCost;

    try {
      const { error } = await supabase
        .from('missions')
        .update({ 
          status: 'completed', 
          base_cost: bCost,
          parts_cost: pCost,
          total_cost: total,
          invoice_notes: invoiceNotes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', mission.id);

      if (error) throw error;
      
      setShowInvoiceModal(false);
      Alert.alert('پایان عملیات', 'فاکتور صادر شد و ماموریت با موفقیت به پایان رسید.', [
        { text: 'بازگشت به رادار', onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      Alert.alert('خطا', 'مشکل در صدور فاکتور');
      setProcessing(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#F5A623" /></View>;
  }

  if (!mission) return null;

  // محاسبه نوار پیشرفت وضعیت
  const statusLevel = mission.status === 'assigned' ? 1 : mission.status === 'en_route' ? 2 : mission.status === 'in_progress' ? 3 : 4;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>اتاق عملیات (LIVE)</Text>
        <View style={s.liveIndicator}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>در جریان</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* کارت اطلاعات مشتری و لوکیشن */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={s.iconBox}><MaterialCommunityIcons name="tools" size={24} color="#F5A623" /></View>
            <View style={s.infoTexts}>
              <Text style={s.infoLabel}>نوع خرابی / سرویس</Text>
              <Text style={s.infoValue}>{mission.service_type}</Text>
            </View>
          </View>
          
          <View style={s.divider} />
          
          <View style={s.infoRow}>
            <View style={s.iconBox}><MaterialCommunityIcons name="map-marker-radius" size={24} color="#F5A623" /></View>
            <View style={s.infoTexts}>
              <Text style={s.infoLabel}>آدرس مشتری</Text>
              <Text style={s.infoValue}>{mission.location_text}</Text>
            </View>
            <TouchableOpacity style={s.navBtn} onPress={handleNavigation}>
              <MaterialCommunityIcons name="navigation" size={20} color="#090E17" />
              <Text style={s.navBtnText}>مسیریابی</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* نشانگر وضعیت ماموریت */}
        <View style={s.timelineCard}>
          <Text style={s.timelineTitle}>وضعیت عملیات</Text>
          
          <View style={s.timelineStep}>
            <MaterialCommunityIcons name={statusLevel >= 1 ? "check-circle" : "circle-outline"} size={24} color={statusLevel >= 1 ? "#F5A623" : "#232E42"} />
            <Text style={[s.stepText, statusLevel >= 1 && s.stepTextActive]}>ماموریت پذیرفته شد</Text>
          </View>
          <View style={[s.timelineLine, statusLevel >= 2 && s.timelineLineActive]} />
          
          <View style={s.timelineStep}>
            <MaterialCommunityIcons name={statusLevel >= 2 ? "check-circle" : "circle-outline"} size={24} color={statusLevel >= 2 ? "#F5A623" : "#232E42"} />
            <Text style={[s.stepText, statusLevel >= 2 && s.stepTextActive]}>در مسیر مشتری</Text>
          </View>
          <View style={[s.timelineLine, statusLevel >= 3 && s.timelineLineActive]} />
          
          <View style={s.timelineStep}>
            <MaterialCommunityIcons name={statusLevel >= 3 ? "check-circle" : "circle-outline"} size={24} color={statusLevel >= 3 ? "#F5A623" : "#232E42"} />
            <Text style={[s.stepText, statusLevel >= 3 && s.stepTextActive]}>در حال تعمیر دستگاه</Text>
          </View>
        </View>

        {/* دکمه‌های اکشن بر اساس وضعیت فعلی */}
        <View style={s.actionContainer}>
          {mission.status === 'assigned' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => updateMissionStatus('en_route')} disabled={processing}>
              {processing ? <ActivityIndicator color="#090E17" /> : <Text style={s.actionBtnText}>حرکت به سمت مبدا (شروع سفر)</Text>}
            </TouchableOpacity>
          )}
          
          {mission.status === 'en_route' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => updateMissionStatus('in_progress')} disabled={processing}>
              {processing ? <ActivityIndicator color="#090E17" /> : <Text style={s.actionBtnText}>رسیدم به محل (شروع کار)</Text>}
            </TouchableOpacity>
          )}
          
          {mission.status === 'in_progress' && (
            <TouchableOpacity style={[s.actionBtn, s.completeBtn]} onPress={() => setShowInvoiceModal(true)}>
              <MaterialCommunityIcons name="receipt" size={20} color="#090E17" />
              <Text style={s.actionBtnText}>پایان کار و صدور فاکتور</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* مدال (پنجره) صدور فاکتور */}
      <Modal visible={showInvoiceModal} animationType="slide" transparent={true}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>صدور فاکتور نهایی</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#8A9BB3" />
              </TouchableOpacity>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>دستمزد پایه / ایاب و ذهاب (تومان)</Text>
              <TextInput style={s.input} keyboardType="numeric" placeholder="مثال: 500000" placeholderTextColor="#4A5A75" value={baseCost} onChangeText={setBaseCost} />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>هزینه قطعات مصرفی (تومان - در صورت وجود)</Text>
              <TextInput style={s.input} keyboardType="numeric" placeholder="مثال: 1200000" placeholderTextColor="#4A5A75" value={partsCost} onChangeText={setPartsCost} />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>توضیحات فاکتور (اختیاری)</Text>
              <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="شرح خدمات انجام شده..." placeholderTextColor="#4A5A75" value={invoiceNotes} onChangeText={setInvoiceNotes} />
            </View>

            <TouchableOpacity style={s.submitInvoiceBtn} onPress={handleCompleteMission} disabled={processing}>
              {processing ? <ActivityIndicator color="#090E17" /> : <Text style={s.submitInvoiceText}>تایید نهایی و ارسال به مشتری</Text>}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090E17' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 24, backgroundColor: '#121A28', borderBottomWidth: 1, borderColor: '#232E42' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(230, 57, 70, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.3)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E63946' },
  liveText: { fontSize: 12, fontWeight: '800', color: '#E63946' },
  
  content: { padding: 24 },
  
  infoCard: { backgroundColor: '#121A28', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#232E42', marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(245, 166, 35, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.2)' },
  infoTexts: { flex: 1, marginLeft: 16 },
  infoLabel: { fontSize: 11, color: '#8A9BB3', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: '#232E42', marginVertical: 16 },
  navBtn: { backgroundColor: '#F5A623', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  navBtnText: { fontSize: 12, fontWeight: '800', color: '#090E17' },

  timelineCard: { backgroundColor: '#121A28', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#232E42', marginBottom: 32 },
  timelineTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 24 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepText: { fontSize: 14, fontWeight: '600', color: '#4A5A75' },
  stepTextActive: { color: '#F5A623', fontWeight: '800' },
  timelineLine: { width: 2, height: 30, backgroundColor: '#232E42', marginLeft: 11, marginVertical: 4 },
  timelineLineActive: { backgroundColor: '#F5A623' },

  actionContainer: { marginTop: 10 },
  actionBtn: { height: 60, borderRadius: 16, backgroundColor: '#232E42', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4A5A75' },
  completeBtn: { backgroundColor: '#F5A623', borderColor: '#F5A623', flexDirection: 'row', gap: 10, shadowColor: '#F5A623', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  actionBtnText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

  // استایل‌های مدال فاکتور
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 14, 23, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#121A28', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: '#232E42' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#F5A623' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#8A9BB3', marginBottom: 8, marginLeft: 4 },
  input: { height: 56, backgroundColor: '#090E17', borderWidth: 1, borderColor: '#232E42', borderRadius: 16, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  submitInvoiceBtn: { height: 60, backgroundColor: '#F5A623', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitInvoiceText: { fontSize: 16, fontWeight: '900', color: '#090E17' }
});