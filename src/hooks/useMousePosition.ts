'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}

export function useTiltEffect(ref: RefObject<HTMLDivElement | null>, options?: { maxTilt?: number; scale?: number }) {
  const { maxTilt = 8, scale = 1.02 } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktop) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      const tiltX = -deltaY * maxTilt;
      const tiltY = deltaX * maxTilt;

      el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      el.style.transition = 'transform 0.08s ease-out';
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, maxTilt, scale]);
}
