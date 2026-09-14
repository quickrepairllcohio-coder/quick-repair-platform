import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { registerForPushNotifications, subscribeToUserNotifications } from '../../../lib/notifications';

export default function NotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    await registerForPushNotifications();
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    setItems(data ?? []);
  }

  useEffect(() => {
    load();
    return () => {};
  }, []);

  useEffect(() => {
    if (!userId) return;
    return subscribeToUserNotifications(userId, ({ payload }) => {
      setItems((prev) => [payload, ...prev]);
    });
  }, [userId]);

  async function markRead(id: string) {
    await supabase.rpc('mark_notification_read', { p_notification_id: id });
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: 'read', read_at: new Date().toISOString() } : x));
  }

  return <View style={{ flex: 1, padding: 20, gap: 12 }}>
    <Text style={{ fontSize: 26, fontWeight: '800' }}>Notifications</Text>
    <FlatList data={items} keyExtractor={(x) => x.id} renderItem={({ item }) => (
      <Pressable onPress={() => markRead(item.id)} style={{ padding: 16, borderWidth: 1, borderRadius: 14, marginBottom: 10, opacity: item.read_at ? 0.65 : 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 16 }}>{item.title}</Text>
        <Text style={{ marginTop: 6 }}>{item.body}</Text>
        <Text style={{ marginTop: 8, fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</Text>
      </Pressable>
    )} ListEmptyComponent={<Text>No notifications yet.</Text>} />
  </View>;
}

