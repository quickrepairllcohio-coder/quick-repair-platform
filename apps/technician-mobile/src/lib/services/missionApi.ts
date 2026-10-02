import { supabase } from '../supabase';

export const MissionAPI = {
  async submitRating(missionId: string, technicianId: string, newRating: number, feedback: string) {
    const { error: missionError } = await supabase.from('missions').update({ rating: newRating, feedback }).eq('id', missionId);
    if (missionError) throw missionError;

    const { data: profile } = await supabase.from('profiles').select('rating, rating_count, consecutive_five_stars').eq('id', technicianId).maybeSingle();

    const currentRating = profile?.rating || 5.0;
    const currentCount = profile?.rating_count || 0;
    let combo = profile?.consecutive_five_stars || 0;

    const updatedCount = currentCount + 1;
    const updatedRating = ((currentRating * currentCount) + newRating) / updatedCount;

    // 🧠 منطق گیمیفیکیشن:
    if (newRating === 5) {
      combo += 1;
    } else {
      combo = 0; // اگر کمتر از ۵ شد، کمبو صفر می‌شود
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        rating: parseFloat(updatedRating.toFixed(1)), 
        rating_count: updatedCount,
        consecutive_five_stars: combo
      })
      .eq('id', technicianId);

    if (profileError) throw profileError;
    return combo; // برگرداندن کمبو برای نمایش تشویق
  },

  async cancelMission(missionId: string) {
    const { error } = await supabase.from('missions').update({ status: 'canceled' }).eq('id', missionId);
    if (error) throw error;
  },

  // 🧠 تابع ثبت شکایت و اختلاف
  async disputeMission(missionId: string, reason: string) {
    const { error } = await supabase.from('missions').update({ is_disputed: true, dispute_reason: reason }).eq('id', missionId);
    if (error) throw error;
  }
};
