'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { BUSINESS_INFO } from '@/lib/whatsappConfig';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/cms/public', { cache: 'no-cache' });
        const data = await res.json();
        if (data?.settings) setSettings(data.settings);
      } catch {}
    };
    load();
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/menu', label: 'Menu' },
    { href: '/bar-menu', label: 'Bar Menu' },
    { href: '/experience', label: 'Experience' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
  ];

  const leftLinks = navLinks.slice(0, 4);
  const rightLinks = navLinks.slice(4);

  const contact = settings?.contact || {};
  const phoneRaw = contact.phone?.replace(/\s/g, '') || BUSINESS_INFO.phoneRaw;
  const email = contact.email || 'info@thebomacafe.co.za';
  const mapUrl = contact.mapEmbedUrl ? `https://www.google.com/maps/embed?pb=${contact.mapEmbedUrl}` : 'https://maps.app.goo.gl/Xca93TRsznn9GN8K7';

  const waLink = `https://wa.me/${phoneRaw}?text=${encodeURIComponent('Hi The Boma Café, I would like to book a table.\nName:\nDate:\nTime:\nNumber of guests:\nSpecial request:')}`;

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <nav className={styles.navLeft}>
            {leftLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="The Boma Cafe" 
              width={354}
              height={254}
              className={styles.logoImg}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Link>

          <div className={styles.navRight}>
            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waDesktopBtn}
            >
              <WhatsAppIcon size={16} ariaLabel="" />
              <span>Book Now</span>
            </a>
            <div className={styles.icons}>
              <a href={`tel:${phoneRaw}`} className={styles.icon} aria-label="Call us">
                <i className="fas fa-phone" style={{ fontSize: '0.8rem' }} />
              </a>
              <a href={`mailto:${email}`} className={styles.icon} aria-label="Email us">
                <i className="fas fa-envelope" style={{ fontSize: '0.8rem' }} />
              </a>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.icon} aria-label="Find us on map">
                <i className="fas fa-map-marker-alt" style={{ fontSize: '0.8rem' }} />
              </a>
            </div>
          </div>
        </div>
      </header>

      <button 
        className={styles.mobileToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} ${styles.toggleIcon}`} />
      </button>

      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={e => e.stopPropagation()}>
            <nav className={styles.mobileNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className={styles.mobileCtaRow}>
              <a href={`tel:${phoneRaw}`} className={styles.mobileCtaBtn}>
                <i className="fas fa-phone" />
                <span>Call</span>
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.mobileCtaBtn}>
                <WhatsAppIcon size={20} ariaLabel="Chat on WhatsApp" />
                <span>Book Now</span>
              </a>
            </div>
            <div className={styles.mobileIcons}>
              <a href={`mailto:${email}`} className={styles.mobileIcon} aria-label="Email us">
                <i className="fas fa-envelope" />
              </a>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mobileIcon} aria-label="Find us on map">
                <i className="fas fa-map-marker-alt" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
