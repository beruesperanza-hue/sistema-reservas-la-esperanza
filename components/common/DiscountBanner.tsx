'use client';

export default function DiscountBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-center gap-3">
        <span className="text-2xl">💵</span>
        <div className="text-center">
          <p className="font-semibold text-lg">
            <span className="text-xl">🎉 10% de descuento en efectivo</span>
          </p>
          <p className="text-sm opacity-90">Todos los días • Aplica a toda la carta</p>
        </div>
        <span className="text-2xl">💵</span>
      </div>
    </div>
  );
}
