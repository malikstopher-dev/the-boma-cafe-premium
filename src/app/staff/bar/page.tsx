'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffBarRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/bar') }, [router])
  return null
}
