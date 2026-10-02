import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, Avatar, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RatingScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // برچسب‌های آماده بر اساس استانداردهای روانشناسی مشتری
  const feedbackTags = [
    { id: '1', label: 'سر وقت رسید ⏰' },
    { id: '2', label: 'خوش‌برخورد و مودب 🤝' },
    { id: '3', label: 'کار تمیز و بی‌نقص ✨' },
    { id: '4', label: 'قیمت منصفانه 💰' },
    { id: '5', label: 'تخصص بالا 🔧' },
    { id: '6', label: 'رعایت نظافت محیط 🧹' },
  ];

  const toggleTag = (tagLabel: string) => {
    if (selectedTags.includes(tagLabel)) {
      setSelectedTags(selectedTags.filter(t => t !== tagLabel));
    } else {
      setSelectedTags([...selectedTags, tagLabel]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('خطا', 'لطفاً ابتدا ستاره‌های رضایت خود را انتخاب کنید.');
      return;
    }
    Alert.alert('سپاسگزاریم!', 'نظر شما ثبت شد و به بهبود کیفیت خدمات کمک می‌کند.', [
      { text: 'بازگشت به خانه', onPress: () => router.replace('/customer-demo') }
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* دکمه بستن و عنوان */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* پروفایل تکنسین و پیام موفقیت */}
        <View style={s.profileSection}>
          <View style={s.successBadge}>
            <MaterialCommunityIcons name="check-decagram" size={32} color="#10B981" />
          </View>
          <Avatar.Image size={100} source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={s.avatar} />
          <Text style={s.title}>کار به پایان رسید!</Text>
          <Text style={s.subtitle}>از عملکرد <Text style={{fontWeight: '900', color: '#0F172A'}}>بشیر رسا</Text> چقدر رضایت دارید؟</Text>
        </View>

        {/* ستاره‌های تعاملی (Interactive Stars) */}
        <View style={s.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity 
              key={star} 
              activeOpacity={0.7} 
              onPress={() => setRating(star)}
              style={s.starBtn}
            >
              <MaterialCommunityIcons 
                name={star <= rating ? "star" : "star-outline"} 
                size={48} 
                color={star <= rating ? "#F59E0B" : "#CBD5E1"} 
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.ratingHint}>
          {rating === 1 ? 'بسیار ضعیف 😞' : rating === 2 ? 'ضعیف 😕' : rating === 3 ? 'متوسط 😐' : rating === 4 ? 'خوب 🙂' : rating === 5 ? 'عالی بود! 😍' : 'برای امتیازدهی ضربه بزنید'}
        </Text>

        {/* تگ‌های سریع (نمایش در صورت امتیاز ۳ و بالاتر) */}
        {rating > 0 && (
          <View style={s.feedbackSection}>
            <Text style={s.sectionTitle}>چه چیزی توجه شما را جلب کرد؟ (اختیاری)</Text>
            <View style={s.tagsGrid}>
              {feedbackTags.map(tag => {
                const isActive = selectedTags.includes(tag.label);
                return (
                  <TouchableOpacity 
                    key={tag.id} 
                    style={[s.tagBtn, isActive && s.tagBtnActive]} 
                    onPress={() => toggleTag(tag.label)}
                  >
                    <Text style={[s.tagText, isActive && s.tagTextActive]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* کامنت متنی (برای فیدبک‌های خاص) */}
            <TextInput
              style={s.textArea}
              placeholder="نکته دیگری هست که بخواهید اضافه کنید؟..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>
        )}

      </ScrollView>

      {/* دکمه ثبت شناور */}
      <Surface style={s.footer} elevation={10}>
        <TouchableOpacity 
          style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={s.submitBtnText}>ثبت امتیاز</Text>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
      </Surface>

    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  profileSection: { alignItems: 'center', marginTop: 10 },
  avatar: { marginBottom: 16, borderWidth: 3, borderColor: '#FFF', elevation: 4 },
  successBadge: { position: 'absolute', top: -10, zIndex: 2, backgroundColor: '#FFF', borderRadius: 20, padding: 2 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },

  starsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 },
  starBtn: { padding: 4 },
  ratingHint: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#3B82F6', marginTop: 16, marginBottom: 32 },

  feedbackSection: { marginTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  tagBtn: { backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: '#E2E8F0' },
  tagBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  tagText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  tagTextActive: { color: '#2563EB', fontWeight: '800' },

  textArea: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, fontSize: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', height: 100 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  submitBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});