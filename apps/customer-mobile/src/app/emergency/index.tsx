import { View, Text, StyleSheet } from 'react-native';
export default function Emergency() { return <View style={s.c}><Text style={s.h}>Emergency Request</Text><Text style={s.p}>If there is immediate danger to life, fire, gas, carbon monoxide, or serious electrical danger, contact the appropriate emergency service first.</Text><Text style={s.p}>Quick Repair will collect the incident details for dispatch when it is safe to do so.</Text></View> }
const s=StyleSheet.create({c:{flex:1,padding:24,justifyContent:'center',gap:18},h:{fontSize:28,fontWeight:'800'},p:{fontSize:17,lineHeight:25}});
