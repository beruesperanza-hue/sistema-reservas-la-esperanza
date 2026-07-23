import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'La Esperanza de los Ascurra · Taberna española en Villa Crespo',
  description: 'La taberna de España en Buenos Aires. Auténticas tapas españolas, vermut y vinos desde 2011. Reservá tu mesa online en Villa Crespo.',
  keywords: 'tapas españolas Buenos Aires, restaurante español Villa Crespo, taberna española, vermut Buenos Aires, comida española Argentina, tortilla española',
  authors: [{ name: 'La Esperanza de los Ascurra' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'La Esperanza de los Ascurra · Taberna española en Villa Crespo',
    description: 'La taberna de España en Buenos Aires. Auténticas tapas españolas desde 2011.',
    images: [
      {
        url: `${SITE_URL}/hero-platos.jpg`,
        width: 1200,
        height: 630,
        alt: 'La Esperanza - Tapas españolas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Esperanza de los Ascurra · Taberna española',
    description: 'La taberna de España en Buenos Aires. Reservá tu mesa online.',
    images: [`${SITE_URL}/hero-platos.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="LB4Re5tJqEiMPC7HyoLthz1X59aSAQ3A4iCNmMGVDk4" />


        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Lora:wght@400;600&display=swap" rel="stylesheet" />

        {/* Schema.org Restaurant Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              '@id': `${SITE_URL}/#restaurant`,
              name: 'La Esperanza de los Ascurra',
              image: `${SITE_URL}/hero-platos.jpg`,
              description:
                'La Esperanza de los Ascurra es una taberna española en Villa Crespo, Buenos Aires, que sirve tapas y vermut desde 2011.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Aguirre 526',
                addressLocality: 'Buenos Aires',
                addressRegion: 'CABA',
                postalCode: 'C1414ASL',
                addressCountry: 'AR',
              },
              telephone: '+54 9 11 2182-3702',
              email: 'eventoslaesperanza@gmail.com',
              url: SITE_URL,
              priceRange: '$$',
              servesCuisine: ['Española', 'Tapas'],
              foundingDate: '2011',
              acceptsReservations: `${SITE_URL}/reservas`,
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                  opens: '19:30',
                  closes: '23:30',
                },
              ],
              sameAs: [
                'https://www.instagram.com/esperanza_ascurra/',
                'https://www.facebook.com/laesperanzadelosascurra/',
                'https://www.tripadvisor.com/Restaurant_Review-g312741-d6416931-Reviews-La_Esperanza_De_Los_Ascurra-Buenos_Aires_Capital_Federal_District.html',
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E4YFZ5K4DB"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-E4YFZ5K4DB');
            `,
          }}
        />
      </body>
    </html>
  );
}
