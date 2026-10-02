import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabase';

const QUEUE_KEY = '@offline_mission_queue';

export const OfflineAPI = {
  async queueMissionUpdate(missionId: string, payload: any) {
    try {
      const currentQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
      const currentQueue = currentQueueStr ? JSON.parse(currentQueueStr) : [];
      currentQueue.push({ missionId, payload, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
    } catch (error) {
      console.error('خطا در ذخیره آفلاین', error);
    }
  },

  async syncQueue() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return; 

    const currentQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!currentQueueStr) return;
    
    const queue = JSON.parse(currentQueueStr);
    if (queue.length === 0) return;

    const failedQueue = [];
    for (const task of queue) {
      try {
        // 🧠 منطق ضد تداخل (Conflict Resolution):
        // بررسی می‌کنیم که آیا مشتری در زمان قطعی نت تکنسین، سفارش را لغو کرده است؟
        const { data: checkData, error: checkErr } = await supabase
          .from('missions')
          .select('status')
          .eq('id', task.missionId)
          .maybeSingle();
          
        if (checkErr) throw checkErr;
        
        if (checkData.status === 'canceled') {
          console.log('سفارش لغو شده بود! فاکتور آفلاین تکنسین باطل شد.');
          continue; // پرش به تسک بعدی و حذف این تسک از صف
        }

        const { error } = await supabase.from('missions').update(task.payload).eq('id', task.missionId);
        if (error) throw error;
      } catch (error) {
        failedQueue.push(task); 
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));
  }
};
