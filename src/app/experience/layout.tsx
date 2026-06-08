import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Boma Experience | Outdoor Dining, Firepits & Weekend Buffet in Sandton',
  description: 'Discover The Boma Café experience — rustic outdoor dining beneath thatched roofs, cozy firepit evenings, weekend breakfast buffet, and family-friendly atmosphere in Paulshof, Sandton.',
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/experience',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'The Boma Experience | Outdoor Dining & Firepits in Sandton',
    description: 'Discover The Boma Café experience — rustic outdoor dining, cozy firepits, and weekend buffet.',
    url: 'https://www.thebomacafe.co.za/experience',
    siteName: 'The Boma Café',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'The Boma Experience',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Boma Experience | Outdoor Dining & Firepits in Sandton',
    description: 'Discover The Boma Café experience — rustic outdoor dining, cozy firepits, and weekend buffet.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return children;
}