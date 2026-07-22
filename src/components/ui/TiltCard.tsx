'use client';

import { useRef, ReactNode } from 'react';
import { useTiltEffect } from '@/hooks/useMousePosition';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  as?: 'div' | 'a';
  href?: string;
}

export default function TiltCard({ children, className = '', maxTilt = 8, scale = 1.02, as = 'div', href }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | HTMLAnchorElement>(null);
  useTiltEffect(ref as React.RefObject<HTMLDivElement | null>, { maxTilt, scale });

  if (as === 'a' && href) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={className} style={{ willChange: 'transform' }}>
        {children}
      </a>
    );
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
