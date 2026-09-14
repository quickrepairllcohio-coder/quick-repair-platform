import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
export async function uploadRequestPhoto(requestId:string,uri:string){
 const base64=await FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64}); const ext=uri.split('.').pop()?.split('?')[0]||'jpg';
 const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error('Not authenticated'); const path=`${u.user.id}/requests/${requestId}/${Date.now()}.${ext}`;
 const {error:up}=await supabase.storage.from('quick-repair-media').upload(path,decode(base64),{contentType:ext==='png'?'image/png':'image/jpeg',upsert:false}); if(up) throw up;
 const {error}=await supabase.from('request_media').insert({request_id:requestId,media_type:'photo',storage_path:path,file_name:path.split('/').pop(),mime_type:ext==='png'?'image/png':'image/jpeg',uploaded_by:u.user.id}); if(error) throw error; return path;
}
