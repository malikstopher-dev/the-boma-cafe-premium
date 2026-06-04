'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PremiumHero from '@/components/ui/PremiumHero';
import { galleryCategories, getGalleryImages } from '@/data/galleryManifest';
import { getReservationLink } from '@/data/businessInfo';
import styles from './Gallery.module.css';

const populatedCategories = galleryCategories.filter(c => getGalleryImages(c.id).length > 0);
const categories = ['All', ...populatedCategories.map(c => c.name)];

const allImagesFlat: { url: string; alt?: string; category: string }[] = [];
populatedCategories.forEach(cat => {
  const images = getGalleryImages(cat.id);
  images.forEach(img => allImagesFlat.push({ ...img, category: cat.name }));
});

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const items = grid.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = 'true';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    items.forEach((item) => {
      item.dataset.revealed = 'false';
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [activeCategory]);

  // Subtle parallax on grid items
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const gridRect = grid.getBoundingClientRect();
          const centerY = window.innerHeight / 2;
          const offsetFromCenter = gridRect.top + gridRect.height / 2 - centerY;
          const progress = Math.max(-1, Math.min(1, offsetFromCenter / (window.innerHeight * 0.5)));

          const items = grid.querySelectorAll<HTMLElement>('[data-revealed="true"]');
          items.forEach((item, i) => {
            const depth = 0.4 + (i % 3) * 0.15;
            const move = -progress * 8 * depth;
            item.style.setProperty('--parallax-y', `${move}px`);
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredImages = activeCategory === 'All'
    ? allImagesFlat
    : allImagesFlat.filter(img => img.category === activeCategory);

  const openLightbox = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxImages([]);
    setLightboxIndex(0);
  }, []);

  const goToPrev = useCallback(() => {
    setLightboxIndex(prev => prev > 0 ? prev - 1 : lightboxImages.length - 1);
  }, [lightboxImages.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex(prev => prev < lightboxImages.length - 1 ? prev + 1 : 0);
  }, [lightboxImages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
  }, [closeLightbox, goToPrev, goToNext]);

  const reservationLink = getReservationLink();

  return (
    <>
      <Header />
      <main className={styles.main}>
        <PremiumHero
          imageUrl="/hero/hero-gallery.jpg"
          badge="Our Gallery"
          title="Gallery"
          subtitle="Food, fire, people, music and open-air moments at The Boma Cafe."
        />

        {/* Gallery Grid with Filter */}
        <section id="gallery-grid" className={styles.gridSection}>
          <div className={styles.gridInner}>
            <div className={styles.filterBar}>
              <h2 className={styles.sectionTitle}>
                {activeCategory === 'All' ? 'All Photos' : `${activeCategory} Photos`}
              </h2>
              <div className={styles.filterButtons}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredImages.length > 0 ? (
              <div className={styles.grid} ref={gridRef}>
                {filteredImages.map((img, idx) => (
                  <div
                    key={`grid-${idx}`}
                    className={styles.gridItem}
                    data-reveal
                    style={{ transitionDelay: `${idx * 80}ms` }}
                    onClick={() => openLightbox(filteredImages.map(i => i.url), idx)}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `Gallery ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className={styles.gridImg}
                    />
                    <div className={styles.gridItemOverlay}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>No photos in this category</h3>
                <p>Check back soon for new moments from The Boma Cafe.</p>
              </div>
            )}
          </div>
        </section>

        {/* Atmosphere CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Step Inside The Boma Atmosphere</h2>
            <p className={styles.ctaDesc}>
              Explore our open-air setting, firepit evenings, food moments and celebrations.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/experience" className={styles.ctaPrimary}>
                View Experience
              </Link>
              <a href={reservationLink} target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>
                Book via WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Social Follow */}
        <section className={styles.socialSection}>
          <div className={styles.socialInner}>
            <h2 className={styles.sectionTitle}>Follow the atmosphere</h2>
            <div className={styles.socialButtons}>
              <a href="https://www.instagram.com/the_boma_cafe" target="_blank" rel="noopener noreferrer" className={`${styles.socialBtn} ${styles.socialInstagram}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                Instagram
              </a>
              <a href="https://www.tiktok.com/@thebomacafe" target="_blank" rel="noopener noreferrer" className={`${styles.socialBtn} ${styles.socialTiktok}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.12.02-2.23-.22-3.18-.79-.87-.5-1.51-1.24-1.91-2.12-.39-.84-.53-1.83-.39-2.76.16-1.11.87-2.08 1.89-2.57.96-.46 2.07-.42 3.02.08.52.27.97.67 1.32 1.18.33-.01.65-.01.98-.02.12-1.52.84-2.91 2.03-3.84.67-.53 1.5-.86 2.38-1.01V.02z"/>
                </svg>
                TikTok
              </a>
              <a href="https://www.facebook.com/profile.php?id=61552775920918" target="_blank" rel="noopener noreferrer" className={`${styles.socialBtn} ${styles.socialFacebook}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
                Facebook
              </a>
            </div>
          </div>
        </section>

        {/* Lightbox */}
        {lightboxImages.length > 0 && (
          <div className={styles.lightbox} onClick={closeLightbox} onKeyDown={handleKeyDown} tabIndex={0}>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <Image
                src={lightboxImages[lightboxIndex]}
                alt="Gallery"
                fill
                sizes="90vw"
                className={styles.lightboxImg}
                priority
              />
              <div className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            </div>
            <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {lightboxImages.length > 1 && (
              <>
                <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={(e) => { e.stopPropagation(); goToPrev(); }} aria-label="Previous">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={(e) => { e.stopPropagation(); goToNext(); }} aria-label="Next">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
