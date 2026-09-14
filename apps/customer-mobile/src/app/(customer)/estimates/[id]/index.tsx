import { useEffect,useState } from 'react'
import { View,Text,Pressable,StyleSheet,ActivityIndicator,Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../../lib/supabase'
import { approveEstimate } from '../../../../lib/estimates'
import { createCheckout } from '../../../../lib/billing'

export default function EstimateDetail(){
 const {id}=useLocalSearchParams<{id:string}>(); const [e,setE]=useState<any>(); const [items,setItems]=useState<any[]>([]); const [busy,setBusy]=useState(false)
 const load=()=>{supabase.from('estimates').select('*').eq('id',id).single().then(({data})=>setE(data)); supabase.from('estimate_items').select('*').eq('estimate_id',id).then(({data})=>setItems(data??[]))}
 useEffect(load,[id])
 if(!e)return <View style={s.c}><ActivityIndicator/></View>
 const approve=async()=>{setBusy(true);try{await approveEstimate(id);load()}catch(err:any){Alert.alert('Error',err.message)}finally{setBusy(false)}}
 const pay=async()=>{setBusy(true);try{await createCheckout(id)}catch(err:any){Alert.alert('Payment',err.message)}finally{setBusy(false)}}
 return <View style={s.c}><Text style={s.h}>{e.estimate_number}</Text><Text>Status: {e.status}</Text>{items.map(i=><View style={s.row} key={i.id}><Text style={{flex:1}}>{i.description} × {i.quantity}</Text><Text>${Number(i.amount).toFixed(2)}</Text></View>)}<View style={s.total}><Text>Subtotal</Text><Text>${Number(e.subtotal).toFixed(2)}</Text></View><View style={s.total}><Text>Tax</Text><Text>${Number(e.tax).toFixed(2)}</Text></View><View style={s.total}><Text style={{fontWeight:'800'}}>Total</Text><Text style={{fontWeight:'800'}}>${Number(e.total).toFixed(2)}</Text></View>{e.status==='sent'&&<Pressable disabled={busy} onPress={approve} style={s.btn}><Text style={s.bt}>{busy?'Working…':'Approve Estimate'}</Text></Pressable>}{e.status==='approved'&&<Pressable disabled={busy} onPress={pay} style={s.pay}><Text style={s.bt}>{busy?'Opening…':'Pay Securely'}</Text></Pressable>}</View>
}
const s=StyleSheet.create({c:{flex:1,padding:24,gap:16},h:{fontSize:30,fontWeight:'800'},row:{flexDirection:'row',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee'},total:{flexDirection:'row',justifyContent:'space-between',paddingTop:6},btn:{backgroundColor:'#111',padding:18,borderRadius:14,marginTop:12},pay:{backgroundColor:'#0a7',padding:18,borderRadius:14,marginTop:12},bt:{color:'#fff',textAlign:'center',fontWeight:'800',fontSize:17}})
