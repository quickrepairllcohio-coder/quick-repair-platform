'use server'

import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
const email = formData.get('email') as string
const password = formData.get('password') as string

const supabase = await createClient()

const { error } = await supabase.auth.signInWithPassword({
email,
password,
})

if (error) {
// چاپ دقیق خطا در ترمینال سرور تا متوجه مشکل بشویم
console.error("❌ خظای ورود:", error.message)
return { error: error.message }
}

redirect('/dashboard')
}