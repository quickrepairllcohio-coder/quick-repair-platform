import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const KEY='quick-repair-offline-sync-v2';
export type OfflineOp={id:string;deviceId:string;operation:string;entityType:string;entityId?:string;payload:any;clientCreatedAt:string;clientOperationId:string};

const uuid=()=>globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export async function enqueueOffline(op:Omit<OfflineOp,'id'|'clientOperationId'>){
  const item:OfflineOp={...op,id:uuid(),clientOperationId:uuid()};
  const raw=await AsyncStorage.getItem(KEY); const q:OfflineOp[]=raw?JSON.parse(raw):[];
  q.push(item); await AsyncStorage.setItem(KEY,JSON.stringify(q)); return item;
}
export async function readOfflineQueue(){const raw=await AsyncStorage.getItem(KEY);return raw?JSON.parse(raw) as OfflineOp[]:[];}
export async function clearOfflineQueue(){await AsyncStorage.removeItem(KEY);}

export async function syncOfflineQueue(){
  const state=await NetInfo.fetch(); if(!state.isConnected) return {synced:0,failed:0,remaining:(await readOfflineQueue()).length};
  const q=await readOfflineQueue(); let synced=0; let failed=0; const remaining:OfflineOp[]=[];
  const {data:{user}}=await supabase.auth.getUser(); if(!user) return {synced:0,failed:0,remaining:q.length};
  for(const op of q){
    try{
      const {data:row,error}=await supabase.rpc('enqueue_offline_operation',{p_device_id:op.deviceId,p_operation:op.operation,p_entity_type:op.entityType,p_entity_id:op.entityId||null,p_payload:op.payload||{},p_client_created_at:op.clientCreatedAt,p_client_operation_id:op.clientOperationId});
      if(error) throw error;
      const {error:applyError}=await supabase.rpc('apply_offline_operation',{p_queue_id:row.id});
      if(applyError) throw applyError;
      synced++;
    }catch(e){ failed++; remaining.push(op); }
  }
  await AsyncStorage.setItem(KEY,JSON.stringify(remaining));
  return {synced,failed,remaining:remaining.length};
}
