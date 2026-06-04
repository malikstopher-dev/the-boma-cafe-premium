"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import styles from "./WeekendBuffetPopup.module.css";

const POPUP_SLIDES = [
  {
    src: "/breakfast-buffet.jpeg",
    alt: "The Boma Café Weekend Breakfast Buffet",
    whatsappMessage: `Hi The Boma Café, I would like to book for the Weekend Buffet Experience for Saturday/Sunday between 09:30 and 12:00.

Number of people: [please enter number of guests]

Please assist me with availability.`,
  },
  {
    src: "/popup1.png",
    alt: "The Boma Café Special Promotion",
    whatsappMessage: `Hi The Boma Café, I'm interested in your current promotion!

Number of people: [please enter number of guests]

Please assist me with availability.`,
  },
];

const SESSION_KEY = "boma_popup_shown";
const ROTATION_INTERVAL = 4500;

export default function WeekendBuffetPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const intervalRef = useRef(null);

  // Check session storage to see if popup was already shown
  const hasShownThisSession = useCallback(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  // Mark popup as shown in session storage
  const markAsShown = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // sessionStorage not available, ignore
    }
  }, []);

  // Show popup after delay if not shown this session
  useEffect(() => {
    if (hasShownThisSession()) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      markAsShown();
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasShownThisSession, markAsShown]);

  // Auto-rotation logic
  useEffect(() => {
    if (!isVisible) return;

    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % POPUP_SLIDES.length);
        setIsFading(false);
      }, 300);
    }, ROTATION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  // Handle manual slide change
  const goToSlide = useCallback((index) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsFading(false);
    }, 300);

    // Restart auto-rotation
    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % POPUP_SLIDES.length);
        setIsFading(false);
      }, 300);
    }, ROTATION_INTERVAL);
  }, []);

  // Handle image load error
  const handleImageError = useCallback((index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Don't render if not visible or if all images have errors
  if (!isVisible) return null;

  const allImagesFailed = Object.keys(imageErrors).length >= POPUP_SLIDES.length;
  if (allImagesFailed) return null;

  const currentSlideData = POPUP_SLIDES[currentSlide];
  const whatsappLink = `https://wa.me/27715921190?text=${encodeURIComponent(currentSlideData.whatsappMessage)}`;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close popup"
        >
          ×
        </button>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imageLink}
          aria-label="Book via WhatsApp"
        >
          <div className={`${styles.slideContainer} ${isFading ? styles.fading : ""}`}>
            {!imageErrors[currentSlide] ? (
              <Image
                src={currentSlideData.src}
                alt={currentSlideData.alt}
                className={styles.flyerImage}
                width={260}
                height={390}
                priority
                quality={90}
                sizes="260px"
                onError={() => handleImageError(currentSlide)}
              />
            ) : (
              <div className={styles.imageError}>
                Image unavailable
              </div>
            )}
          </div>
        </a>

        <div className={styles.dots}>
          {POPUP_SLIDES.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
