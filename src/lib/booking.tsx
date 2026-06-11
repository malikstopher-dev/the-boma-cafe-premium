'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import dynamic from 'next/dynamic'

const BookingModal = dynamic(() => import('@/components/ui/BookingModal'), { ssr: false })

interface BookingContextType {
  openBookingModal: () => void
  closeBookingModal: () => void
  isBookingModalOpen: boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const openBookingModal = () => setIsBookingModalOpen(true)
  const closeBookingModal = () => setIsBookingModalOpen(false)

  return (
    <BookingContext.Provider value={{ openBookingModal, closeBookingModal, isBookingModalOpen }}>
      {children}
      <BookingModal isOpen={isBookingModalOpen} onClose={closeBookingModal} />
    </BookingContext.Provider>
  )
}

export function useBookingModal() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookingModal must be used within a BookingProvider')
  }
  return context
}
