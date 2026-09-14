import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL!; const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const supabase=createClient(url,key,{auth:{storage:{getItem:SecureStore.getItemAsync,setItem:SecureStore.setItemAsync,removeItem:SecureStore.deleteItemAsync},persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
