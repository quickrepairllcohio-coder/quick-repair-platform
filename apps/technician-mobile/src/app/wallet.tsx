import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // فرم تسویه
  const [payoutAmount, setPayoutAmount] = useState('');
  const [iban, setIban] = useState('');

  useEffect(() => {
    if (user) loadFinancialData();
  }, [user]);

  const loadFinancialData = async () => {
    try {
      if (!user) return;
      
      // ۱. دریافت موجودی امن از طریق تابع سروری
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', {
        p_user_id: user.id
      });
      if (balanceError) throw balanceError;
      setBalance(balanceData || 0);

      // ۲. دریافت تاریخچه تراکنش‌ها از دفتر کل
      const { data: txData, error: txError } = await supabase
        .from('ledgers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (error: any) {
      console.error('Error loading financials:', error);
      Alert.alert('خطا', 'دریافت اطلاعات مالی با مشکل مواجه شد.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('خطا', 'مبلغ درخواستی نامعتبر است.');
      return;
    }
    if (amount > balance) {
      Alert.alert('خطا', 'مبلغ درخواستی بیشتر از موجودی کیف پول است.');
      return;
    }
    if (!iban || iban.length < 24) {
      Alert.alert('خطا', 'شماره شبا یا کارت معتبر نیست.');
      return;
    }

    setSubmitting(true);
    try {
      // ارسال درخواست تسویه به موتور مالی سرور
      const { error } = await supabase.rpc('request_payout', {
        p_amount: amount,
        p_destination_account: iban
      });

      if (error) throw error;

      Alert.alert('موفقیت', 'درخواست تسویه حساب با موفقیت ثبت شد و از موجودی شما کسر گردید.');
      setPayoutAmount('');
      setIban('');
      loadFinancialData(); // به‌روزرسانی موجودی و تاریخچه
    } catch (error: any) {
      Alert.alert('خطا در ثبت درخواست', error.message || 'عملیات با خطا مواجه شد.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>کیف پول و تسویه‌حساب</Text>
      </View>

      <ScrollView 
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFinancialData(); }} tintColor="#10B981" />}
      >
        {/* کارت موجودی */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>موجودی قابل برداشت (ریال)</Text>
          <Text style={s.balanceValue}>{balance.toLocaleString('fa-IR')}</Text>
        </View>

        {/* فرم درخواست واریز */}
        <View style={s.payoutForm}>
          <Text style={s.sectionTitle}>درخواست واریز به حساب</Text>
          
          <TextInput
            style={s.input}
            placeholder="مبلغ درخواستی (ریال)"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={payoutAmount}
            onChangeText={setPayoutAmount}
          />
          <TextInput
            style={s.input}
            placeholder="شماره شبا (IR...)"
            placeholderTextColor="#64748B"
            value={iban}
            onChangeText={setIban}
          />

          <TouchableOpacity style={s.submitBtn} onPress={handleRequestPayout} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Text style={s.submitBtnText}>ثبت درخواست واریز</Text>
                <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#0F172A" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* تاریخچه تراکنش‌ها */}
        <Text style={[s.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>گردش حساب (Ledger)</Text>
        {transactions.length === 0 ? (
          <Text style={s.emptyText}>هیچ تراکنشی یافت نشد.</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={s.txCard}>
              <View style={s.txIconBox(tx.amount > 0)}>
                <MaterialCommunityIcons 
                  name={tx.amount > 0 ? "arrow-bottom-left" : "arrow-top-right"} 
                  size={24} 
                  color={tx.amount > 0 ? "#10B981" : "#EF4444"} 
                />
              </View>
              <View style={s.txDetails}>
                <Text style={s.txType}>{tx.transaction_type}</Text>
                <Text style={s.txDate}>{new Date(tx.created_at).toLocaleDateString('fa-IR')}</Text>
              </View>
              <Text style={s.txAmount(tx.amount > 0)}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('fa-IR')}
              </Text>
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
  header: { padding: 20, paddingTop: 50, backgroundColor: '#1E293B', borderBottomWidth: 1, borderColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  balanceCard: { backgroundColor: '#10B981', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10 },
  balanceLabel: { color: '#064E3B', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  balanceValue: { color: '#F8FAFC', fontSize: 32, fontWeight: 'bold' },
  payoutForm: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#E2E8F0', marginBottom: 12 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#38BDF8', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  submitBtnText: { color: '#0F172A', fontWeight: 'bold', fontSize: 15 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  txIconBox: (isPositive: boolean) => ({ padding: 8, borderRadius: 8, backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', marginRight: 12 }),
  txDetails: { flex: 1 },
  txType: { color: '#E2E8F0', fontSize: 14, fontWeight: 'bold' },
  txDate: { color: '#64748B', fontSize: 12, marginTop: 4 },
  txAmount: (isPositive: boolean) => ({ color: isPositive ? '#10B981' : '#EF4444', fontSize: 15, fontWeight: 'bold' })
});