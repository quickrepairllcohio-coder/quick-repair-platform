import { useEffect,useState } from 'react'
import { View,Text,FlatList,StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
export default function Invoices(){const [items,setItems]=useState<any[]>([]);useEffect(()=>{supabase.from('invoices').select('*').order('created_at',{ascending:false}).then(({data})=>setItems(data??[]))},[]);return <View style={s.c}><Text style={s.h}>Invoices</Text><FlatList data={items} keyExtractor={x=>x.id} ListEmptyComponent={<Text>No invoices yet.</Text>} renderItem={({item})=><View style={s.card}><Text style={s.n}>{item.invoice_number}</Text><Text>{item.status.toUpperCase()}</Text><Text style={s.t}>${Number(item.total).toFixed(2)}</Text></View>}/></View>}
const s=StyleSheet.create({c:{flex:1,padding:24},h:{fontSize:30,fontWeight:'800',marginBottom:18},card:{padding:18,borderWidth:1,borderColor:'#ddd',borderRadius:14,marginBottom:12,gap:6},n:{fontWeight:'800'},t:{fontSize:22,fontWeight:'800'}})
