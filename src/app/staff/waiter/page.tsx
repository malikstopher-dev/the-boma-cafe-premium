'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffWaiterRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/waiter') }, [router])
  return null
}
