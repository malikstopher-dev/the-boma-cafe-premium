'use client';

import { useState, useEffect } from 'react';

interface Testimonial {
  text: string;
  author: string;
  location: string;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1.25rem' }}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          style={{
            color: i < rating ? 'var(--gold)' : '#444',
            fontSize: '1.15rem',
            transition: 'transform 0.3s ease',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', minHeight: '320px' }}>
      {testimonials.map((t, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: idx === active ? 1 : 0,
            transform: idx === active ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            pointerEvents: idx === active ? 'auto' : 'none',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '5rem',
                color: 'var(--gold)',
                lineHeight: 1,
                opacity: 0.15,
                position: 'absolute',
                top: '1rem',
                left: '1.5rem',
                fontStyle: 'italic',
              }}
            >
              &quot;
            </div>
            <StarRating rating={t.rating} />
            <p
              style={{
                color: 'var(--body)',
                fontStyle: 'italic',
                lineHeight: 1.85,
                marginBottom: '1.75rem',
                fontSize: '1.05rem',
                maxWidth: '600px',
                margin: '0 auto 1.75rem',
              }}
            >
              {t.text}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  background: 'linear-gradient(135deg, var(--primary), var(--gold))',
                  color: 'var(--white)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  flexShrink: 0,
                }}
              >
                {t.author.charAt(0)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600 }}>
                  {t.author}
                </strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t.location}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '2.5rem',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            aria-label={`Go to review ${idx + 1}`}
            style={{
              width: idx === active ? '32px' : '10px',
              height: '10px',
              borderRadius: idx === active ? '6px' : '50%',
              background: idx === active ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
