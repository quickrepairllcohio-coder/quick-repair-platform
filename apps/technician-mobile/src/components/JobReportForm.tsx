import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

interface JobReportFormProps {
  jobId: string;
  onSuccess?: () => void;
}

export default function JobReportForm({ jobId, onSuccess }: JobReportFormProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]); // برای توسعه بعدی (آپلود واقعی)

  const handleSubmitReport = async () => {
    if (!summary.trim()) {
      Alert.alert('خطا', 'لطفاً شرح خدمات انجام شده را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      // ثبت گزارش کار مستقیماً در دیتابیس امن
      const { error: reportError } = await supabase
        .from('job_reports')
        .insert({
          job_id: jobId,
          technician_id: user?.id,
          summary_notes: summary,
          media_urls: mediaUrls,
          parts_used: [] // می‌تواند به یک فرم جداگانه متصل شود
        });

      if (reportError) {
         if(reportError.code === '23505') throw new Error('گزارش نهایی برای این کار قبلاً ثبت شده است.');
         throw reportError;
      }

      // پس از ثبت موفق، وضعیت شغل را به تکمیل‌شده ارتقا می‌دهیم
      const { error: statusError } = await supabase.rpc('transition_job_status', {
        p_job_id: jobId,
        p_new_status: 'completion_submitted',
        p_reason: 'Technical report submitted'
      });

      if (statusError) throw statusError;

      Alert.alert('موفقیت', 'گزارش کار با موفقیت ثبت شد.');
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('خطا', error.message || 'مشکلی در ثبت گزارش پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockImageUpload = () => {
    // این بخش در توسعه‌های بعدی به اکسپو ImagePicker متصل می‌شود
    // و فایل در باکت job-media آپلود می‌گردد.
    Alert.alert('شبیه‌سازی آپلود', 'اتصال به دوربین و گالری دستگاه به زودی اضافه می‌شود.');
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>ثبت گزارش پایان کار</Text>
      
      <Text style={s.label}>شرح عملیات انجام شده:</Text>
      <TextInput
        style={s.textArea}
        placeholder="مثال: تعویض برد اصلی و شارژ گاز دستگاه..."
        placeholderTextColor="#64748B"
        multiline
        numberOfLines={5}
        value={summary}
        onChangeText={setSummary}
      />

      <Text style={s.label}>مستندات تصویری (اختیاری):</Text>
      <TouchableOpacity style={s.uploadBtn} onPress={handleMockImageUpload}>
        <MaterialCommunityIcons name="camera-plus" size={24} color="#3B82F6" />
        <Text style={s.uploadBtnText}>افزودن تصویر</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitReport} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#F8FAFC" />
        ) : (
          <>
            <Text style={s.submitBtnText}>ثبت نهایی گزارش</Text>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#F8FAFC" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginTop: 16 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 16 },
  label: { fontSize: 14, color: '#CBD5E1', marginBottom: 8 },
  textArea: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155', textAlignVertical: 'top', minHeight: 100 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 8, gap: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderStyle: 'dashed' },
  uploadBtnText: { color: '#3B82F6', fontWeight: 'bold' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 15 }
});