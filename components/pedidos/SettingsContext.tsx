'use client';

import { createContext, useContext } from 'react';

export interface PedidosSettings {
  aceptaEnvioDomicilio: boolean;
  costoEnvioCerca: number;
  costoEnvioLejos: number;
}

const SettingsContext = createContext<PedidosSettings | null>(null);

export function PedidosSettingsProvider({ value, children }: { value: PedidosSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function usePedidosSettings(): PedidosSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('usePedidosSettings debe usarse dentro de <PedidosSettingsProvider>');
  return ctx;
}
