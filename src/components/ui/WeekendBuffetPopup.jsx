"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import styles from "./WeekendBuffetPopup.module.css";

const POPUP_SLIDES = [
  {
    src: "/popup1.png",
    alt: "The Boma Café Special Promotion",
  },
  {
    src: "/breakfast-buffet.jpeg",
    alt: "The Boma Café Weekend Breakfast Buffet",
  },
];

const SESSION_KEY = "boma_popup_shown";
const ROTATION_INTERVAL = 5000;

export default function WeekendBuffetPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const intervalRef = useRef(null);
  const lightboxImgRef = useRef(null);

  const hasShownThisSession = useCallback(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  const markAsShown = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // sessionStorage not available, ignore
    }
  }, []);

  useEffect(() => {
    if (hasShownThisSession()) return;
    const timer = setTimeout(() => {
      setIsVisible(true);
      markAsShown();
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasShownThisSession, markAsShown]);

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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible]);

  // Lightbox ESC key handler
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const goToSlide = useCallback((index) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsFading(false);
    }, 300);
    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % POPUP_SLIDES.length);
        setIsFading(false);
      }, 300);
    }, ROTATION_INTERVAL);
  }, []);

  const handleImageError = useCallback((index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleImageClick = useCallback(() => {
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const findNextAvailableSlide = useCallback((startFrom) => {
    for (let i = 0; i < POPUP_SLIDES.length; i++) {
      const checkIndex = (startFrom + i) % POPUP_SLIDES.length;
      if (!imageErrors[checkIndex]) return checkIndex;
    }
    return -1;
  }, [imageErrors]);

  if (!isVisible) return null;

  const allImagesFailed = Object.keys(imageErrors).length >= POPUP_SLIDES.length;
  if (allImagesFailed) return null;

  const displaySlideIndex = imageErrors[currentSlide]
    ? findNextAvailableSlide(currentSlide)
    : currentSlide;

  if (displaySlideIndex === -1) return null;

  const currentSlideData = POPUP_SLIDES[displaySlideIndex];

  return (
    <>
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close popup"
          >
            ×
          </button>

          <button
            className={styles.imageLink}
            onClick={handleImageClick}
            aria-label="View full-size image"
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
          </button>

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

      {lightboxOpen && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button
            className={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            ×
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              ref={lightboxImgRef}
              src={currentSlideData.src}
              alt={currentSlideData.alt}
              className={styles.lightboxImage}
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
