import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function CompanyDashboardScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [companyContext, setCompanyContext] = useState<any>(null);
  const [metrics, setMetrics] = useState({ activeJobs: 0, activeTechs: 0, todayRevenue: 0 });

  useEffect(() => {
    if (user) loadCompanyDashboard();
  }, [user]);

  const loadCompanyDashboard = async () => {
    try {
      const { data: membership, error: memError } = await supabase
        .from('company_memberships')
        .select(`
          role,
          companies ( id, name )
        `)
        .eq('user_id', user?.id)
        .in('role', ['owner', 'manager', 'dispatcher', 'finance'])
        .maybeSingle();

      if (memError) throw memError;
      
      if (!membership || !membership.companies) {
        Alert.alert('دسترسی غیرمجاز', 'شما دسترسی مدیریتی به هیچ شرکتی ندارید.');
        setLoading(false);
        return;
      }

      const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
      setCompanyContext({ ...company, userRole: membership.role });

      const [jobsRes, techsRes] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact' }).eq('company_id', company.id).in('status', ['assigned', 'en_route', 'in_progress']),
        supabase.from('company_memberships').select('id', { count: 'exact' }).eq('company_id', company.id).eq('role', 'technician')
      ]);

      setMetrics({
        activeJobs: jobsRes.count || 0,
        activeTechs: techsRes.count || 0,
        todayRevenue: 0 
      });

    } catch (error: any) {
      console.error('Error loading company data:', error.message);
      Alert.alert('خطا', 'مشکلی در بارگذاری اطلاعات سازمانی پیش آمد.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color="#00E5FF" />
        <Text style={s.loadingText}>در حال بارگذاری کنسول عملیاتی...</Text>
      </View>
    );
  }

  if (!companyContext) {
    return (
      <View style={s.centerContainer}>
        <MaterialCommunityIcons name="shield-alert" size={48} color="#EF4444" />
        <Text style={s.loadingText}>شما فاقد دسترسی سازمانی هستید.</Text>
        <TouchableOpacity onPress={signOut} style={[s.actionBtn, { marginTop: 20 }]}>
          <Text style={s.actionBtnText}>خروج از حساب</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{companyContext.name}</Text>
          <Text style={s.headerSub}>نقش سازمانی: {companyContext.userRole.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={s.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCompanyDashboard(); }} tintColor="#00E5FF" />}
      >
        <View style={s.metricsGrid}>
          <View style={s.metricCard}>
            <MaterialCommunityIcons name="briefcase-clock" size={28} color="#00E5FF" />
            <Text style={s.metricValue}>{metrics.activeJobs}</Text>
            <Text style={s.metricLabel}>سفارشات در جریان</Text>
          </View>
          <View style={s.metricCard}>
            <MaterialCommunityIcons name="account-hard-hat" size={28} color="#10B981" />
            <Text style={s.metricValue}>{metrics.activeTechs}</Text>
            <Text style={s.metricLabel}>تکنسین‌های ناوگان</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>عملیات ناوگان (Dispatch & Operations)</Text>
        <View style={s.menuGrid}>
          <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('در حال توسعه', 'اتصال به پنل توزیع مشاغل...')}>
            <View style={[s.menuIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.1)' }]}>
              <MaterialCommunityIcons name="map-marker-path" size={28} color="#00E5FF" />
            </View>
            <Text style={s.menuItemText}>نقشه و توزیع (Dispatch)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('در حال توسعه', 'اتصال به مدیریت تکنسین‌ها...')}>
            <View style={[s.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialCommunityIcons name="account-group" size={28} color="#10B981" />
            </View>
            <Text style={s.menuItemText}>مدیریت تکنسین‌ها</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('در حال توسعه', 'بررسی مدارک انطباق...')}>
            <View style={[s.menuIconBox, { backgroundColor: 'rgba(245, 166, 35, 0.1)' }]}>
              <MaterialCommunityIcons name="shield-check" size={28} color="#F5A623" />
            </View>
            <Text style={s.menuItemText}>مدارک و انطباق (Compliance)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('در حال توسعه', 'گزارش‌های مالی و دفتر کل...')}>
            <View style={[s.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <MaterialCommunityIcons name="finance" size={28} color="#EF4444" />
            </View>
            <Text style={s.menuItemText}>امور مالی و تسویه</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090E17' },
  centerContainer: { flex: 1, backgroundColor: '#090E17', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8A9BB3', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#121A28', borderBottomWidth: 1, borderColor: '#2A3B55' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#00E5FF', marginTop: 4 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#121A28', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A3B55' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 8 },
  metricLabel: { fontSize: 11, color: '#8A9BB3', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItem: { width: '48%', backgroundColor: '#121A28', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A3B55', marginBottom: 4 },
  menuIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuItemText: { color: '#E2E8F0', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  actionBtn: { backgroundColor: '#2A3B55', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold' }
});