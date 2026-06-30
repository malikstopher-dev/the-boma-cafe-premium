import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart";
import { BookingProvider } from "@/lib/booking";
import CartButton from "@/components/ui/CartButton";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import { BUSINESS_INFO } from "@/lib/whatsappConfig";
import MobileBottomBar from "@/components/ui/MobileBottomBar";
import ScrollArrows from "@/components/ui/ScrollArrows";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": BUSINESS_INFO.name,
  "url": BUSINESS_INFO.website,
  "telephone": BUSINESS_INFO.phone,
  "email": BUSINESS_INFO.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": BUSINESS_INFO.address.street,
    "addressLocality": BUSINESS_INFO.address.suburb,
    "addressRegion": BUSINESS_INFO.address.city,
    "postalCode": BUSINESS_INFO.address.postalCode,
    "addressCountry": BUSINESS_INFO.address.country
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": BUSINESS_INFO.coordinates.lat,
    "longitude": BUSINESS_INFO.coordinates.lng
  },
  "openingHours": "Mo-Su 08:00-23:59",
  "servesCuisine": ["South African", "Wood-Fired Pizza", "Braai", "Burgers", "Curries"],
  "priceRange": "R50–R250",
  "hasMap": "https://maps.google.com/?q=127+Wroxham+Road+Paulshof+Sandton",
  "sameAs": [
    BUSINESS_INFO.social.facebook,
    BUSINESS_INFO.social.instagram
  ],
  "amenityFeature": [
    {"@type":"LocationFeatureSpecification","name":"Kids Play Area","value":true},
    {"@type":"LocationFeatureSpecification","name":"Outdoor Seating","value":true},
    {"@type":"LocationFeatureSpecification","name":"Firepits","value":true},
    {"@type":"LocationFeatureSpecification","name":"Live Entertainment","value":true}
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": BUSINESS_INFO.name,
  "url": BUSINESS_INFO.website,
  "author": {
    "@type": "Person",
    "name": "Stopher Malik"
  },
  "creator": {
    "@type": "Organization",
    "name": "SMK Web Design",
    "url": "https://stopher-malik.co.za"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BUSINESS_INFO.website}/menu?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export const metadata = {
  title: "The Boma Café | Rustic Open-Air Restaurant in Paulshof, Sandton",
  description: "Escape the city at The Boma Café — Sandton's hidden rustic gem. Breakfast, lunch & dinner under a thatched roof with firepits, kids play area, and live entertainment. 127 Wroxham Rd, Paulshof.",
  keywords: "The Boma Café, restaurant Paulshof, restaurant Sandton, outdoor dining Johannesburg, Boma Cafe, events venue Paulshof, rustic restaurant South Africa, firepit dining, Paulshof cafe, Sandton restaurant, Johannesburg restaurant",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://www.thebomacafe.co.za/",
    siteName: "The Boma Café",
    title: "The Boma Café | Rustic Restaurant in Paulshof, Sandton",
    description: "Open-air rustic dining, wood-fired pizza, braai platters, kids play area & live entertainment. Sandton's best kept secret.",
    images: [
      {
        url: "https://www.thebomacafe.co.za/assets/images/og-hero.jpg",
        width: 1200,
        height: 630,
        alt: "The Boma Café - Rustic Open-Air Restaurant",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Boma Café | Paulshof, Sandton",
    description: "Rustic open-air dining in the heart of Sandton.",
    images: ["https://www.thebomacafe.co.za/assets/images/og-hero.jpg"],
  },
  alternates: {
    canonical: "https://www.thebomacafe.co.za/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`:root { --font-display: 'Playfair Display', serif; --font-body: 'Poppins', sans-serif; }`}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a0f0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Boma POS" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen">
        <canvas id="particle-canvas" aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.9;" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(){var c=document.getElementById('particle-canvas');if(!c)return;var ctx=c.getContext('2d');var p=[];var s=[];
            function resize(){c.width=window.innerWidth;c.height=window.innerHeight}
            window.addEventListener('resize',resize);resize();
            function E(){this.reset(true)}
            E.prototype.reset=function(i){this.x=Math.random()*c.width;this.y=i?Math.random()*c.height:c.height+Math.random()*40;this.size=Math.random()*4+1.5;this.speedY=-(Math.random()*1+0.3);this.speedX=(Math.random()-0.5)*0.6;this.opacity=Math.random()*0.6+0.2;this.life=Math.random()*0.5+0.4;this.decay=Math.random()*0.003+0.001;var cl=['255,200,80','255,160,40','255,120,20','255,80,10'];this.color=cl[Math.floor(Math.random()*cl.length)];this.pulse=Math.random()*Math.PI*2};
            E.prototype.update=function(){this.pulse+=0.02;this.x+=this.speedX+Math.sin(this.pulse)*0.3;this.y+=this.speedY;this.speedY*=0.998;this.life-=this.decay;this.size=this.size*(0.9+0.1*Math.sin(this.pulse));if(this.y<-30||this.life<=0)this.reset(false)};
            E.prototype.draw=function(){ctx.beginPath();ctx.arc(this.x,this.y,Math.max(this.size*this.life,0.5),0,Math.PI*2);var g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size*3);g.addColorStop(0,'rgba('+this.color+','+this.opacity*this.life+')');g.addColorStop(0.4,'rgba('+this.color+','+this.opacity*this.life*0.4+')');g.addColorStop(1,'rgba('+this.color+',0)');ctx.fillStyle=g;ctx.fill()};
            for(var i=0;i<40;i++)p.push(new E());
            function anim(){ctx.clearRect(0,0,c.width,c.height);for(var i=0;i<p.length;i++){p[i].update();p[i].draw()}requestAnimationFrame(anim)}
            anim()})();
          `
        }} />
        <AuthProvider>
          <CartProvider>
            <BookingProvider>
              {children}
              <ScrollToTopButton />
              <ScrollArrows />
              <CartButton />
              <MobileBottomBar />
            </BookingProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}