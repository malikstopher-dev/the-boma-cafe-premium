import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Reservations | The Boma Café · Paulshof, Sandton',
  description: 'Book a table or enquire about events at The Boma Café. 127B Wroxham Rd, Paulshof, Sandton. Call 071 592 1190.',
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/contact',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'Contact & Reservations | The Boma Café',
    description: 'Book a table or enquire about events at The Boma Café.',
    url: 'https://www.thebomacafe.co.za/contact',
    siteName: 'The Boma Café',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact The Boma Café',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact & Reservations | The Boma Café',
    description: 'Book a table at The Boma Café.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}