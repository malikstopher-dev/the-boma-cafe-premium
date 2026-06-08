import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Menu | The Boma Café · Paulshof, Sandton',
  description: 'Browse the full Boma Café menu — breakfast, burgers, wood-fired pizza, braai platters, curries & more. Customise and order via WhatsApp.',
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/menu',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'Our Menu | The Boma Café',
    description: 'Browse the full Boma Café menu — breakfast, burgers, wood-fired pizza, braai platters, curries & more.',
    url: 'https://www.thebomacafe.co.za/menu',
    siteName: 'The Boma Café',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Menu | The Boma Café',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Menu | The Boma Café',
    description: 'Browse the full Boma Café menu.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
