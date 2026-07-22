'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GalleryBoards from '@/components/gallery/GalleryBoards';
import OptimizedHero from '@/components/ui/OptimizedHero';
import { getReservationLink } from '@/data/businessInfo';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Gallery.module.css';

const categories = ['All', 'Events', 'Food', 'Venue', 'People', 'Promotions'];

export default function GalleryPage() {
  const [settings, setSettings] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const publicData = await fetch('/api/cms/public', { cache: 'no-cache' }).then(r => r.json());
        setSettings(publicData.settings || {});
        setGallery(publicData.gallery || []);
      } catch (error) {
        console.error('Error loading gallery data:', error);
      }
    };
    loadData();
  }, []);

  const featuredImages = useMemo(() => {
    if (gallery.length === 0) return [];
    const featured = gallery.filter((g: any) => g.isFeatured);
    return featured.length > 0 ? featured : gallery.slice(0, 6);
  }, [gallery]);

  useEffect(() => {
    if (featuredImages.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % featuredImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredImages.length]);

  const filteredGallery = activeCategory === 'All' 
    ? gallery 
    : gallery.filter((item: any) => item.category === activeCategory);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index]);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const goToPrev = () => {
    const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : lightboxImages.length - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  const goToNext = () => {
    const newIndex = lightboxIndex < lightboxImages.length - 1 ? lightboxIndex + 1 : 0;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setTimeout(() => {
      const gridSection = document.getElementById('gallery-grid');
      if (gridSection) {
        gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const contactPhoneRaw = settings?.contact?.phone?.replace(/\s/g, '') || '';
  const reservationLink = getReservationLink(contactPhoneRaw);

  return (
    <>
      <Header />
      <main>
        <div style={isMobile ? { marginTop: '-60px' } : undefined}>
          <OptimizedHero
            poster="/hero/hero-gallery.jpg"
            videoSrc="/videos/gallery-hero.mp4"
            mobileVideoSrc="/videos/gallery-mobile.mp4"
            contentAlign={isMobile ? 'center' : 'bottom'}
          >
            {!isMobile && (
              <>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, var(--warm) 0%, var(--warm-light) 100%)',
                  padding: '0.4rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--dark-brown)',
                  marginBottom: '1rem',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}>
                  Our Gallery
                </div>
                <h1 style={{
                  fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                  color: 'var(--white)',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  textShadow: '0 3px 25px rgba(0,0,0,0.35)',
                  letterSpacing: '-0.5px',
                }}>
                  Gallery
                </h1>
                <p style={{
                  color: 'rgba(253, 248, 243, 0.92)',
                  fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                  maxWidth: '650px',
                  margin: '0 auto',
                  lineHeight: 1.65,
                  textShadow: '0 2px 15px rgba(0,0,0,0.25)',
                }}>
                  Food, fire, people, music and open-air moments at The Boma Café.
                </p>
              </>
            )}
          </OptimizedHero>
        </div>

        {isMobile && (
          <div style={{
            background: 'var(--bg-alt)',
            padding: '2rem 5% 3rem',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, var(--warm) 0%, var(--warm-light) 100%)',
              padding: '0.4rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--dark-brown)',
              marginBottom: '1rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}>
              Our Gallery
            </div>
            <h1 style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              color: 'var(--white)',
              marginBottom: '1rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
            }}>
              Gallery
            </h1>
            <p style={{
              color: 'rgba(253, 248, 243, 0.92)',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.65,
            }}>
              Food, fire, people, music and open-air moments at The Boma Café.
            </p>
          </div>
        )}

        {/* Featured Moments Carousel */}
        <section className={styles.carouselSection}>
          <div className={styles.carouselContainer} onClick={() => featuredImages.length > 0 && openLightbox(featuredImages.map((i: any) => i.url), featuredIndex)}>
            {featuredImages.length > 0 ? (
              <AnimatePresence mode="sync">
                <motion.div
                  key={featuredIndex}
                  className={styles.carouselSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ backgroundImage: `url(${featuredImages[featuredIndex]?.url || ''})` }}
                />
              </AnimatePresence>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem' }}>📷</span>
              </div>
            )}
            <div className={styles.carouselOverlay}>
              <div>
                <span className={styles.carouselBadge}>Featured</span>
                <h2 className={styles.carouselTitle}>Welcome to The Boma Cafe</h2>
                <p className={styles.carouselDesc}>Experience the rustic charm and warm hospitality</p>
              </div>
            </div>
            <button 
              className={`${styles.carouselNav} ${styles.carouselNavPrev}`}
              onClick={(e) => { e.stopPropagation(); setFeaturedIndex(prev => prev > 0 ? prev - 1 : featuredImages.length - 1); }}
            >
              ‹
            </button>
            <button 
              className={`${styles.carouselNav} ${styles.carouselNavNext}`}
              onClick={(e) => { e.stopPropagation(); setFeaturedIndex(prev => (prev + 1) % featuredImages.length); }}
            >
              ›
            </button>
            <div className={styles.carouselDots}>
              {featuredImages.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.carouselDot} ${idx === featuredIndex ? styles.carouselDotActive : styles.carouselDotInactive}`}
                  onClick={(e) => { e.stopPropagation(); setFeaturedIndex(idx); }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Category Boards Section */}
        <GalleryBoards onImageClick={openLightbox} onCategoryClick={handleCategoryClick} galleryItems={gallery} />

        {/* Filtered Gallery Grid */}
        <section id="gallery-grid" style={{ background: 'var(--bg)', padding: 'var(--space-3xl) 5%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text)', marginBottom: '1rem' }}>
                {activeCategory === 'All' ? 'All Photos' : `${activeCategory} Photos`}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            {filteredGallery.length > 0 ? (
              <div className={styles.galleryGrid}>
                {filteredGallery.map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    className={styles.galleryItem}
                    onClick={() => openLightbox(filteredGallery.map((i: any) => i.imageUrl || i.url), idx)}
                  >
                    <img 
                      src={item.imageUrl || item.url} 
                      alt={item.alt || `Gallery ${idx + 1}`}
                      className={styles.galleryImage}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateCard}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.6 }}>📸</div>
                <h3 className={styles.emptyStateTitle}>
                  {activeCategory === 'All' ? 'Gallery Coming Soon' : `${activeCategory} Photos Coming Soon`}
                </h3>
                <p className={styles.emptyStateDesc}>
                  Our gallery is being updated. Visit us on Instagram or WhatsApp us to see the latest atmosphere, food, and event photos.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a 
                    href="https://www.instagram.com/the_boma_cafe" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.socialLinkIg}
                  >
                    <span>📷</span>
                    <span>Instagram</span>
                  </a>
                  <a 
                    href="https://wa.me/27715921190"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.socialLinkWa}
                  >
                    <span>💬</span>
                    <span>WhatsApp Us</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Atmosphere CTA */}
        <section className={styles.atmosphereCta}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--white)', marginBottom: '1rem' }}>
              Step Inside The Boma Atmosphere
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Explore our open-air setting, firepit evenings, food moments and celebrations.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/experience" className={styles.ctaPrimaryBtn}>
                View Experience
              </Link>
              <a 
                href="https://wa.me/27715921190?text=Hi%20The%20Boma%20Caf%C3%A9%2C%20I%20would%20like%20to%20book%20a%20table.%0AName%3A%0ADate%3A%0ATime%3A%0ANumber%20of%20guests%3A%0ASpecial%20request%3A"
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.ctaOutlineBtn}
              >
                Book via WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Social CTA */}
        <section className={styles.socialCta}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className={styles.socialCtaTitle}>
              Follow the atmosphere
            </h2>
            <div className={styles.socialButtonRow}>
              <a 
                href="https://www.instagram.com/the_boma_cafe" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialBtnInstagram}
              >
                <span>📷</span>
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.tiktok.com/@thebomacafe" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialBtnTiktok}
              >
                <span>🎵</span>
                <span>TikTok</span>
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61552775920918" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialBtnFacebook}
              >
                <span>👍</span>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </section>

        {/* Lightbox */}
        {lightboxImage && (
          <div className={styles.lightbox} onClick={closeLightbox}>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <img 
                src={lightboxImage} 
                alt="Gallery" 
                className={styles.lightboxImage}
              />
            </div>
            <button 
              className={styles.lightboxClose}
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              ✕
            </button>
            {lightboxImages.length > 1 && (
              <>
                <button 
                  className={styles.lightboxPrev}
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button 
                  className={styles.lightboxNext}
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </main>
      <Footer settings={settings} />
    </>
  );
}