'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface NavItem {
  label: string
  icon: string
  href: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: '📊', href: '/admin/dashboard' },
    ],
  },
  {
    label: 'Orders',
    items: [
      { label: 'Orders', icon: '📋', href: '/admin/orders' },
      { label: 'Kitchen', icon: '👨‍🍳', href: '/admin/kitchen' },
      { label: 'Bookings', icon: '📅', href: '/admin/bookings' },
    ],
  },
  {
    label: 'Menu',
    items: [
      { label: 'Menu Items', icon: '🍽️', href: '/admin/menu' },
      { label: 'Categories', icon: '🗂️', href: '/admin/categories' },
      { label: 'Bar Menu', icon: '🍹', href: '/admin/bar-menu' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Site Settings', icon: '⚙️', href: '/admin/site-settings' },
      { label: 'Events', icon: '🎉', href: '/admin/events' },
      { label: 'Promotions', icon: '🎁', href: '/admin/promotions' },
      { label: 'Gallery', icon: '🖼️', href: '/admin/gallery' },
      { label: 'Popup', icon: '🔔', href: '/admin/popup' },
      { label: 'Announcement', icon: '📢', href: '/admin/announcement' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Inquiries', icon: '✉️', href: '/admin/inquiries' },
      { label: 'Waiters', icon: '👤', href: '/admin/waiters' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Analytics', icon: '📈', href: '/admin/analytics' },
      { label: 'Marketing', icon: '🎨', href: '/admin/marketing' },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export default function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Overlay */}
      {open && <div className={styles.overlay} onClick={onClose} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.header}>
          <Link href="/admin/dashboard" className={styles.logo} onClick={onClose}>
            <span className={styles.logoText}>The Boma Café</span>
          </Link>
          <span className={styles.logoSub}>Admin</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navGroups.map(group => (
            <div key={group.label} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink} target="_blank" rel="noopener noreferrer">
            <span>🌐</span>
            View Website
          </Link>
          <button onClick={onLogout} className={styles.footerButton}>
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

// Mobile bottom navigation
export function BottomNav({ onMoreClick }: { onMoreClick?: () => void }) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Home', icon: '🏠', href: '/admin/dashboard' },
    { label: 'Orders', icon: '📋', href: '/admin/orders' },
    { label: 'Menu', icon: '🍽️', href: '/admin/menu' },
    { label: 'Content', icon: '📝', href: '/admin/events' },
    { label: 'More', icon: '⋯', href: '#' },
  ]

  return (
    <nav className={styles.bottomNav}>
      {tabs.map(tab => {
        if (tab.label === 'More') {
          return (
            <button key={tab.label} className={styles.bottomNavItem} onClick={onMoreClick}>
              <span className={styles.bottomNavIcon}>{tab.icon}</span>
              <span className={styles.bottomNavLabel}>{tab.label}</span>
            </button>
          )
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.bottomNavItem} ${pathname === tab.href || pathname.startsWith(tab.href + '/') ? styles.bottomNavItemActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>{tab.icon}</span>
            <span className={styles.bottomNavLabel}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
