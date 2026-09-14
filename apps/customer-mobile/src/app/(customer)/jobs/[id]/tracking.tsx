import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../../lib/supabase';

export default function Tracking() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [tech, setTech] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const load = async () => {
      const { data } = await supabase.from('jobs')
        .select('id,job_number,status,assigned_technician_id,properties(addresses(latitude,longitude,address_line1,city,state,zip_code))')
        .eq('id', id).single();
      if (active) setJob(data);
      const { data: latest } = await supabase.from('technician_locations')
        .select('latitude,longitude').eq('job_id', id).order('recorded_at', { ascending: false }).limit(1).maybeSingle();
      if (active && latest) setTech({ latitude: Number(latest.latitude), longitude: Number(latest.longitude) });
      if (active) setLoading(false);
      channel = supabase.channel(`customer_tracking:${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'technician_locations', filter: `job_id=eq.${id}` }, payload => {
          if (active) setTech({ latitude: Number(payload.new.latitude), longitude: Number(payload.new.longitude) });
        }).subscribe();
    };
    load();
    return () => { active = false; if (channel) void supabase.removeChannel(channel); };
  }, [id]);

  const address = job?.properties?.addresses;
  const customerPoint = address?.latitude && address?.longitude
    ? { latitude: Number(address.latitude), longitude: Number(address.longitude) }
    : { latitude: 41.0814, longitude: -81.5190 };
  const region = useMemo(() => ({ ...customerPoint, latitudeDelta: 0.03, longitudeDelta: 0.03 }), [customerPoint.latitude, customerPoint.longitude]);

  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  return <SafeAreaView style={s.safe}>
    <MapView style={s.map} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} initialRegion={region}>
      <Marker coordinate={customerPoint} title="Your service location" pinColor={theme.colors.primary} />
      {tech && <Marker coordinate={tech} title="Quick Repair technician" pinColor={theme.colors.secondary} />}
    </MapView>
    <View style={s.sheet}>
      <Card mode="elevated" style={s.card}>
        <Card.Content>
          <Text variant="labelLarge" style={{ color: theme.colors.secondary }}>LIVE ARRIVAL</Text>
          <Text variant="titleLarge" style={s.title}>{tech ? 'Your technician is on the way' : 'Waiting for technician location'}</Text>
          <Text style={s.muted}>{address?.address_line1 || 'Service address'}{address?.city ? ` · ${address.city}` : ''}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" onPress={() => router.push({ pathname: '/(customer)/jobs/[id]', params: { id } })}>Back to Job</Button>
          <Button mode="contained" icon="refresh" onPress={() => router.replace({ pathname: '/(customer)/jobs/[id]/tracking', params: { id } })}>Refresh</Button>
        </Card.Actions>
      </Card>
    </View>
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe:{flex:1}, center:{flex:1,alignItems:'center',justifyContent:'center'}, map:{flex:1}, sheet:{position:'absolute',left:0,right:0,bottom:0,padding:16}, card:{borderRadius:22}, title:{fontWeight:'800',marginTop:6}, muted:{color:'#5B6575',marginTop:4} });
