import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Esperanza de los Ascurra | Tapas Españolas en Villa Crespo, Buenos Aires',
  description: 'La taberna de España en Buenos Aires. Auténticas tapas españolas, vinos artesanales y experiencia gastronómica única. Reserva tu mesa online en Villa Crespo.',
  keywords: 'tapas españolas Buenos Aires, restaurante español Villa Crespo, tapas Buenos Aires, reserva de restaurant, comida española Argentina, tortilla española',
  viewport: 'width=device-width, initial-scale=1',
  authors: [{ name: 'La Esperanza de los Ascurra' }],
  openGraph: {
    type: 'restaurant',
    url: 'https://sistema-reservas-la-esperanza-production.up.railway.app',
    title: 'La Esperanza de los Ascurra | Tapas Españolas en Buenos Aires',
    description: 'La taberna de España en Buenos Aires. Auténticas tapas españolas desde 2011.',
    images: [
      {
        url: 'https://sistema-reservas-la-esperanza-production.up.railway.app/hero-platos.jpg',
        width: 1200,
        height: 630,
        alt: 'La Esperanza - Tapas españolas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Esperanza de los Ascurra | Tapas Españolas',
    description: 'La taberna de España en Buenos Aires. Reserva tu mesa online.',
    images: ['https://sistema-reservas-la-esperanza-production.up.railway.app/hero-platos.jpg'],
  },
  alternates: {
    canonical: 'https://sistema-reservas-la-esperanza-production.up.railway.app',
  },
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

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-E4YFZ5K4DB"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-E4YFZ5K4DB');
            `,
          }}
        />

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
              name: 'La Esperanza de los Ascurra',
              image: 'https://sistema-reservas-la-esperanza-production.up.railway.app/hero-platos.jpg',
              description: 'La taberna de España en Buenos Aires. Auténticas tapas españolas desde 2011.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Aguirre 526',
                addressLocality: 'Villa Crespo',
                addressRegion: 'Buenos Aires',
                postalCode: 'C1414',
                addressCountry: 'AR',
              },
              telephone: '+54-11-XXXX-XXXX',
              email: 'eventoslaesperanza@gmail.com',
              url: 'https://sistema-reservas-la-esperanza-production.up.railway.app',
              priceRange: '$$',
              cuisines: ['Spanish', 'Tapas'],
              servesCuisine: 'Spanish',
              foundingDate: '2011',
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                  opens: '19:00',
                  closes: '23:30',
                },
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: 'Sunday',
                  opens: '19:00',
                  closes: '23:30',
                },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.0',
                reviewCount: '2207',
              },
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
