import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Banner, Text, useTheme } from 'react-native-paper';
import { readOfflineQueue } from '../lib/offlineSync';

export default function OfflineBanner() {
  const theme = useTheme();
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);
  useEffect(() => {
    const refresh = async () => setQueued((await readOfflineQueue()).length);
    refresh();
    const sub = NetInfo.addEventListener(state => { setOffline(state.isConnected !== true); refresh(); });
    return () => sub();
  }, []);
  if (!offline && queued === 0) return null;
  return <Banner visible icon="cloud-off-outline" style={{ backgroundColor: offline ? '#FFF3E0' : '#E0F2FE' }}>
    <Text style={{ color: offline ? '#92400E' : '#075985', fontWeight: '700' }}>
      {offline ? 'Offline mode: changes are being saved on this device.' : `${queued} change${queued === 1 ? '' : 's'} waiting to sync.`}
    </Text>
  </Banner>;
}
