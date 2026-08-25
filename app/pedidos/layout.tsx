import { CartProvider } from '@/components/pedidos/CartContext';

export default function PedidosLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
