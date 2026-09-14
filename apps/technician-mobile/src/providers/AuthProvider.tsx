import React,{createContext,useContext,useEffect,useState} from 'react'; import {supabase} from '../lib/supabase';
const C=createContext<any>({session:null}); export const useAuth=()=>useContext(C);
export function AuthProvider({children}:{children:React.ReactNode}){const [session,setSession]=useState<any>(null); useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return()=>subscription.unsubscribe()},[]); return <C.Provider value={{session}}>{children}</C.Provider>}
