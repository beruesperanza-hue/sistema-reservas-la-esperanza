import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'La Esperanza de los Ascurra | Tapas Españolas en Villa Crespo',
  description: 'Descubre auténticas tapas españolas en La Esperanza. Tortilla española, gambas al ajillo, rabas y más. Reserva tu mesa en Villa Crespo, Buenos Aires.',
  keywords: 'tapas españolas, restaurante español, Villa Crespo, Buenos Aires, tortilla, gambas, tapas argentinas, comida española',
};

export default function Home() {
  return <HomeClient />;
}
