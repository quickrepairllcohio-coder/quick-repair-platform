import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Image, Keyboard } from 'react-native';
import { Text, Avatar, Surface, Chip, Divider, Portal, Modal, TextInput } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>(['فارسی', 'انگلیسی']);
  const [skills, setSkills] = useState<any[]>([]);
  
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [managerName, setManagerName] = useState('Bashir Rasa');
  const [companyName, setCompanyName] = useState('تاسیسات رسا');

  const [portfolio, setPortfolio] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);

  // محاسبه ارتفاع جابه‌جایی مدال هنگام باز شدن کیبورد
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardOffset(Platform.OS === 'android' ? e.endCoordinates.height * 0.6 : e.endCoordinates.height * 0.4)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOffset(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadSavedData = async () => {
        try {
          const type = await AsyncStorage.getItem('account_type');
          if (type) setAccountType(type as 'individual' | 'company');

          const cName = await AsyncStorage.getItem('company_name');
          if (cName) setCompanyName(cName);

          const savedUri = await AsyncStorage.getItem('user_profile_image');
          if (savedUri) setProfileImage(savedUri);

          const savedLangs = await AsyncStorage.getItem('user_languages');
          if (savedLangs) setLanguages(JSON.parse(savedLangs));

          const savedSkills = await AsyncStorage.getItem('user_skills');
          if (savedSkills) setSkills(JSON.parse(savedSkills));

          const savedPortfolio = await AsyncStorage.getItem('user_portfolio');
          if (savedPortfolio) setPortfolio(JSON.parse(savedPortfolio));
        } catch (e) { console.log(e); }
      };
      loadSavedData();
    }, [])
  );

  const handleChangePhoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        await AsyncStorage.setItem('user_profile_image', result.assets[0].uri);
      }
    } catch (error) { console.log(error); }
  };

  const pickBeforeImg = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) setBeforeImg(result.assets[0].uri);
    } catch (e) { console.log(e); }
  };

  const pickAfterImg = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
      if (!result.canceled) setAfterImg(result.assets[0].uri);
    } catch (e) { console.log(e); }
  };

  const handleSavePortfolio = async () => {
    if (!portfolioTitle.trim() || !beforeImg || !afterImg) {
      alert('لطفاً عنوان و هر دو تصویر (قبل و بعد) را انتخاب کنید.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      title: portfolioTitle.trim(),
      beforeImg,
      afterImg,
      date: 'امروز'
    };

    const updated = [newItem, ...portfolio];
    setPortfolio(updated);
    await AsyncStorage.setItem('user_portfolio', JSON.stringify(updated));

    setPortfolioTitle('');
    setBeforeImg(null);
    setAfterImg(null);
    setModalVisible(false);
  };

  const isCompany = accountType === 'company';

  return (
    <View style={s.mainWrapper}>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.headerNav}>
          <TouchableOpacity style={s.backCircleBtn} onPress={() => router.back()}>
            <Avatar.Icon size={36} icon="arrow-right" style={{ backgroundColor: '#F1F5F9' }} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isCompany ? 'پروفایل شرکتی' : 'پروفایل تکنسین'}</Text>
          
          <TouchableOpacity style={s.editHeaderBtn} onPress={() => router.push('/edit-profile')}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={s.profileHeader}>
          <View style={s.avatarContainer}>
            {profileImage ? (
              <Avatar.Image size={104} source={{ uri: profileImage }} />
            ) : (
              <Avatar.Text size={104} label={isCompany ? "CO" : "BR"} style={{ backgroundColor: isCompany ? '#0F172A' : '#2563EB' }} color="#FFF" />
            )}
            
            <TouchableOpacity style={s.editPhotoBtn} onPress={handleChangePhoto}>
              <MaterialCommunityIcons name={isCompany ? "image-edit" : "camera-plus"} size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={s.nameBadgeRow}>
            <Text style={s.nameText}>{isCompany ? companyName : managerName}</Text>
            <MaterialCommunityIcons name="check-decagram" size={24} color={isCompany ? "#F59E0B" : "#2563EB"} style={{ marginLeft: 6 }} />
          </View>

          <View style={[s.verifiedTrustPill, isCompany && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <MaterialCommunityIcons name={isCompany ? "domain" : "shield-check"} size={14} color={isCompany ? "#D97706" : "#16A34A"} />
            <Text style={[s.verifiedTrustText, isCompany && { color: '#D97706' }]}>
              {isCompany ? 'شرکت خدماتی معتبر QuickRepair' : 'تکنسین احرازهویت‌شده QuickRepair'}
            </Text>
          </View>
          
          <Text style={s.roleText}>{isCompany ? `مدیریت: ${managerName}` : 'تکنسین ارشد تاسیسات'}</Text>
        </View>

        <View style={s.trustBadgesRow}>
          <View style={s.trustBadge}>
            <Avatar.Icon size={46} icon={isCompany ? "file-document-check" : "shield-check-outline"} style={{ backgroundColor: '#EFF6FF' }} color="#2563EB" />
            <Text style={s.trustBadgeText}>{isCompany ? 'ثبت حقوقی' : 'هویت تایید شده'}</Text>
          </View>
          <View style={s.trustBadge}>
            <Avatar.Icon size={46} icon="file-document-check-outline" style={{ backgroundColor: '#EFF6FF' }} color="#2563EB" />
            <Text style={s.trustBadgeText}>گواهی عدم{'\n'}سوءپیشینه</Text>
          </View>
          <View style={s.trustBadge}>
            <Avatar.Icon size={46} icon={isCompany ? "shield-home-outline" : "hand-heart-outline"} style={{ backgroundColor: '#EFF6FF' }} color="#2563EB" />
            <Text style={s.trustBadgeText}>{isCompany ? 'بیمه شرکتی' : 'دارای بیمه'}</Text>
          </View>
        </View>

        <Surface style={s.modernCard} elevation={0}>
          <View style={s.cardHeaderRow}>
            <Text style={s.sectionTitle}>گالری نمونه‌کارها (قبل و بعد)</Text>
            <TouchableOpacity style={s.addPortfolioBtn} onPress={() => setModalVisible(true)}>
              <MaterialCommunityIcons name="plus" size={18} color="#2563EB" />
              <Text style={s.addPortfolioText}>افزودن</Text>
            </TouchableOpacity>
          </View>

          {portfolio.length === 0 ? (
            <Text style={s.emptyText}>هنوز نمونه‌کاری ثبت نشده است. با زدن دکمه «افزودن»، تصاویر قبل و بعد از تعمیر را قرار دهید.</Text>
          ) : (
            portfolio.map((item) => (
              <View key={item.id} style={s.portfolioCard}>
                <Text style={s.portfolioTitle}>{item.title}</Text>
                <Text style={s.portfolioDate}>{item.date}</Text>

                <View style={s.beforeAfterRow}>
                  <View style={s.imageBoxContainer}>
                    <View style={[s.imageLabelBadge, { backgroundColor: '#EF4444' }]}>
                      <Text style={s.imageLabelText}>قبل از تعمیر</Text>
                    </View>
                    <Image source={{ uri: item.beforeImg }} style={s.portfolioImg} />
                  </View>

                  <View style={s.imageBoxContainer}>
                    <View style={[s.imageLabelBadge, { backgroundColor: '#16A34A' }]}>
                      <Text style={s.imageLabelText}>بعد از تعمیر</Text>
                    </View>
                    <Image source={{ uri: item.afterImg }} style={s.portfolioImg} />
                  </View>
                </View>
              </View>
            ))
          )}
        </Surface>

        <Surface style={s.modernCard} elevation={0}>
          <View style={s.cardHeaderRow}>
            <Text style={s.sectionTitle}>تخصص‌ها و زبان‌ها</Text>
            <TouchableOpacity style={s.editInlineBtn} onPress={() => router.push('/edit-profile')}>
              <MaterialCommunityIcons name="pencil" size={16} color="#2563EB" />
              <Text style={s.editInlineBtnText}>ویرایش</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chipGroup}>
            {skills.filter(s => s.status === 'verified').map(skill => (
              <Chip key={skill.id} icon="check-circle" style={s.skillChip} textStyle={s.skillChipText}>{skill.title}</Chip>
            ))}
          </View>
          <Divider style={s.lightDivider} />
          <View style={s.chipGroup}>
            {languages.map(lang => (
              <Chip key={lang} icon="translate" style={s.langChip} textStyle={s.langChipText}>{lang}</Chip>
            ))}
          </View>
        </Surface>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* مدال با جابه‌جایی مستقیم بر اساس ارتفاع کیبورد */}
      <Portal>
        <Modal 
          visible={modalVisible} 
          onDismiss={() => { setModalVisible(false); setKeyboardOffset(0); }} 
          contentContainerStyle={[s.modalContainer, { marginBottom: keyboardOffset }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.modalTitle}>افزودن نمونه‌کار جدید</Text>

            <TextInput
              mode="outlined"
              label="عنوان پروژه (مثلاً تعویض قطعه پکیج)"
              value={portfolioTitle}
              onChangeText={setPortfolioTitle}
              outlineColor="#E2E8F0"
              activeOutlineColor="#2563EB"
              style={{ marginBottom: 16, backgroundColor: '#FFF' }}
            />

            <View style={s.modalPickersRow}>
              <TouchableOpacity style={[s.pickerBox, beforeImg && s.pickerBoxDone]} onPress={pickBeforeImg}>
                <MaterialCommunityIcons name={beforeImg ? "check-circle" : "camera-plus"} size={28} color={beforeImg ? "#16A34A" : "#EF4444"} />
                <Text style={s.pickerText}>{beforeImg ? 'عکس قبل انتخاب شد' : 'عکس قبل از تعمیر'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.pickerBox, afterImg && s.pickerBoxDone]} onPress={pickAfterImg}>
                <MaterialCommunityIcons name={afterImg ? "check-circle" : "camera-plus"} size={28} color={afterImg ? "#16A34A" : "#16A34A"} />
                <Text style={s.pickerText}>{afterImg ? 'عکس بعد انتخاب شد' : 'عکس بعد از تعمیر'}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.modalActionRow}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setModalVisible(false); setKeyboardOffset(0); }}>
                <Text style={s.modalCancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmitBtn} onPress={handleSavePortfolio}>
                <Text style={s.modalSubmitText}>ذخیره نمونه‌کار</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

    </View>
  );
}

const s = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 56 : 44 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backCircleBtn: { borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  editHeaderBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 14, width: 104, height: 104 },
  editPhotoBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0F172A', borderRadius: 20, padding: 8, elevation: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nameText: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  verifiedTrustPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, marginTop: 6, borderWidth: 1, borderColor: '#DCFCE7' },
  verifiedTrustText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  roleText: { fontSize: 14, color: '#64748B', marginTop: 8, fontWeight: '600' },
  trustBadgesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 8 },
  trustBadge: { alignItems: 'center', flex: 1 },
  trustBadgeText: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 8, textAlign: 'center', lineHeight: 18 },
  modernCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  addPortfolioBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  addPortfolioText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  editInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  editInlineBtnText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  portfolioCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
  portfolioTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  portfolioDate: { fontSize: 11, color: '#94A3B8', marginTop: 2, marginBottom: 12 },
  beforeAfterRow: { flexDirection: 'row', gap: 12 },
  imageBoxContainer: { flex: 1, position: 'relative' },
  imageLabelBadge: { position: 'absolute', top: 6, right: 6, zIndex: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  imageLabelText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  portfolioImg: { height: 110, borderRadius: 12, width: '100%' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#F0FDF4', borderRadius: 100 },
  skillChipText: { color: '#16A34A', fontSize: 13, fontWeight: '700' },
  langChip: { backgroundColor: '#F1F5F9', borderRadius: 100 },
  langChipText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  lightDivider: { backgroundColor: '#F1F5F9', height: 1, marginVertical: 16 },
  modalContainer: { backgroundColor: '#FFFFFF', margin: 20, padding: 20, borderRadius: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  modalPickersRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pickerBox: { flex: 1, height: 90, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8 },
  pickerBoxDone: { backgroundColor: '#F0FDF4', borderColor: '#16A34A', borderStyle: 'solid' },
  pickerText: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 4, textAlign: 'center' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  modalCancelText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  modalSubmitBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});