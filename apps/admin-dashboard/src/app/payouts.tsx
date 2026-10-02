import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AdminPayoutsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*, profiles:user_id(first_name, last_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      Alert.alert('خطا در دریافت لیست', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    setProcessingId(payoutId);
    try {
      const { error } = await supabase.rpc('approve_payout', { p_payout_id: payoutId });
      if (error) throw error;

      Alert.alert('موفقیت', 'درخواست واریز تایید شد.');
      fetchPendingPayouts();
    } catch (error: any) {
      Alert.alert('خطا در تایید', error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payoutId: string) => {
    setProcessingId(payoutId);
    try {
      const { error } = await supabase.rpc('reject_payout', {
        p_payout_id: payoutId,
        p_reason: 'اطلاعات حساب یا شماره شبا نادرست است'
      });
      if (error) throw error;

      Alert.alert('موفقیت', 'درخواست رد شد و مبلغ به کیف پول کاربر بازگشت داده شد.');
      fetchPendingPayouts();
    } catch (error: any) {
      Alert.alert('خطا در رد درخواست', error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>مدیریت درخواست‌های تسویه‌حساب</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>هیچ درخواست تسویه معلقی وجود ندارد.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.userName}>
                {item.profiles?.first_name || 'کاربر'} {item.profiles?.last_name || ''}
              </Text>
              <Text style={s.amount}>{Number(item.amount).toLocaleString('fa-IR')} ریال</Text>
            </View>

            <Text style={s.iban}>شماره شبا/حساب: {item.destination_account}</Text>
            <Text style={s.date}>تاریخ درخواست: {new Date(item.created_at).toLocaleDateString('fa-IR')}</Text>

            <View style={s.actions}>
              <TouchableOpacity
                style={[s.btn, s.btnApprove]}
                onPress={() => handleApprove(item.id)}
                disabled={processingId === item.id}
              >
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={s.btnText}>تایید و واریز</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btn, s.btnReject]}
                onPress={() => handleReject(item.id)}
                disabled={processingId === item.id}
              >
                <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
                <Text style={s.btnText}>رد درخواست</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  list: { padding: 16 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  userName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  amount: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  iban: { color: '#CBD5E1', fontSize: 13, marginBottom: 4 },
  date: { color: '#64748B', fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  btnApprove: { backgroundColor: '#10B981' },
  btnReject: { backgroundColor: '#EF4444' },
  btnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }
});