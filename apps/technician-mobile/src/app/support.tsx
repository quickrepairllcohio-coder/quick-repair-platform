import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Alert, Linking, Keyboard } from 'react-native';
import { Text, Surface, Portal, Modal, TextInput, Divider, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SupportScreen() {
  const router = useRouter();

  const [sosActive, setSosActive] = useState(false);

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', sender: 'support', text: 'سلام! پشتیبانی QuickRepair در خدمت شماست. چگونه می‌توانیم کمکتان کنیم؟', time: 'هم‌اکنون' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('عدم پرداخت دستمزد توسط مشتری');
  const [jobIdInput, setJobIdInput] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  // محاسبه دقیق و واقعی ارتفاع کیبورد
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const loadSosState = async () => {
      const active = await AsyncStorage.getItem('sos_active_status');
      if (active === 'true') setSosActive(true);
    };
    loadSosState();
  }, []);

  const handleTriggerSOS = () => {
    if (sosActive) {
      Alert.alert(
        'لغو وضعیت اضطراری',
        'آیا قصد دارید وضعیت هشدار امنیتی را غیرفعال کنید؟',
        [
          { text: 'انصراف', style: 'cancel' },
          { 
            text: 'بله، لغو هشدار', 
            style: 'destructive',
            onPress: async () => {
              setSosActive(false);
              await AsyncStorage.setItem('sos_active_status', 'false');
            } 
          }
        ]
      );
    } else {
      Alert.alert(
        '🚨 هشدار امنیتی و SOS',
        'با تایید این گزینه، موقعیت زنده شما برای تیم پشتیبانی ارشد ارسال شده و تماس با مرکز نجات برقرار می‌شود.',
        [
          { text: 'انصراف', style: 'cancel' },
          { 
            text: 'تایید و ارسال SOS', 
            style: 'destructive',
            onPress: async () => {
              setSosActive(true);
              await AsyncStorage.setItem('sos_active_status', 'true');
              Linking.openURL('tel:110');
            } 
          }
        ]
      );
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg = { id: Date.now().toString(), sender: 'user', text: inputMessage.trim(), time: 'هم‌اکنون' };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'support', text: 'پیام شما دریافت شد. کارشناس مربوطه تا چند لحظه دیگر با شما ارتباط می‌گیرد.', time: 'هم‌اکنون' }
      ]);
    }, 1200);
  };

  const handleSendDispute = async () => {
    if (!disputeDetails.trim()) {
      Alert.alert('خطا', 'لطفاً توضیحات اختلاف یا مشکل پیش‌آمده را وارد کنید.');
      return;
    }

    const disputeData = {
      id: Date.now().toString(),
      reason: disputeReason,
      jobId: jobIdInput || 'مشخص‌نشده',
      details: disputeDetails.trim(),
      date: new Date().toLocaleDateString('fa-IR')
    };

    await AsyncStorage.setItem('last_dispute', JSON.stringify(disputeData));
    setDisputeModalVisible(false);
    setDisputeDetails('');
    setJobIdInput('');
    Alert.alert('شکایت ثبت شد', 'پرونده حل اختلاف تشکیل شد. کارشناسان ما حداکثر تا ۲ ساعت آینده با شما و مشتری تماس خواهند گرفت.');
  };

  return (
    <View style={s.container}>
      <View style={s.headerNav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>مرکز پشتیبانی و امنیت</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={[s.sosBtn, sosActive && s.sosBtnActive]} 
          onPress={handleTriggerSOS}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name={sosActive ? "shield-alert" : "alert-decagram"} size={52} color="#FFF" />
          <Text style={s.sosTitle}>{sosActive ? 'وضعیت SOS فعال است!' : 'اعلام وضعیت اضطراری (SOS)'}</Text>
          <Text style={s.sosText}>
            {sosActive ? 'پشتیبانی در حال رصد موقعیت شماست. برای لغو لمس کنید.' : 'در صورت احساس خطر در محل کار، لمس کنید.'}
          </Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>خدمات پشتیبانی و گزارش‌دهی</Text>

        <Surface style={s.optCard} elevation={0}>
          <TouchableOpacity style={s.optCardInner} onPress={() => setChatModalVisible(true)}>
            <View style={[s.optIconBox, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="chat-processing" size={26} color="#2563EB" />
            </View>
            <View style={s.optMeta}>
              <Text style={s.optTitle}>چت با پشتیبانی پلتفرم</Text>
              <Text style={s.optText}>پاسخگویی آنی به مشکلات فنی و حساب کاربری</Text>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </Surface>

        <Surface style={s.optCard} elevation={0}>
          <TouchableOpacity style={s.optCardInner} onPress={() => setDisputeModalVisible(true)}>
            <View style={[s.optIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="gavel" size={26} color="#D97706" />
            </View>
            <View style={s.optMeta}>
              <Text style={s.optTitle}>گزارش و حل اختلاف</Text>
              <Text style={s.optText}>ثبت رسمی شکایت از مشتری، عدم پرداخت یا لغو کار</Text>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </Surface>
      </ScrollView>

      {/* مدال چت با بالارفتن متناسب با ارتفاع کیبورد */}
      <Portal>
        <Modal 
          visible={chatModalVisible} 
          onDismiss={() => setChatModalVisible(false)} 
          style={s.modalBackdropOverlay}
          contentContainerStyle={[
            s.bottomSheetContainer, 
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 20 }
          ]}
        >
          <View style={s.chatHeader}>
            <MaterialCommunityIcons name="headset" size={28} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.chatTitle}>پشتیبانی آنلاین QuickRepair</Text>
              <Text style={s.chatStatus}>● پاسخگویی فعال</Text>
            </View>
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Divider style={{ marginVertical: 10 }} />

          <ScrollView 
            style={{ maxHeight: keyboardHeight > 0 ? 120 : 220, marginBottom: 10 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(m => (
              <View key={m.id} style={[s.msgBubble, m.sender === 'user' ? s.userMsg : s.supportMsg]}>
                <Text style={[s.msgText, m.sender === 'user' && { color: '#FFF' }]}>{m.text}</Text>
                <Text style={[s.msgTime, m.sender === 'user' && { color: '#BFDBFE' }]}>{m.time}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.inputRow}>
            <TextInput
              mode="outlined"
              placeholder="پیام خود را بنویسید..."
              value={inputMessage}
              onChangeText={setInputMessage}
              style={{ flex: 1, backgroundColor: '#FFF' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#2563EB"
            />
            <TouchableOpacity style={s.sendBtn} onPress={handleSendMessage}>
              <MaterialCommunityIcons name="send" size={22} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      {/* مدال حل اختلاف با بالارفتن متناسب با ارتفاع کیبورد */}
      <Portal>
        <Modal 
          visible={disputeModalVisible} 
          onDismiss={() => setDisputeModalVisible(false)} 
          style={s.modalBackdropOverlay}
          contentContainerStyle={[
            s.bottomSheetContainer, 
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 20 }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitle}>ثبت پرونده حل اختلاف</Text>
            <Text style={s.modalSub}>در صورت عدم رعایت توافقات توسط مشتری، موضوع را جهت بررسی قانونی ثبت کنید.</Text>

            <Text style={s.label}>علت اختلاف:</Text>
            <View style={s.chipGroup}>
              {['عدم پرداخت دستمزد', 'لغو بی‌موقع کار', 'رفتار نامناسب', 'سایر موارد'].map(reason => (
                <Chip
                  key={reason}
                  selected={disputeReason === reason}
                  onPress={() => setDisputeReason(reason)}
                  style={[s.reasonChip, disputeReason === reason && s.reasonChipActive]}
                  textStyle={disputeReason === reason && { color: '#FFF' }}
                >
                  {reason}
                </Chip>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="کُد سفارش (اختیاری)"
              value={jobIdInput}
              onChangeText={setJobIdInput}
              keyboardType="numeric"
              style={{ marginBottom: 12, backgroundColor: '#FFF' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#D97706"
            />

            <TextInput
              mode="outlined"
              label="شرح کامل اتفاق پیش‌آمده"
              value={disputeDetails}
              onChangeText={setDisputeDetails}
              multiline
              numberOfLines={3}
              style={{ marginBottom: 16, backgroundColor: '#FFF' }}
              outlineColor="#E2E8F0"
              activeOutlineColor="#D97706"
            />

            <View style={s.modalActionRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setDisputeModalVisible(false)}>
                <Text style={s.modalCancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmitDisputeBtn} onPress={handleSendDispute}>
                <Text style={s.modalSubmitText}>ثبت پرونده شکایت</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 56 : 44, paddingBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 100 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sosBtn: { backgroundColor: '#EF4444', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 28, elevation: 6 },
  sosBtnActive: { backgroundColor: '#DC2626', borderWidth: 2, borderColor: '#FCA5A5' },
  sosTitle: { fontSize: 17, fontWeight: '900', color: '#FFF', marginTop: 10 },
  sosText: { fontSize: 12, color: '#FEE2E2', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  optCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 12 },
  optCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  optIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  optMeta: { flex: 1, marginLeft: 14 },
  optTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  optText: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 18 },

  modalBackdropOverlay: { justifyContent: 'flex-end', margin: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  bottomSheetContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, width: '100%', maxHeight: '90%' },

  chatHeader: { flexDirection: 'row', alignItems: 'center' },
  chatTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  chatStatus: { fontSize: 11, color: '#16A34A', marginTop: 2, fontWeight: '700' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%' },
  userMsg: { backgroundColor: '#2563EB', alignSelf: 'flex-end', borderBottomLeftRadius: 0 },
  supportMsg: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', borderBottomRightRadius: 0 },
  msgText: { fontSize: 13, color: '#1E293B', lineHeight: 20 },
  msgTime: { fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'left' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendBtn: { backgroundColor: '#2563EB', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  reasonChip: { backgroundColor: '#F1F5F9' },
  reasonChipActive: { backgroundColor: '#D97706' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  modalCancelText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  modalSubmitDisputeBtn: { backgroundColor: '#D97706', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100 },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});