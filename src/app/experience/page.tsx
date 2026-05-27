'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cmsService } from '@/lib/client-cms';
import PremiumHero from '@/components/ui/PremiumHero';
import { getReservationLink } from '@/data/businessInfo';

export default function ExperiencePage() {
  const [settings, setSettings] = useState<any>(null);
  const [expSettings, setExpSettings] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allSettings = await cmsService.getAllSettings();
        setSettings(allSettings);
        if (allSettings.experience) {
          setExpSettings(allSettings.experience);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadData();
  }, []);

  const experiencePillars = [
    {
      title: 'Outdoor Dining',
      description: 'Dine beneath our signature thatched roof — open-air seating with views of the firepits.',
      icon: '🍽️',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'
    },
    {
      title: 'Firepit Evenings',
      description: 'Gather around glowing firepits — perfect for cold nights, good conversations, and warm drinks.',
      icon: '🔥',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop'
    },
    {
      title: 'Weekend Buffet',
      description: 'Saturday & Sunday breakfast buffet — fresh spreads, hot dishes, and relaxed weekend vibes.',
      icon: '🥞',
      image: '/gallery/events/images (12).jpg'
    },
    {
      title: 'Family Gatherings',
      description: 'Spacious grounds, kids play area, and welcoming atmosphere for celebrations of all sizes.',
      icon: '👨‍👩‍👧‍👦',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop'
    }
  ];

    const reservationLink = getReservationLink();

  return (
    <>
      <Header />
      <main style={{ paddingTop: 0 }}>
        <div style={{ paddingTop: 80 }}>
          <PremiumHero
            imageUrl="/hero/hero-experience.png"
            badge={expSettings?.heroBadge || 'Discover'}
            title="The Boma Experience"
            subtitle="More than dining — warmth, fire, food and unforgettable moments."
          />
        </div>

        {/* 2. INTRO SECTION */}
        <section style={{ background: 'var(--cream)', padding: 'var(--space-3xl) 5%', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              color: 'var(--dark-brown)', 
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.2
            }}>
              Where Fire, Food & Atmosphere Come Together
            </h2>
            <p style={{ 
              color: 'var(--text)', 
              maxWidth: '700px', 
              margin: '0 auto',
              fontSize: '1.1rem',
              lineHeight: 1.8
            }}>
              The Boma Café is more than a restaurant — it's a warm open-air social experience in Paulshof, Sandton. 
              From lazy weekend mornings to lively evenings by the fire, every visit feels like coming home.
            </p>
          </div>
        </section>

        {/* 3. EXPERIENCE PILLARS */}
        <section style={{ background: 'var(--white)', padding: 'var(--space-3xl) 5%' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ 
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', 
                color: 'var(--dark-brown)',
                fontFamily: 'var(--font-display)',
                marginBottom: '0.5rem'
              }}>
                The Experience
              </h2>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
              gap: '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {experiencePillars.map((pillar, idx) => (
                <div key={idx} style={{
                  background: 'var(--cream)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(26, 15, 10, 0.06)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ height: '160px', overflow: 'hidden' }}>
                    <img 
                      src={pillar.image} 
                      alt={pillar.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{pillar.icon}</div>
                    <h3 style={{ 
                      fontSize: '1.15rem', 
                      color: 'var(--dark-brown)', 
                      marginBottom: '0.5rem',
                      fontWeight: 600
                    }}>
                      {pillar.title}
                    </h3>
                    <p style={{ 
                      color: 'var(--text-light)', 
                      fontSize: '0.9rem', 
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. WEEKEND BREAKFAST BUFFET — Premium Compact Card */}
        <section style={{ 
          background: 'var(--beige)', 
          padding: 'var(--space-2xl) 5%',
        }}>
          <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              background: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
            }}>
              {/* Image side */}
              <div style={{
                flex: '1 1 280px',
                position: 'relative',
                minHeight: '220px',
              }}>
                <Image
                  src="/gallery/weekend-buffet.jpg"
                  alt="Weekend Breakfast Buffet at The Boma Café"
                  fill
                  sizes="(max-width: 768px) 100vw, 280px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              {/* Content side */}
              <div style={{
                flex: '1 1 350px',
                padding: 'var(--space-xl)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.65rem',
              }}>
                <span style={{
                  display: 'inline-block',
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  padding: '0.3rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  width: 'fit-content',
                }}>
                  Weekend Breakfast Buffet
                </span>

                <h3 style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.65rem)',
                  color: 'var(--dark-brown)',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  Saturday & Sunday
                </h3>

                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  margin: 0,
                }}>
                  9:30 AM – 12:30 PM
                </p>

                <p style={{
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  margin: '0.15rem 0',
                }}>
                  Fresh pastries, hot breakfast items, fruit spreads, juices, and more.
                </p>

                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginTop: '0.15rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>R89</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Adults</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>R45</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kids</span>
                  </div>
                </div>

                <a
                  href={reservationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 1.5rem',
                    background: 'var(--primary)',
                    color: 'var(--white)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    width: 'fit-content',
                    marginTop: '0.15rem',
                  }}
                >
                  Book via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5. VENUE + EVENTS */}
        <section style={{ background: 'var(--beige)', padding: 'var(--space-3xl) 5%', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              color: 'var(--dark-brown)', 
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-display)'
            }}>
              Celebrate at The Boma
            </h2>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1.5rem', 
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}>
              {['Birthdays', 'Private Events', 'Music Nights', 'Venue Hire'].map((item, idx) => (
                <div key={idx} style={{
                  background: 'var(--cream)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  color: 'var(--dark-brown)'
                }}>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/events" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
              View Events & Venue Hire
            </Link>
          </div>
        </section>

        {/* 6. VIDEO EXPERIENCE */}
        <section id="video-section" style={{ background: 'var(--cream)', padding: 'var(--space-3xl) 5%' }}>
          <div style={{ maxWidth: '950px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <button 
                onClick={() => {
                  const videoSection = document.getElementById('video-section');
                  if (videoSection) {
                    videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                      const video = videoSection.querySelector('video');
                      if (video) video.play().catch(() => {});
                    }, 500);
                  }
                }}
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--white)',
                  marginBottom: '0.75rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: 'none'
                }}>
                Watch Now
              </button>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--dark-brown)', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                Experience The Boma Café
              </h2>
              <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
                Watch the atmosphere, energy, and experience of The Boma Café
              </p>
            </div>
            <div style={{
              background: 'var(--white)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(26, 15, 10, 0.12)'
            }}>
              <video 
                controls
                preload="metadata"
                poster="/images/about.jpg"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              >
                <source src="/videos/gallery.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section style={{ background: 'var(--white)', padding: 'var(--space-3xl) 5%', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              color: 'var(--dark-brown)', 
              marginBottom: '2rem',
              fontFamily: 'var(--font-display)'
            }}>
              Ready to Experience The Boma?
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/menu" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                View Menu
              </Link>
              <Link href="/contact" className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>
                Book Table
              </Link>
              <a 
                href={reservationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ padding: '1rem 2rem' }}
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </>
  );
}