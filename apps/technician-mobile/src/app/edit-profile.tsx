import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, Avatar, Surface, Chip, TextInput, Divider, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();

  // هویت کاربر (فقط خواندنی از سیستم)
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');

  // فیلدهای مشترک
  const [phone, setPhone] = useState('+93728309999');
  const [bio, setBio] = useState('من تکنسین ارشد با بیش از ۵ سال سابقه کار هستم.');
  
  // فیلدهای فردی
  const [name, setName] = useState('Bashir Rasa');
  
  // فیلدهای شرکتی
  const [companyName, setCompanyName] = useState('شرکت خدماتی رسا');
  const [regNumber, setRegNumber] = useState('');

  const allLanguages = ['فارسی', 'انگلیسی', 'پشتو', 'عربی', 'فرانسوی', 'آلمانی'];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['فارسی', 'انگلیسی']);

  const [specialties, setSpecialties] = useState([
    { id: '1', title: 'تعمیرات پکیج و شوفاژ', status: 'verified', statusText: 'تایید شده', certUri: null },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newSkillTitle, setNewSkillTitle] = useState('');
  const [certImage, setCertImage] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // دریافت هویت از سیستم (بدون اجازه تغییر توسط کاربر)
        const savedType = await AsyncStorage.getItem('account_type');
        if (savedType) setAccountType(savedType as 'individual' | 'company');

        const savedCompany = await AsyncStorage.getItem('company_name');
        if (savedCompany) setCompanyName(savedCompany);

        const savedReg = await AsyncStorage.getItem('company_reg_no');
        if (savedReg) setRegNumber(savedReg);

        const savedPhone = await AsyncStorage.getItem('user_phone');
        if (savedPhone) setPhone(savedPhone);

        const savedLangs = await AsyncStorage.getItem('user_languages');
        if (savedLangs) setSelectedLangs(JSON.parse(savedLangs));

        const savedSkills = await AsyncStorage.getItem('user_skills');
        if (savedSkills) setSpecialties(JSON.parse(savedSkills));
      } catch (e) { console.log(e); }
    };
    loadSavedData();
  }, []);

  const toggleLanguage = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(selectedLangs.filter(l => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const handlePickCertificate = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) setCertImage(result.assets[0].uri);
    } catch (error) { console.log(error); }
  };

  const handleAddSkillSubmit = () => {
    if (!newSkillTitle.trim() || !certImage) return alert('عنوان مهارت و تصویر مدرک الزامی است.');
    const newSkill = { id: Date.now().toString(), title: newSkillTitle.trim(), status: 'pending', statusText: 'در انتظار بررسی', certUri: certImage };
    setSpecialties([...specialties, newSkill]);
    setNewSkillTitle(''); setCertImage(null); setModalVisible(false);
  };

  const handleSave = async () => {
    try {
      // در اینجا فقط اطلاعات جزئی ذخیره می‌شود، هویت کلان تغییر نمی‌کند
      if (accountType === 'company') {
        await AsyncStorage.setItem('company_name', companyName);
        await AsyncStorage.setItem('company_reg_no', regNumber);
      } else {
        await AsyncStorage.setItem('user_name', name);
      }
      await AsyncStorage.setItem('user_phone', phone);
      await AsyncStorage.setItem('user_languages', JSON.stringify(selectedLangs));
      await AsyncStorage.setItem('user_skills', JSON.stringify(specialties));
      router.back();
    } catch (e) { console.log(e); }
  };

  const isCompany = accountType === 'company';

  return (
    <KeyboardAvoidingView style={s.mainWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        <View style={s.headerNav}>
          <TouchableOpacity style={s.backCircleBtn} onPress={() => router.back()}>
            <Avatar.Icon size={36} icon="arrow-right" style={{ backgroundColor: '#F1F5F9' }} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>ویرایش اطلاعات کاربری</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* برچسب قفل شده هویت */}
        <View style={[s.identityBadge, isCompany ? s.companyBadge : s.individualBadge]}>
          <MaterialCommunityIcons name={isCompany ? "domain" : "account-wrench"} size={20} color={isCompany ? "#D97706" : "#2563EB"} />
          <Text style={[s.identityText, isCompany ? s.companyText : s.individualText]}>
            شما به عنوان {isCompany ? '«شرکت / تیم»' : '«تکنسین مستقل»'} فعالیت می‌کنید
          </Text>
        </View>

        {/* اطلاعات پایه هوشمند */}
        <Surface style={s.modernCard} elevation={0}>
          <Text style={s.sectionTitle}>اطلاعات هویتی</Text>
          
          {isCompany ? (
            <>
              <TextInput mode="outlined" label="نام تجاری شرکت / تیم" value={companyName} onChangeText={setCompanyName} outlineColor="#E2E8F0" activeOutlineColor="#D97706" style={s.input} />
              <TextInput mode="outlined" label="نام مدیر / نماینده پاسخگو" value={name} onChangeText={setName} outlineColor="#E2E8F0" activeOutlineColor="#D97706" style={s.input} />
              <TextInput mode="outlined" label="شماره ثبت شرکت (اختیاری)" value={regNumber} onChangeText={setRegNumber} keyboardType="numeric" outlineColor="#E2E8F0" activeOutlineColor="#D97706" style={s.input} />
            </>
          ) : (
            <TextInput mode="outlined" label="نام و نام خانوادگی (تکنسین)" value={name} onChangeText={setName} outlineColor="#E2E8F0" activeOutlineColor="#2563EB" style={s.input} />
          )}

          <TextInput mode="outlined" label="شماره تماس پشتیبانی" value={phone} onChangeText={setPhone} keyboardType="phone-pad" outlineColor="#E2E8F0" activeOutlineColor={isCompany ? "#D97706" : "#2563EB"} style={s.input} />
          <TextInput mode="outlined" label={isCompany ? "درباره خدمات شرکت ما" : "درباره مهارت‌های من"} value={bio} onChangeText={setBio} multiline numberOfLines={3} outlineColor="#E2E8F0" activeOutlineColor={isCompany ? "#D97706" : "#2563EB"} style={s.input} />
        </Surface>

        {/* زبان‌ها */}
        <Surface style={s.modernCard} elevation={0}>
          <Text style={s.sectionTitle}>زبان‌های پشتیبانی شده</Text>
          <View style={s.chipGroup}>
            {allLanguages.map(lang => {
              const isSelected = selectedLangs.includes(lang);
              return (
                <Chip key={lang} mode={isSelected ? "flat" : "outlined"} style={[s.langChip, isSelected ? (isCompany ? s.langChipCompanySelected : s.langChipSelected) : s.langChipUnselected]} textStyle={isSelected ? (isCompany ? s.langChipCompanyText : s.langChipTextSelected) : s.langChipTextUnselected} onPress={() => toggleLanguage(lang)} icon={isSelected ? "check" : undefined}>
                  {lang}
                </Chip>
              );
            })}
          </View>
        </Surface>

        {/* مهارت‌ها */}
        <Surface style={s.modernCard} elevation={0}>
          <Text style={s.sectionTitle}>تخصص‌ها و مدارک فنی</Text>
          {specialties.map((spec, index) => (
            <View key={spec.id}>
              <View style={s.specialtyRow}>
                <Text style={s.specialtyTitle}>{spec.title}</Text>
                <View style={[s.statusBadge, spec.status === 'verified' ? s.statusVerified : s.statusPending]}>
                  <MaterialCommunityIcons name={spec.status === 'verified' ? "shield-check" : "clock-outline"} size={14} color={spec.status === 'verified' ? "#16A34A" : "#D97706"} />
                  <Text style={[s.statusText, spec.status === 'verified' ? s.statusTextVerified : s.statusTextPending]}>{spec.statusText}</Text>
                </View>
              </View>
              {index < specialties.length - 1 && <Divider style={s.lightDivider} />}
            </View>
          ))}
          <TouchableOpacity style={s.uploadBtn} onPress={() => setModalVisible(true)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={isCompany ? "#D97706" : "#2563EB"} />
            <Text style={[s.uploadBtnText, isCompany && { color: '#D97706' }]}>درخواست افزودن تخصص جدید</Text>
          </TouchableOpacity>
        </Surface>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal افزودن مهارت */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={s.modalContainer}>
          <Text style={s.modalTitle}>درخواست مهارت جدید</Text>
          <TextInput mode="outlined" label="عنوان مهارت" value={newSkillTitle} onChangeText={setNewSkillTitle} outlineColor="#E2E8F0" activeOutlineColor={isCompany ? "#D97706" : "#2563EB"} style={{ marginBottom: 16, backgroundColor: '#FFF' }} />
          <TouchableOpacity style={s.certUploadBox} onPress={handlePickCertificate}>
            {certImage ? (
              <View style={{ alignItems: 'center' }}><MaterialCommunityIcons name="file-check-outline" size={36} color="#16A34A" /><Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '700', marginTop: 4 }}>مدرک انتخاب شد</Text></View>
            ) : (
              <View style={{ alignItems: 'center' }}><MaterialCommunityIcons name="camera-plus-outline" size={36} color="#64748B" /><Text style={{ fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 4 }}>آپلود تصویر مدرک</Text></View>
            )}
          </TouchableOpacity>
          <View style={s.modalActionRow}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}><Text style={s.modalCancelText}>انصراف</Text></TouchableOpacity>
            <TouchableOpacity style={[s.modalSubmitBtn, isCompany && { backgroundColor: '#D97706' }]} onPress={handleAddSkillSubmit}><Text style={s.modalSubmitText}>ارسال</Text></TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      <Surface style={s.stickyBottomBar} elevation={8}>
        <TouchableOpacity style={[s.savePillBtn, isCompany && { backgroundColor: '#D97706' }]} onPress={handleSave}>
          <Text style={s.savePillText}>ذخیره تغییرات</Text>
        </TouchableOpacity>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 56 : 44 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backCircleBtn: { borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  
  identityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, marginBottom: 16, gap: 8, borderWidth: 1 },
  companyBadge: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  individualBadge: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  identityText: { fontSize: 14, fontWeight: '800' },
  companyText: { color: '#D97706' },
  individualText: { color: '#2563EB' },

  modernCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF', fontSize: 14 },
  
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { borderRadius: 100 },
  langChipSelected: { backgroundColor: '#EFF6FF', borderWidth: 0 },
  langChipCompanySelected: { backgroundColor: '#FEF3C7', borderWidth: 0 },
  langChipUnselected: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1 },
  langChipTextSelected: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
  langChipCompanyText: { color: '#D97706', fontSize: 13, fontWeight: '700' },
  langChipTextUnselected: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  
  specialtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  specialtyTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, gap: 4 },
  statusVerified: { backgroundColor: '#F0FDF4' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextVerified: { color: '#16A34A' },
  statusTextPending: { color: '#D97706' },
  lightDivider: { backgroundColor: '#F1F5F9', height: 1, marginVertical: 8 },
  
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#2563EB', marginLeft: 8 },
  
  stickyBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'android' ? 58 : 32, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  savePillBtn: { height: 54, borderRadius: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB' },
  savePillText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  
  modalContainer: { backgroundColor: '#FFFFFF', margin: 20, padding: 20, borderRadius: 24 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  certUploadBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  modalCancelText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  modalSubmitBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});