import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { MissionAPI } from '../../lib/services/missionApi';

export default function MissionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // استیت‌های امتیازدهی
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    fetchMissionDetails();

    // اتصال به کانال Real-time سوپابیس برای دریافت زنده تغییرات
    const channel = supabase
      .channel(`public:missions:id=eq.${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions', filter: `id=eq.${id}` }, (payload) => {
        // وقتی متخصص وضعیت را تغییر داد، دیتا را دوباره می‌گیریم تا اطلاعات متخصص هم همراهش باشد
        fetchMissionDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchMissionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*, technician:profiles!technician_id(id, first_name, last_name, phone)')
        .eq('id', id)
        .maybeSingle();
        
      if (error) throw error;
      setMission(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = () => {
    // شبیه‌سازی پرداخت موفق و باز شدن پنجره امتیازدهی
    if (mission.rating) {
      Alert.alert('سپاسگزاریم', 'شما قبلاً به این ماموریت امتیاز داده‌اید.');
      return;
    }
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('اخطار', 'لطفاً بین 1 تا 5 ستاره به متخصص امتیاز دهید.');
      return;
    }
    setIsSubmittingRating(true);
    try {
      await MissionAPI.submitRating(mission.id, mission.technician.id, rating, feedback);
      setMission({ ...mission, rating }); // آپدیت رابط کاربری
      setShowRatingModal(false);
      Alert.alert('ثبت موفق', 'امتیاز شما با موفقیت ثبت شد و به ارتقای کیفیت خدمات کمک می‌کند.', [
        { text: 'بازگشت به داشبورد', onPress: () => router.replace('/customer-demo') }
      ]);
    } catch (error: any) {
      Alert.alert('خطا', 'مشکل در ثبت امتیاز.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert('لغو درخواست', 'آیا از لغو این درخواست اطمینان دارید؟', [
      { text: 'خیر', style: 'cancel' },
      { text: 'بله، لغو شود', onPress: async () => {
        await MissionAPI.cancelMission(mission.id);
        router.back();
      }, style: 'destructive' }
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#10B981" /></View>;
  if (!mission) return <View style={s.center}><Text>سفارش یافت نشد</Text></View>;

  const isCompleted = mission.status === 'completed';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>جزئیات عملیات (LIVE)</Text>
        
        {mission.status === 'searching' ? (
          <TouchableOpacity onPress={handleCancel}><Text style={s.cancelText}>لغو</Text></TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* کارت وضعیت زنده */}
        <View style={s.statusCard}>
          <View style={s.statusIconHalo}>
            {isCompleted ? (
              <MaterialCommunityIcons name="check-decagram" size={36} color="#10B981" />
            ) : (
              <ActivityIndicator size="large" color="#3B82F6" />
            )}
          </View>
          <Text style={s.statusTitle}>
            {mission.status === 'searching' ? 'در حال جستجوی متخصص...' :
             mission.status === 'assigned' ? 'متخصص یافت شد' :
             mission.status === 'en_route' ? 'متخصص در مسیر شماست' :
             mission.status === 'in_progress' ? 'متخصص در حال کار است' : 'پایان موفقیت‌آمیز کار'}
          </Text>
          {!isCompleted && <Text style={s.liveUpdateText}>بروزرسانی زنده فعال است...</Text>}
        </View>

        {mission.technician && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>متخصص اعزامی شما</Text>
            <View style={s.techCard}>
              <View style={s.techAvatar}>
                <MaterialCommunityIcons name="account-hard-hat" size={24} color="#10B981" />
              </View>
              <View style={s.techInfo}>
                <Text style={s.techName}>{mission.technician.first_name} {mission.technician.last_name}</Text>
                <Text style={s.techRole}>متخصص ارشد تایید شده</Text>
              </View>
              <TouchableOpacity style={s.callBtn}>
                <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>فاکتور نهایی خدمات</Text>
            <View style={s.invoiceCard}>
              <View style={s.invoiceRow}>
                <Text style={s.invoiceLabel}>دستمزد پایه و ایاب ذهاب</Text>
                <Text style={s.invoiceValue}>{Number(mission.base_cost).toLocaleString()} تومان</Text>
              </View>
              <View style={s.divider} />
              <View style={s.invoiceRow}>
                <Text style={s.invoiceLabel}>هزینه قطعات مصرفی</Text>
                <Text style={s.invoiceValue}>{Number(mission.parts_cost).toLocaleString()} تومان</Text>
              </View>
              
              {mission.invoice_notes && (
                <View style={s.notesBox}>
                  <Text style={s.notesTitle}>توضیحات متخصص:</Text>
                  <Text style={s.notesText}>{mission.invoice_notes}</Text>
                </View>
              )}
              
              <View style={[s.divider, { backgroundColor: '#10B981', height: 2 }]} />
              <View style={s.invoiceRowTotal}>
                <Text style={s.invoiceTotalLabel}>مبلغ قابل پرداخت</Text>
                <Text style={s.invoiceTotalValue}>{Number(mission.total_cost).toLocaleString()} تومان</Text>
              </View>

              <TouchableOpacity 
                style={[s.payBtn, mission.rating ? { backgroundColor: '#E2E8F0' } : {}]} 
                onPress={handleSimulatePayment}
                disabled={!!mission.rating}
              >
                <Text style={[s.payBtnText, mission.rating ? { color: '#64748B' } : {}]}>
                  {mission.rating ? 'پرداخت انجام شد و امتیاز ثبت شد' : 'پرداخت آنلاین و ثبت امتیاز'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* مدال امتیازدهی به متخصص */}
      <Modal visible={showRatingModal} animationType="slide" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>ارزیابی کیفیت خدمات</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={s.ratingQuestion}>از عملکرد متخصص رضایت داشتید؟</Text>
            
            <View style={s.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialCommunityIcons 
                    name={rating >= star ? "star" : "star-outline"} 
                    size={48} 
                    color={rating >= star ? "#F5A623" : "#E2E8F0"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput 
              style={s.feedbackInput} 
              placeholder="نظرتان را درباره این متخصص بنویسید (اختیاری)..." 
              placeholderTextColor="#94A3B8" 
              multiline 
              value={feedback} 
              onChangeText={setFeedback} 
            />

            <TouchableOpacity style={s.submitRatingBtn} onPress={handleSubmitRating} disabled={isSubmittingRating}>
              {isSubmittingRating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.submitRatingText}>ثبت امتیاز</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  content: { padding: 24 },
  
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 5, marginBottom: 32 },
  statusIconHalo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statusTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  liveUpdateText: { fontSize: 12, color: '#10B981', fontWeight: '700', marginTop: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  
  techCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  techAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  techInfo: { flex: 1, marginLeft: 16 },
  techName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  techRole: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },

  invoiceCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  invoiceLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  invoiceValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  notesBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 12, marginBottom: 12 },
  notesTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#334155', lineHeight: 20 },
  invoiceRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  invoiceTotalValue: { fontSize: 20, fontWeight: '900', color: '#10B981' },
    disputeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: 'rgba(230, 57, 70, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.2)', marginBottom: 12 },
  disputeBtnText: { color: '#E63946', fontSize: 14, fontWeight: '700' },
  disputeAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(230, 57, 70, 0.1)', borderRadius: 12, marginBottom: 12 },
  disputeAlertText: { color: '#E63946', fontSize: 12, fontWeight: '700', flex: 1 },
  payBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  payBtnText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

  // استایل مدال امتیاز
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  ratingQuestion: { fontSize: 15, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  feedbackInput: { height: 100, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, textAlignVertical: 'top', color: '#0F172A', marginBottom: 24 },
  submitRatingBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  submitRatingText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' }
});