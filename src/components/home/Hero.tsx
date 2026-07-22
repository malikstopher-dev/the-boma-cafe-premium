'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import OptimizedHero from '@/components/ui/OptimizedHero';
import styles from './Hero.module.css';

interface HeroProps {
  title?: string;
  subtitle?: string;
}

const slides = [
  {
    subtitle: 'Welcome to',
    title: 'The Boma Cafe',
    tagline: 'Where the Rustic Meets the Soulful!',
    cta: 'Book a Table',
    ctaLink: '/contact'
  },
  {
    subtitle: 'Escape the City',
    title: 'Rustic Ambiance',
    tagline: 'Savor your meal beneath a thatched roof',
    cta: 'Discover More',
    ctaLink: '/about'
  },
  {
    subtitle: 'More Than Just a Cafe',
    title: 'An Experience',
    tagline: 'Where nature meets the warmth of home',
    cta: 'View Events',
    ctaLink: '/experience'
  }
];

function MagneticButton({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isDesktop || reduced) return;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = Math.max(rect.width, rect.height);
      const strength = Math.min(dist / maxDist, 1) * 12;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    };

    const handleLeave = () => {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      setTimeout(() => { el.style.transition = ''; }, 400);
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  return (
    <a ref={ref} href={href} className={className} style={{ willChange: 'transform' }}>
      {children}
    </a>
  );
}

export default function Hero({ title, subtitle }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const slide = slides[currentSlide];

  const renderContent = () => (
    <div className={`${styles.content} ${isMobile ? styles.mobileContent : ''} ${isLoaded ? styles.visible : ''}`}>
      <p className={styles.subtitle}>{slide.subtitle}</p>

      {title ? (
        <h1 className={`${styles.title} ${styles.goldSheenTitle}`}>{title}</h1>
      ) : (
        <h1 className={`${styles.title} ${styles.goldSheenTitle}`}>{slide.title}</h1>
      )}

      <p className={styles.tagline}>{slide.tagline}</p>

      <div className={styles.cta}>
        <MagneticButton href={slide.ctaLink} className="btn btn-primary">
          {slide.cta}
        </MagneticButton>
        <MagneticButton href="/menu" className="btn btn-ghost">
          View Menu
        </MagneticButton>
      </div>
    </div>
  );

  return (
    <section className={styles.hero} style={isMobile ? { marginTop: '-60px' } : undefined}>
      <div style={{ position: 'relative' }}>
        <OptimizedHero
          poster="/videos/hero-poster.jpg"
          videoSrc="/videos/boma-hero.mp4"
          mobileVideoSrc="/videos/mobile-hero.mp4"
        >
          {!isMobile && renderContent()}
        </OptimizedHero>

        <div className={styles.nav}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className={styles.scroll}>
          <span>Scroll</span>
          <div className={styles.scrollIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isMobile && renderContent()}

      <div className={styles.mobileCtas}>
        <Link href="/about" className={styles.mobileCta}>Discover</Link>
        <Link href="/menu" className={styles.mobileCta}>View Menu</Link>
        <Link href="/contact" className={styles.mobileCtaPrimary}>Book a Table</Link>
        <Link href="/experience" className={styles.mobileCta}>View Events</Link>
      </div>
    </section>
  );
}
