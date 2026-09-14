import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../../lib/supabase'

export default function Estimates() {
  const [items,setItems]=useState<any[]>([])
  useEffect(()=>{ supabase.from('estimates').select('*').order('created_at',{ascending:false}).then(({data})=>setItems(data??[])) },[])
  return <View style={s.c}><Text style={s.h}>Estimates</Text><FlatList data={items} keyExtractor={x=>x.id} ListEmptyComponent={<Text style={s.p}>No estimates yet.</Text>} renderItem={({item})=><Link href={{pathname:'/(customer)/estimates/[id]',params:{id:item.id}}} asChild><Pressable style={s.card}><Text style={s.n}>{item.estimate_number}</Text><Text>{item.status.toUpperCase()}</Text><Text style={s.total}>${Number(item.total).toFixed(2)}</Text></Pressable></Link>} /></View>
}
const s=StyleSheet.create({c:{flex:1,padding:24,gap:16},h:{fontSize:30,fontWeight:'800',marginBottom:12},card:{padding:18,borderWidth:1,borderColor:'#ddd',borderRadius:14,marginBottom:12,gap:6},n:{fontWeight:'800',fontSize:17},total:{fontSize:22,fontWeight:'800'},p:{color:'#666'}})
