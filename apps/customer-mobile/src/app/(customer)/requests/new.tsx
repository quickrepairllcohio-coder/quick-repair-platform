import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button, Card, Chip, Divider, Icon, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { uploadRequestPhoto } from '../../../lib/mediaUpload';

type Category = { id: string; name: string; slug: string; icon?: string | null };
type Property = { id: string; address_id: string; property_type?: string | null; addresses?: { address_line1?: string; city?: string; state?: string; zip_code?: string } | null };

export default function NewRequest() {
  const theme = useTheme();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', zip: '' });
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [c, p] = await Promise.all([
      supabase.from('service_categories').select('id,name,slug,icon').eq('active', true).order('sort_order'),
      supabase.from('properties').select('id,address_id,property_type,addresses(address_line1,city,state,zip_code)').order('created_at', { ascending: false }),
    ]);
    if (c.error) Alert.alert('Services', c.error.message); else setCategories(c.data || []);
    if (!p.error) setProperties((p.data || []) as Property[]);
    setLoading(false);
  };
  const selectedProperty = useMemo(() => properties.find(x => x.id === propertyId), [properties, propertyId]);

  const next = async () => {
    if (step === 1 && !categoryId) return Alert.alert('Choose a service', 'Select the area of your home that needs help.');
    if (step === 2 && !propertyId && !newAddress) return Alert.alert('Choose a home', 'Select an existing home or add the service address.');
    if (step === 2 && newAddress) {
      if (!address.line1 || !address.city || !address.state || !address.zip) return Alert.alert('Address required', 'Please complete the service address.');
      setSaving(true);
      const { data, error } = await supabase.rpc('create_property', { p_address_line1: address.line1, p_city: address.city, p_state: address.state, p_zip_code: address.zip });
      setSaving(false);
      if (error) return Alert.alert('Could not add home', error.message);
      setPropertyId(data); setNewAddress(false); await load();
    }
    setStep(s => Math.min(3, s + 1));
  };
  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Photos permission', 'Allow photo access so you can attach pictures of the problem.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6, quality: 0.82,
    });
    if (!result.canceled) setPhotos(result.assets.map(a => a.uri).slice(0, 6));
  };

  const submit = async () => {
    if (!propertyId) return Alert.alert('Home required', 'Choose the service address.');
    if (!title.trim() && !description.trim()) return Alert.alert('Describe the problem', 'Add a short title or description so we know what is happening.');
    setSaving(true);
    const value = budget.trim() ? Number(budget.replace(/[^0-9.]/g, '')) : null;
    const { data, error } = await supabase.rpc('create_service_request', {
      p_property_id: propertyId, p_category_id: categoryId, p_title: title.trim() || null, p_description: description.trim() || null,
      p_urgency: urgency, p_is_emergency: urgency === 'emergency', p_budget_min: value, p_budget_max: value,
    });
    if (error) { setSaving(false); return Alert.alert('Request not submitted', error.message); }
    const uploadErrors: string[] = [];
    for (const uri of photos) {
      try { await uploadRequestPhoto(data, uri); } catch (e: any) { uploadErrors.push(String(e?.message || e)); }
    }
    setSaving(false);
    if (uploadErrors.length) {
      Alert.alert('Request submitted', `Your request was created, but ${uploadErrors.length} photo(s) could not be uploaded. You can continue without them.`, [{ text: 'View home', onPress: () => router.replace('/(customer)') }]);
      return;
    }
    Alert.alert('Request submitted', 'Quick Repair received your request. We will update you with the next step.', [{ text: 'View home', onPress: () => router.replace('/(customer)') }]);
  };

  return <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}><View><Text variant="labelLarge" style={{ color: theme.colors.secondary }}>QUICK REPAIR</Text><Text variant="headlineSmall" style={s.title}>Report a Problem</Text></View><Chip compact>{step} of 3</Chip></View>
      <View style={s.progress}><View style={[s.progressFill, { width: `${(step / 3) * 100}%`, backgroundColor: theme.colors.secondary }]} /></View>
      {step === 1 && <>
        <Text variant="titleLarge" style={s.section}>What needs attention?</Text><Text style={s.muted}>Choose the closest service. You can explain the exact problem next.</Text>
        <View style={s.grid}>{categories.map(c => <Card key={c.id} mode={categoryId === c.id ? 'elevated' : 'contained'} onPress={() => setCategoryId(c.id)} style={[s.category, categoryId === c.id && { borderColor: theme.colors.secondary, borderWidth: 2 }]}><Card.Content><Icon source={c.icon || ({ plumbing:'water-pump', electrical:'flash', hvac:'air-conditioner', 'roofing-gutters':'home-roof', 'drywall-paint':'format-paint', flooring:'floor-plan', 'doors-windows':'door', handyman:'tools', appliance:'fridge-outline', 'junk-dumpster':'delete-outline' } as any)[c.slug] || 'wrench-outline'} size={28} color={theme.colors.secondary} /><Text variant="titleMedium" style={s.categoryText}>{c.name}</Text></Card.Content></Card>)}</View>
      </>}
      {step === 2 && <>
        <Text variant="titleLarge" style={s.section}>Where is the service needed?</Text><Text style={s.muted}>Use a saved home or add a new service address.</Text>
        {properties.map(p => <Card key={p.id} onPress={() => { setPropertyId(p.id); setNewAddress(false); }} mode={propertyId === p.id ? 'elevated' : 'contained'} style={[s.property, propertyId === p.id && { borderColor: theme.colors.secondary, borderWidth: 2 }]}><Card.Content><View style={s.row}><Icon source="home-outline" size={26} color={theme.colors.secondary}/><View style={{ flex: 1, marginLeft: 12 }}><Text variant="titleMedium" style={{ fontWeight: '800' }}>{p.addresses?.address_line1 || 'Saved home'}</Text><Text style={s.muted}>{p.addresses?.city}, {p.addresses?.state} {p.addresses?.zip_code}</Text></View></View></Card.Content></Card>)}
        <Button mode="outlined" icon="plus" onPress={() => { setNewAddress(true); setPropertyId(''); }} style={s.addBtn}>Add another home</Button>
        {newAddress && <Card mode="contained" style={s.formCard}><Card.Content><TextInput label="Street address" value={address.line1} onChangeText={v => setAddress({ ...address, line1: v })} mode="outlined" style={s.input}/><View style={s.two}><TextInput label="City" value={address.city} onChangeText={v => setAddress({ ...address, city: v })} mode="outlined" style={s.half}/><TextInput label="State" value={address.state} onChangeText={v => setAddress({ ...address, state: v })} mode="outlined" style={s.half}/></View><TextInput label="ZIP code" keyboardType="number-pad" value={address.zip} onChangeText={v => setAddress({ ...address, zip: v })} mode="outlined" style={s.input}/></Card.Content></Card>}
        {selectedProperty && <Text style={s.selected}>✓ {selectedProperty.addresses?.address_line1}</Text>}
      </>}
      {step === 3 && <>
        <Text variant="titleLarge" style={s.section}>Tell us what is happening</Text>
        <TextInput label="Problem title" placeholder="e.g. Kitchen sink is leaking" value={title} onChangeText={setTitle} mode="outlined" style={s.input}/>
        <TextInput label="Describe the problem" placeholder="What do you see, hear or smell? When did it start?" value={description} onChangeText={setDescription} multiline numberOfLines={5} mode="outlined" style={s.input}/>
        <Text variant="titleMedium" style={s.subsection}>How urgent is it?</Text>
        <SegmentedButtons value={urgency} onValueChange={setUrgency} buttons={[{ value: 'normal', label: 'Normal' }, { value: 'urgent', label: 'Urgent' }, { value: 'emergency', label: 'Emergency' }]} />
        <TextInput label="Your budget (optional)" placeholder="$" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" mode="outlined" left={<TextInput.Affix text="$"/>} style={s.input}/>
        <Card mode="contained" style={s.mediaCard}>
          <Card.Content>
            <View style={s.mediaRow}><View style={{ flex: 1 }}><Text style={{ fontWeight: '800' }}>Photos of the problem</Text><Text style={s.muted}>{photos.length ? `${photos.length} photo(s) selected` : 'Optional — up to 6 photos'}</Text></View><Button mode="outlined" icon="image-plus" onPress={pickPhotos}>Add photos</Button></View>
          </Card.Content>
        </Card>
        <Card mode="contained" style={s.note}><Card.Content><Text style={{ fontWeight: '700' }}>You stay in control</Text><Text style={s.muted}>For work that needs inspection, the final price is confirmed before additional work begins.</Text></Card.Content></Card>
      </>}
      <Divider style={{ marginVertical: 22 }} />
      <View style={s.actions}>{step > 1 && <Button mode="text" onPress={() => setStep(x => x - 1)}>Back</Button>}{step < 3 ? <Button mode="contained" loading={saving || loading} disabled={saving || loading} onPress={next} contentStyle={s.button}>Continue</Button> : <Button mode="contained" loading={saving} disabled={saving} onPress={submit} icon="send-check" contentStyle={s.button}>Submit Request</Button>}</View>
    </ScrollView>
  </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},content:{padding:20,paddingBottom:36},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},title:{fontWeight:'800',marginTop:3},progress:{height:5,borderRadius:3,backgroundColor:'#E2E8F0',marginTop:18,overflow:'hidden'},progressFill:{height:'100%'},section:{fontWeight:'800',marginTop:24,marginBottom:6},subsection:{fontWeight:'800',marginTop:20,marginBottom:10},muted:{color:'#5B6575',lineHeight:21},grid:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:18},category:{width:'47%',borderRadius:18},categoryText:{fontWeight:'800',marginTop:12},property:{marginTop:12,borderRadius:18},row:{flexDirection:'row',alignItems:'center'},addBtn:{marginTop:14},formCard:{marginTop:14,borderRadius:18},input:{marginTop:12},two:{flexDirection:'row',gap:10},half:{flex:1,marginTop:12},selected:{color:'#0D9488',fontWeight:'800',marginTop:10},mediaCard:{marginTop:16,borderRadius:16},mediaRow:{flexDirection:'row',alignItems:'center',gap:12},note:{marginTop:16,borderRadius:16},actions:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:8},button:{height:50}});
