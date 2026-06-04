"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import styles from "./WeekendBuffetPopup.module.css";

const POPUP_SLIDES = [
  {
    src: "/popup1.png",
    alt: "The Boma Café Special Promotion",
    whatsappMessage: `Hi The Boma Café, I'm interested in your current promotion!

Number of people: [please enter number of guests]

Please assist me with availability.`,
  },
  {
    src: "/breakfast-buffet.jpeg",
    alt: "The Boma Café Weekend Breakfast Buffet",
    whatsappMessage: `Hi The Boma Café, I would like to book for the Weekend Buffet Experience for Saturday/Sunday between 09:30 and 12:00.

Number of people: [please enter number of guests]

Please assist me with availability.`,
  },
];

const SESSION_KEY = "boma_popup_shown";
const ROTATION_INTERVAL = 5000;

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

  // Handle image load error - skip to next available slide
  const handleImageError = useCallback((index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Find next available slide (fallback logic)
  const findNextAvailableSlide = useCallback((startFrom) => {
    for (let i = 0; i < POPUP_SLIDES.length; i++) {
      const checkIndex = (startFrom + i) % POPUP_SLIDES.length;
      if (!imageErrors[checkIndex]) {
        return checkIndex;
      }
    }
    return -1; // All slides failed
  }, [imageErrors]);

  // Don't render if not visible or if all images have errors
  if (!isVisible) return null;

  const allImagesFailed = Object.keys(imageErrors).length >= POPUP_SLIDES.length;
  if (allImagesFailed) return null;

  // Find the actual slide to display (fallback if current failed)
  const displaySlideIndex = imageErrors[currentSlide]
    ? findNextAvailableSlide(currentSlide)
    : currentSlide;

  // If no available slide found, don't render
  if (displaySlideIndex === -1) return null;

  const currentSlideData = POPUP_SLIDES[displaySlideIndex];
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
            <Image
              src={currentSlideData.src}
              alt={currentSlideData.alt}
              className={styles.flyerImage}
              width={260}
              height={390}
              priority
              quality={90}
              sizes="260px"
              onError={() => handleImageError(displaySlideIndex)}
            />
          </div>
        </a>

        <div className={styles.dots}>
          {POPUP_SLIDES.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === displaySlideIndex ? styles.activeDot : ""}`}
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
