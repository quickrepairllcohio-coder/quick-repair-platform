import { View, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Button, Card, Chip, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../providers/AuthProvider';

const actions = [
  ['My Estimates', '/(customer)/estimates', 'file-document-outline'],
  ['My Invoices', '/(customer)/invoices', 'receipt-text-outline'],
  ['Home History', '/(customer)/history', 'home-clock-outline'],
  ['Notifications', '/(customer)/notifications', 'bell-outline'],
] as const;

export default function Home() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const name = user?.user_metadata?.first_name || 'there';
  return <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.top}><View><Text variant="labelLarge" style={{ color: theme.colors.secondary }}>QUICK REPAIR</Text><Text variant="headlineSmall" style={s.welcome}>Hi, {name}</Text></View><View style={[s.avatar,{backgroundColor:theme.colors.primary}]}><Text style={{color:'#fff',fontWeight:'800'}}>{name.slice(0,1).toUpperCase()}</Text></View></View>
      <Card mode="elevated" style={s.hero}>
        <Card.Content>
          <Chip icon="shield-check-outline" compact textStyle={{ color: theme.colors.primary }}>Trusted home service</Chip>
          <Text variant="headlineMedium" style={s.heroTitle}>What needs fixing?</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 24 }}>Tell us what is wrong. We will guide you through the right service and next step.</Text>
          <Link href="/(customer)/requests/new" asChild><Button mode="contained" icon="plus-circle-outline" contentStyle={s.btnContent} style={s.primaryBtn}>Report a Problem</Button></Link>
          <Link href="/emergency" asChild><Button mode="outlined" icon="alert-circle-outline" textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>Emergency Now</Button></Link>
        </Card.Content>
      </Card>
      <Text variant="titleLarge" style={s.section}>Your Quick Access</Text>
      <View style={s.grid}>{actions.map(([label,href,icon]) => <Link key={href} href={href} asChild><Card mode="contained" style={s.action}><Card.Content><Icon source={icon} size={27} color={theme.colors.secondary}/><Text variant="titleMedium" style={{marginTop:12,fontWeight:'700'}}>{label}</Text></Card.Content></Card></Link>)}</View>
      <Button mode="text" icon="logout" textColor={theme.colors.onSurfaceVariant} onPress={signOut} style={{marginTop:12}}>Sign out</Button>
    </ScrollView>
  </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1},content:{padding:20,paddingBottom:32},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},welcome:{fontWeight:'800',marginTop:3},avatar:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center'},hero:{borderRadius:24,marginBottom:26},heroTitle:{fontWeight:'800',marginTop:18,marginBottom:8},primaryBtn:{marginTop:20,marginBottom:10},btnContent:{height:50},section:{fontWeight:'800',marginBottom:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},action:{width:'47%',borderRadius:18}});
