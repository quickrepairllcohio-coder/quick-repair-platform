'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RealtimeListener() {
  const router = useRouter()

  useEffect(() => {
    // رفرش نامرئی (Soft Refresh) هر ۵ ثانیه
    // این کار داده‌ها را از سرور می‌گیرد اما باعث پرش یا ریلود کامل صفحه نمی‌شود
    // و تمام محدودیت‌های RLS را به صورت کاملاً امن دور می‌زند.
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  return null
}