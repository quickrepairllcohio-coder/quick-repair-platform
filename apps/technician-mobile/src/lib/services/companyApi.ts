import { supabase } from '../supabase';

export const CompanyAPI = {
  async getFleet(companyId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('parent_company_id', companyId).eq('role', 'company_tech');
    if (error) throw error;
    return data || [];
  },

  async dispatchMission(missionId: string, techId: string) {
    const { error } = await supabase.from('missions').update({ technician_id: techId, status: 'assigned', updated_at: new Date().toISOString() }).eq('id', missionId);
    if (error) throw error;
    return true;
  },
  
  async getCompanyFinances(companyId: string) {
    const techs = await this.getFleet(companyId);
    const techIds = techs.map(t => t.id);
    if (techIds.length === 0) return { totalRevenue: 0, completedMissions: 0 };

    const { data, error } = await supabase.from('missions').select('company_earnings, tech_earnings, platform_fee, total_cost').in('technician_id', techIds).eq('status', 'completed');
    if (error) throw error;
    
    const totalRevenue = data.reduce((sum, m) => sum + (Number(m.company_earnings) || 0), 0);
    return { totalRevenue, completedMissions: data.length };
  },

  // تابع جدید: استخدام نیروی جدید (ثبت در لیست انتظار)
  async inviteTechnician(companyId: string, phone: string, firstName: string, lastName: string, commissionRate: number) {
    // فرمت کردن شماره موبایل
    let formattedPhone = phone.startsWith('0') ? '+98' + phone.substring(1) : phone;
    
    const { error } = await supabase.from('fleet_invites').upsert({
      phone: formattedPhone,
      company_id: companyId,
      first_name: firstName,
      last_name: lastName,
      commission_rate: commissionRate
    });
    
    if (error) throw error;
    return true;
  }
};