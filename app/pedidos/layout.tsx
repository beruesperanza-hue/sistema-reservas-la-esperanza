import prisma from '@/lib/db';
import { CartProvider } from '@/components/pedidos/CartContext';
import { PedidosSettingsProvider } from '@/components/pedidos/SettingsContext';

export const dynamic = 'force-dynamic';

export default async function PedidosLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findFirst();

  return (
    <PedidosSettingsProvider
      value={{
        aceptaEnvioDomicilio: settings?.aceptaEnvioDomicilio ?? true,
        costoEnvioCerca: settings?.costoEnvioCerca ?? 5000,
        costoEnvioLejos: settings?.costoEnvioLejos ?? 10000,
      }}
    >
      <CartProvider>{children}</CartProvider>
    </PedidosSettingsProvider>
  );
}
