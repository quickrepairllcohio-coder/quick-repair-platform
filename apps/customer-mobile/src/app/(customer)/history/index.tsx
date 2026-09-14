import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function HomeHistory(){
  const [rows,setRows]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  async function load(){ setLoading(true); const {data,error}=await supabase.rpc('customer_home_history'); if(error) Alert.alert('History',error.message); setRows(data||[]); setLoading(false); }
  useEffect(()=>{load()},[]);
  if(loading) return <View style={s.center}><ActivityIndicator/></View>;
  return <View style={s.page}><Text style={s.title}>Home History</Text><Text style={s.sub}>Completed Quick Repair work at your properties.</Text>
    <FlatList data={rows} keyExtractor={x=>x.job_id} contentContainerStyle={{gap:12,paddingVertical:16}} renderItem={({item})=><View style={s.card}>
      <Text style={s.service}>{item.service_name}</Text><Text>Job {item.job_number}</Text><Text>Completed: {item.completed_at?new Date(item.completed_at).toLocaleDateString():'—'}</Text><Text>Total: ${Number(item.total||0).toFixed(2)}</Text>
      <Text style={item.warranty_status==='active'?s.good:s.muted}>Warranty: {item.warranty_status||'none'}{item.warranty_expires_at?` · through ${new Date(item.warranty_expires_at).toLocaleDateString()}`:''}</Text>
      {item.review_rating ? <Text>Review: {'★'.repeat(item.review_rating)}{'☆'.repeat(5-item.review_rating)}</Text> : null}<Link href={{pathname:'/(customer)/jobs/[id]',params:{id:item.job_id}}} asChild><Pressable style={s.chat}><Text style={s.chatText}>Open Job Chat</Text></Pressable></Link>
    </View>}/>
  </View>
}
const s=StyleSheet.create({page:{flex:1,padding:20,backgroundColor:'#fff'},center:{flex:1,alignItems:'center',justifyContent:'center'},title:{fontSize:30,fontWeight:'800'},sub:{color:'#666',marginTop:6},card:{borderWidth:1,borderColor:'#ddd',borderRadius:14,padding:16,gap:7},service:{fontSize:18,fontWeight:'800'},good:{fontWeight:'700'},muted:{color:'#777'},chat:{marginTop:6,padding:12,borderRadius:10,backgroundColor:'#111'},chatText:{color:'#fff',textAlign:'center',fontWeight:'800'}});
