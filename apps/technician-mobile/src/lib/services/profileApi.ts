import { supabase } from '../supabase';

export const ProfileAPI = {
  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async toggleOnlineStatus(userId: string, currentStatus: boolean) {
    const { error } = await supabase.from('profiles').update({ is_online: !currentStatus }).eq('id', userId);
    if (error) throw error;
    return !currentStatus;
  }
};