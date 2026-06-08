import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | The Boma Café · Photos of Food, Venue & Events',
  description: 'Explore our gallery featuring photos of delicious food, our rustic venue, live events, and memorable moments at The Boma Café in Paulshof, Sandton.',
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/gallery',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'Gallery | The Boma Café',
    description: 'Explore our gallery featuring photos of delicious food, our rustic venue, and live events.',
    url: 'https://www.thebomacafe.co.za/gallery',
    siteName: 'The Boma Café',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Gallery | The Boma Café',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery | The Boma Café',
    description: 'Explore our gallery featuring photos of delicious food, our rustic venue, and live events.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}