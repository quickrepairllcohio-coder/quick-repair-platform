import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // پاک کردن نشست (Session) کاربر در سوپابیس
  await supabase.auth.signOut()
  
  // هدایت کاربر به صفحه ورود
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}