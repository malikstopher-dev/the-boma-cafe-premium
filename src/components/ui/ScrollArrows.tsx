'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './ScrollArrows.module.css';

export default function ScrollArrows() {
  const [upVisible, setUpVisible] = useState(false);
  const [downVisible, setDownVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    setUpVisible(scrollTop > 150);
    setDownVisible(scrollTop < maxScroll - 150);
  }, []);

  useEffect(() => {
    setMounted(true);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!mounted) return null;

  const scrollBy = (amount: number) => {
    window.scrollBy({ top: amount, behavior: 'smooth' });
  };

  return (
    <div className={styles.container} aria-hidden="true">
      <button
        className={`${styles.arrow} ${styles.up} ${upVisible ? styles.visible : ''}`}
        onClick={() => scrollBy(-window.innerHeight * 0.6)}
        aria-label="Scroll up"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 11V3M7 3L3 7M7 3L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className={`${styles.arrow} ${styles.down} ${downVisible ? styles.visible : ''}`}
        onClick={() => scrollBy(window.innerHeight * 0.6)}
        aria-label="Scroll down"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3V11M7 11L11 7M7 11L3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
