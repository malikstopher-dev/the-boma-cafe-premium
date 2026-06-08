import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About The Boma Café | Our Story & Team | Paulshof, Sandton',
  description: 'Meet the team behind The Boma Café. Discover our story, our founder Mahendra Singh, and the passion driving Sandton\'s favourite rustic open-air restaurant.',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.thebomacafe.co.za/about',
    siteName: 'The Boma Café',
    title: 'About The Boma Café | Our Story & Team',
    description: 'Discover the story and vision behind The Boma Café — rustic open-air dining in the heart of Sandton.',
    images: [
      {
        url: 'https://www.thebomacafe.co.za/assets/images/og-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'About The Boma Café',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About The Boma Café | Paulshof, Sandton',
    description: 'Meet the team and discover the story behind The Boma Café in Paulshof, Sandton.',
    images: ['https://www.thebomacafe.co.za/assets/images/og-hero.jpg'],
  },
  alternates: {
    canonical: 'https://www.thebomacafe.co.za/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
