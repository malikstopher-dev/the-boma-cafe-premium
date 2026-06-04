'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import styles from '@/app/page.module.css';

export default function FadeInSection({ 
  children, 
  className = '', 
  delay = 0, 
  animationType = 'default' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number; 
  animationType?: 'default' | 'left' | 'right' | 'scale' 
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animationClass = useMemo(() => {
    switch (animationType) {
      case 'left': return styles.revealLeft;
      case 'right': return styles.revealRight;
      case 'scale': return styles.revealScale;
      default: return '';
    }
  }, [animationType]);

  return (
    <div
      ref={ref}
      className={`${styles.fadeInSection} ${animationClass} ${isVisible ? styles.visible : ''} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
