import { Metadata } from 'next';
import BarMenuClient from './BarMenuClient';

export const metadata: Metadata = {
  title: 'Bar Menu | Cocktails & Drinks at The Boma Café Sandton',
  description: 'Explore The Boma Café bar menu with signature cocktails, classic cocktails, non-alcoholic drinks, beers, wines, and refreshing beverages in Paulshof, Sandton.',
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/bar-menu',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'Bar Menu | Cocktails & Drinks at The Boma Café',
    description: 'Explore the full bar menu at The Boma Café.',
    url: 'https://www.thebomacafe.co.za/bar-menu',
    siteName: 'The Boma Café',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Bar Menu | The Boma Café',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bar Menu | The Boma Café',
    description: 'Explore the full bar menu at The Boma Café.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
};

export default function BarMenuPage() {
  return <BarMenuClient />;
}