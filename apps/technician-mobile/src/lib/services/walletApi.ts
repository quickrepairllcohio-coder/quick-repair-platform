import { supabase } from '../supabase';

export const WalletAPI = {
  // دریافت موجودی کیف پول و لیست درخواست‌های قبلی
  async getWalletData(userId: string) {
    const { data: profile, error: pError } = await supabase.from('profiles').select('wallet_balance, role').eq('id', userId).maybeSingle();
    if (pError) throw pError;

    const { data: history, error: hError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (hError) throw hError;

    return { balance: profile.wallet_balance, role: profile.role, history: history || [] };
  },

  // ثبت درخواست تسویه حساب
  async requestWithdrawal(userId: string, amount: number, iban: string) {
    // 1. بررسی موجودی کافی
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).maybeSingle();
    if (!profile || profile.wallet_balance < amount) {
      throw new Error('موجودی کیف پول کافی نیست.');
    }

    // 2. کسر از کیف پول (به صورت فرضی در انتظار)
    const newBalance = profile.wallet_balance - amount;
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);

    // 3. ثبت درخواست برداشت
    const { error } = await supabase.from('withdrawals').insert([{
      user_id: userId,
      amount: amount,
      iban: iban,
      status: 'pending'
    }]);
    
    if (error) throw error;
    return newBalance;
  }
};