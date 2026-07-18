import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Esperanza - Reservas',
  description: 'Sistema de reservas para La Esperanza. Reserva tu mesa ahora.',
  keywords: 'restaurante, reservas, La Esperanza',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Lora:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
