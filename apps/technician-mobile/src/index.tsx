import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function TechnicianHomeScreen() {
  const { user, signOut } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssignedJobs();
    }
  }, [user]);

  const fetchAssignedJobs = async () => {
    try {
      // در یک سیستم واقعی، این کوئری بر اساس technician_id یا ساختار اعزام فیلتر می‌شود
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          status,
          created_at,
          metadata
        `)
        .in('status', ['assigned', 'scheduled', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      Alert.alert('خطای سیستم', 'ارتباط با سرور برقرار نشد. لطفاً مجدداً تلاش کنید.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, currentStatus: string) => {
    // منطق ساده برای رفتن به مرحله بعدی کار
    const nextStatusMap: Record<string, string> = {
      'assigned': 'scheduled',
      'scheduled': 'en_route',
      'en_route': 'arrived',
      'arrived': 'in_progress',
      'in_progress': 'completion_submitted'
    };
    
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    try {
      // فراخوانی تابع RPC که در فاز 8 ساخته شد
      const { error } = await supabase.rpc('transition_job_status', {
        p_job_id: jobId,
        p_new_status: nextStatus,
        p_reason: 'Status updated by technician via field app'
      });

      if (error) throw error;
      
      Alert.alert('موفقیت', 'وضعیت سفارش با موفقیت به‌روزرسانی شد.');
      fetchAssignedJobs();
    } catch (error: any) {
      Alert.alert('خطای عملیاتی', 'تغییر وضعیت امکان‌پذیر نیست. ممکن است سطح دسترسی شما کافی نباشد.');
    }
  };

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={s.loadingText}>در حال همگام‌سازی با سرور...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>داشبورد عملیاتی متخصص</Text>
          <Text style={s.headerSub}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={s.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAssignedJobs(); }} tintColor="#10B981" />}
      >
        <Text style={s.sectionTitle}>سفارشات فعال (Jobs)</Text>

        {jobs.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="#4B5563" />
            <Text style={s.emptyText}>هیچ سفارش فعالی برای شما ثبت نشده است.</Text>
          </View>
        ) : (
          jobs.map(job => (
            <View key={job.id} style={s.jobCard}>
              <View style={s.jobHeader}>
                <Text style={s.jobId}>شناسه: {job.id.substring(0,8)}</Text>
                <View style={s.statusBadge}>
                  <Text style={s.statusText}>{job.status}</Text>
                </View>
              </View>
              
              <View style={s.jobDetails}>
                <Text style={s.detailText}>ثبت شده در: {new Date(job.created_at).toLocaleDateString('fa-IR')}</Text>
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity style={s.actionBtnSecondary} onPress={() => Alert.alert('مسیریابی', 'اتصال به نقشه...')}>
                  <MaterialCommunityIcons name="navigation" size={20} color="#3B82F6" />
                  <Text style={s.actionBtnTextSecondary}>مسیریابی</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={s.actionBtnPrimary} onPress={() => handleUpdateJobStatus(job.id, job.status)}>
                  <Text style={s.actionBtnTextPrimary}>ارتقاء وضعیت (بعدی)</Text>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centerContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#E2E8F0', marginBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#94A3B8', marginTop: 12, textAlign: 'center' },
  jobCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  jobId: { color: '#94A3B8', fontSize: 12 },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
  jobDetails: { marginBottom: 16 },
  detailText: { color: '#CBD5E1', fontSize: 14, marginBottom: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 10, gap: 6 },
  actionBtnTextSecondary: { color: '#3B82F6', fontWeight: 'bold' },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', padding: 12, borderRadius: 10, gap: 6 },
  actionBtnTextPrimary: { color: '#0F172A', fontWeight: 'bold' }
});