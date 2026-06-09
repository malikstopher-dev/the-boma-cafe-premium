'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import { cmsService } from '@/lib/client-cms';
import FadeInSection from '@/components/ui/FadeInSection';
import LazySection from '@/components/ui/LazySection';
import { getReservationLink, getEventEnquiryLink } from '@/data/businessInfo';
import styles from './page.module.css';

const PopupModal = dynamic(() => import('@/components/ui/PopupModal'), { ssr: false });
const WeekendBuffetPopup = dynamic(() => import('@/components/ui/WeekendBuffetPopup'), { ssr: false });

const exploreCategories = [
  { title: 'Signature Meals', desc: 'Chef-crafted masterpieces', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop', link: '/menu?category=Signature' },
  { title: 'Wood-Fired Pizza', desc: 'Handcrafted perfection', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=450&fit=crop', link: '/menu?category=Pizza' },
  { title: 'Flame-Grilled', desc: 'Sizzling perfection', image: '/gallery/flame-grilled.jpg', link: '/menu?category=Flame-Grilled' },
  { title: 'Desserts', desc: 'Sweet endings', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=450&fit=crop', link: '/menu?category=Desserts' },
];

const signatureDishes = [
  { name: 'Classic Beef Burger', desc: 'Angus patty, cheddar, caramelized onions, fresh tomato & house sauce', price: 165, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop' },
  { name: 'Lamb Bunny Chow', desc: 'Slow-cooked lamb in aromatic spices, served in fresh bread bowl', price: 120, image: '/menu/lamb-bunny-chow.jpg' },
  { name: 'BBQ Chicken Pizza', desc: 'Grilled chicken, red onions, cilantro on smoky BBQ base', price: 180, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop' },
  { name: 'Flame-Grilled Ribs', desc: 'Succulent ribs with our signature BBQ basting', price: 250, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop' }
];

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const [popup, setPopup] = useState<any>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allSettings, pop] = await Promise.all([
          cmsService.getAllSettings(),
          cmsService.getPopup()
        ]);
        setSettings(allSettings);
        setPopup(pop);
      } catch (error) {
        console.error('Error loading CMS data:', error);
      }
    };
    loadData();
  }, []);

  const promoBar = settings?.promoBar || {};
  const branding = settings?.branding || {};

  return (
    <>
      {promoBar.isEnabled && promoBar.message && (
        <AnnouncementBar 
          text={promoBar.message} 
          link={promoBar.buttonLink} 
          linkText={promoBar.buttonText}
        />
      )}
      <Header />
      <PopupModal popup={popup} />
      <WeekendBuffetPopup />
      
      <main>
        {/* Section 1: Hero */}
        <section className={styles.heroSection}>
          <video
            className={styles.heroVideo}
            src="/boma-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/hero/slide1.jpg"
            aria-label="The Boma Cafe ambiance video"
          />
          <div className={styles.heroOverlay} />
          
          <div className={styles.heroContent}>
            <p className={styles.heroSubtitle}>Welcome to</p>
            <h1 className={styles.heroTitle}>The Boma Cafe</h1>
            <p className={styles.heroTagline}>Where the Rustic Meets the Soulful!</p>
            <div className={styles.heroCta}>
              <Link href="/menu" className="btn btn-primary">View Menu</Link>
              <a href={getReservationLink()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Book a Table</a>
            </div>
          </div>
        </section>

        {/* Section 2: Welcome */}
        <section className={styles.welcomeSection}>
          <div className="container">
            <FadeInSection className={styles.welcomeInner}>
              <span className="section-badge">Welcome</span>
              <h2 className={styles.welcomeHeading}>Welcome to The Boma Café</h2>
              <p className={styles.welcomeSub}>Rustic Elegance in the Heart of Sandton</p>
              <p className={styles.welcomeText}>
                Welcome to The Boma Café, where rustic open-air dining meets warm hospitality in the heart of Sandton. Set against thatched architecture, firepit corners, greenery, and relaxed outdoor charm, our restaurant brings together comforting food, handcrafted drinks, and memorable moments.
              </p>
              <div className={styles.welcomeChips}>
                <div className={styles.welcomeChip}>
                  <span className={styles.welcomeChipIcon}>🔥</span>
                  <div>
                    <strong>Cozy Firepits</strong>
                    <span>Warm glow for relaxed evenings</span>
                  </div>
                </div>
                <div className={styles.welcomeChip}>
                  <span className={styles.welcomeChipIcon}>🌿</span>
                  <div>
                    <strong>Lush Greenery</strong>
                    <span>A calm escape within the city</span>
                  </div>
                </div>
                <div className={styles.welcomeChip}>
                  <span className={styles.welcomeChipIcon}>🏠</span>
                  <div>
                    <strong>Thatched Roof</strong>
                    <span>Authentic rustic character</span>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Section 3: Explore Menu */}
        <section className={styles.exploreSection}>
          <div className="container">
            <FadeInSection className={styles.sectionHeader}>
              <span className="section-badge">Explore Our Menu</span>
              <h2>A Culinary Journey</h2>
              <p>From wood-fired pizzas to flame-grilled perfection, discover flavours that delight</p>
            </FadeInSection>

            <div className={styles.exploreGrid}>
              {exploreCategories.map((item, idx) => (
                <FadeInSection key={idx} delay={idx * 100} className={styles.exploreCardWrapper}>
                  <Link href={item.link} className={styles.exploreCard}>
                    <div className={styles.exploreCardImage}>
                      <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" />
                    </div>
                    <div className={styles.exploreCardContent}>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                      <span className={styles.exploreCta}>Explore <span>→</span></span>
                    </div>
                  </Link>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection className={styles.sectionCta}>
              <Link href="/menu" className="btn btn-primary btn-lg">View Full Menu</Link>
            </FadeInSection>
          </div>
        </section>

        {/* Section 4: Signature Favourites */}
        <section className={styles.signatureSection}>
          <div className="container">
            <FadeInSection className={styles.sectionHeader}>
              <span className="section-badge gold">Chef's Recommendations</span>
              <h2>Signature Favourites</h2>
              <p>Explore our chef's carefully crafted selections</p>
            </FadeInSection>
            
            <div className={styles.signatureGrid}>
              {signatureDishes.map((item, idx) => (
                <FadeInSection key={idx} delay={idx * 100} className={styles.signatureCardWrapper}>
                  <Link href="/menu" className={styles.signatureCard}>
                    <div className={styles.signatureCardImage}>
                      <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" />
                      <span className={styles.signatureBadge}>★ Featured</span>
                    </div>
                    <div className={styles.signatureCardContent}>
                      <h4>{item.name}</h4>
                      <p>{item.desc}</p>
                      <div className={styles.signatureCardFooter}>
                        <span className={styles.signaturePrice}>R{item.price}</span>
                        <span className={styles.signatureLink}>View Menu →</span>
                      </div>
                    </div>
                  </Link>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection className={styles.sectionCta}>
              <Link href="/menu" className="btn btn-primary">View Full Menu</Link>
            </FadeInSection>
          </div>
        </section>

        {/* Section 5: Signature Cocktails */}
        <LazySection>
        <section className={styles.drinksSection}>
          <div className="container">
            <FadeInSection className={styles.sectionHeader}>
              <span className="section-badge gold">Libations</span>
              <h2>Signature Cocktails</h2>
              <p>Handcrafted drinks as memorable as the evening itself</p>
            </FadeInSection>

            <div className={styles.drinksGrid}>
              {[
                { name: 'Boma Sunset', desc: 'Tropical passionfruit & citrus with a fiery sunset blush', price: 95, image: '/bar-menu/boma.jpg' },
                { name: 'Safari Sour', desc: 'Whiskey, lemon, honey & bitters — bold yet smooth', price: 110, image: '/bar-menu/Safari-sour.png' },
                { name: 'Thatched Toddy', desc: 'Warm spiced rum, honey, citrus & cinnamon stick', price: 105, image: '/bar-menu/Thatched-Toddy.jpg' },
                { name: 'Garden Spritz', desc: 'Elderflower, prosecco, mint & cucumber — refreshingly light', price: 95, image: '/bar-menu/Garden-Spritz.jpg' },
              ].map((item, idx) => (
                <FadeInSection key={idx} delay={idx * 100} className={styles.drinksCard}>
                  <div className={styles.drinksCardImage}>
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" />
                  </div>
                  <div className={styles.drinksCardContent}>
                    <h4>{item.name}</h4>
                    <p>{item.desc}</p>
                    <span className={styles.drinksPrice}>R{item.price}</span>
                  </div>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection className={styles.sectionCta}>
              <Link href="/bar-menu" className="btn btn-primary">View Bar Menu</Link>
            </FadeInSection>
          </div>
        </section>
        </LazySection>

        {/* Section 6: Experience Mini */}
        <LazySection>
        <section className={styles.experienceSection}>
          <div className="container">
            <div className={styles.experienceGrid}>
              <FadeInSection animationType="scale" className={styles.experienceImageWrapper}>
                <div className={styles.experienceImage}>
                  <Image
                    src="/gallery/venue/slide1-1980x1080.jpeg"
                    alt="The Boma Café atmosphere"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </FadeInSection>

              <FadeInSection className={styles.experienceContent}>
                <span className="section-badge">The Experience</span>
                <h3>Dine Beneath the Thatched Roof</h3>
                <p>
                  Escape the city at Sandton's hidden rustic gem. With crackling firepits, 
                  lush greenery, and live entertainment, every visit to The Boma Café is 
                  more than a meal — it's an experience.
                </p>
                <div className={styles.experienceHighlights}>
                  {[
                    { icon: '🔥', label: 'Cozy Firepits' },
                    { icon: '🌿', label: 'Lush Garden' },
                    { icon: '🎵', label: 'Live Music' },
                    { icon: '🍕', label: 'Wood-Fired Pizza' },
                  ].map((h, i) => (
                    <div key={i} className={styles.experienceHighlight}>
                      <span className={styles.experienceHighlightIcon}>{h.icon}</span>
                      <span>{h.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/experience" className="btn btn-secondary">Discover the Experience</Link>
              </FadeInSection>
            </div>
          </div>
        </section>
        </LazySection>

        {/* Section 6: Plan Your Visit */}
        <LazySection>
        <section className={styles.reservationSection}>
          <div className={styles.reservationBg} />
          <div className="container">
            <FadeInSection className={styles.reservationContent}>
              <span className="section-badge gold">Plan Your Visit</span>
              <h2>Reserve Your Table</h2>
              <p>Whether it's a romantic dinner, family gathering, or celebration with friends, we're ready to welcome you.</p>
              <div className={styles.reservationButtons}>
                <a href={getReservationLink()} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">Book a Table</a>
                <a href={getEventEnquiryLink()} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">Plan an Event</a>
              </div>
              
              <div className={styles.reservationInfo}>
                <div className={styles.reservationInfoItem}>
                  <span className={styles.reservationInfoIcon}>📞</span>
                  <strong>Call Us</strong>
                  <a href="tel:+27715921190">071 592 1190</a>
                </div>
                <div className={styles.reservationInfoItem}>
                  <span className={styles.reservationInfoIcon}>✉️</span>
                  <strong>Email</strong>
                  <a href="mailto:info@thebomacafe.co.za">info@thebomacafe.co.za</a>
                </div>
                <div className={styles.reservationInfoItem}>
                  <span className={styles.reservationInfoIcon}>📍</span>
                  <strong>Location</strong>
                  <span>Sandton, Johannesburg</span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
        </LazySection>
      </main>

      <Footer settings={settings} branding={branding} />
    </>
  );
}
