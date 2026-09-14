import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
export async function uploadJobPhoto(jobId:string,uri:string,mediaType:'before'|'after'|'material'){
 const base64=await FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64});
 const ext=uri.split('.').pop()?.split('?')[0]||'jpg'; const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error('Not authenticated');
 const path=`${u.user.id}/${jobId}/${mediaType}/${Date.now()}.${ext}`;
 const {error:up}=await supabase.storage.from('quick-repair-media').upload(path,decode(base64),{contentType:ext==='png'?'image/png':'image/jpeg',upsert:false}); if(up) throw up;
 const {error}=await supabase.from('job_media').insert({job_id:jobId,media_type:mediaType,storage_path:path,file_name:path.split('/').pop(),mime_type:ext==='png'?'image/png':'image/jpeg',uploaded_by:u.user.id}); if(error) throw error; return path;
}
