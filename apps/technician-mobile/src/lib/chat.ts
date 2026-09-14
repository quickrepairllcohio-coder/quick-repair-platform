import { supabase } from './supabase';
export async function listJobMessages(jobId:string){
  const {data,error}=await supabase.from('job_messages').select('id,job_id,sender_user_id,sender_type,body,media_url,media_type,status,read_at,created_at').eq('job_id',jobId).order('created_at',{ascending:true});
  if(error) throw error; return data||[];
}
export async function sendJobMessage(jobId:string, body:string, mediaUrl?:string, mediaType?:string){
  const {data,error}=await supabase.rpc('send_job_message',{p_job_id:jobId,p_body:body||null,p_media_url:mediaUrl||null,p_media_type:mediaType||null});
  if(error) throw error; return data;
}
export function subscribeToJobChat(jobId:string,onMessage:(payload:any)=>void){
  const channel=supabase.channel(`job:${jobId}:chat`,{config:{private:true}})
    .on('broadcast',{event:'message_created'},onMessage).subscribe();
  return ()=>{supabase.removeChannel(channel);};
}
