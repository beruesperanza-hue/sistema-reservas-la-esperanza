'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Aviso de pedidos nuevos para todo el panel (lo usa AdminHeader, que está en
// todas las pantallas). Consulta cada 30s los pedidos activos; los "pagado"
// son los que todavía nadie tomó. Si aparece uno que no se había visto en
// esta sesión del navegador, suena un aviso y vibra (Android).

const INTERVALO_MS = 30_000;
const CLAVE_VISTOS = 'admin_pedidos_vistos';
const CLAVE_SONIDO = 'admin_pedidos_sonido';

function leerVistos(): Set<string> | null {
  try {
    const raw = sessionStorage.getItem(CLAVE_VISTOS);
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function guardarVistos(ids: Set<string>) {
  try {
    sessionStorage.setItem(CLAVE_VISTOS, JSON.stringify([...ids]));
  } catch {}
}

let audioCtx: AudioContext | null = null;

function contextoAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

// Campanita de dos notas generada en el momento (sin archivos de audio).
export function sonarAviso() {
  const ctx = contextoAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const ahora = ctx.currentTime;
  [
    { freq: 880, t: 0 },
    { freq: 1318.5, t: 0.18 },
    { freq: 880, t: 0.6 },
    { freq: 1318.5, t: 0.78 },
  ].forEach(({ freq, t }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ahora + t);
    gain.gain.exponentialRampToValueAtTime(0.35, ahora + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ahora + t + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ahora + t);
    osc.stop(ahora + t + 0.5);
  });
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {}
}

export function useAvisoPedidos() {
  const [pendientes, setPendientes] = useState(0);
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const sonidoRef = useRef(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_SONIDO) === '1';
      setSonidoActivo(guardado);
      sonidoRef.current = guardado;
    } catch {}
  }, []);

  // Los navegadores no dejan sonar audio hasta que la persona toca la
  // pantalla: al primer toque "despertamos" el audio si el aviso está activo.
  useEffect(() => {
    const despertar = () => {
      if (sonidoRef.current) contextoAudio()?.resume();
    };
    window.addEventListener('pointerdown', despertar, { once: true });
    return () => window.removeEventListener('pointerdown', despertar);
  }, []);

  const toggleSonido = useCallback(() => {
    const nuevo = !sonidoRef.current;
    sonidoRef.current = nuevo;
    setSonidoActivo(nuevo);
    try {
      localStorage.setItem(CLAVE_SONIDO, nuevo ? '1' : '0');
    } catch {}
    if (nuevo) sonarAviso(); // prueba + desbloquea el audio con este mismo toque
  }, []);

  useEffect(() => {
    let cancelado = false;

    const revisar = async () => {
      try {
        const res = await fetch('/api/admin/pedidos?filtro=activos', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelado) return;
        const pagados: { id: string }[] = (data.pedidos || []).filter((p: { estado: string }) => p.estado === 'pagado');
        setPendientes(pagados.length);

        const vistos = leerVistos();
        const idsActuales = pagados.map((p) => p.id);
        if (vistos === null) {
          // Primera consulta de la sesión: lo que ya estaba no es "nuevo".
          guardarVistos(new Set(idsActuales));
          return;
        }
        const nuevos = idsActuales.filter((id) => !vistos.has(id));
        if (nuevos.length > 0) {
          nuevos.forEach((id) => vistos.add(id));
          guardarVistos(vistos);
          if (sonidoRef.current) sonarAviso();
          window.dispatchEvent(new CustomEvent('admin:pedido-nuevo'));
        }
      } catch {}
    };

    revisar();
    const intervalo = setInterval(revisar, INTERVALO_MS);
    // Cuando alguien avanza un pedido, el contador se actualiza al toque.
    window.addEventListener('admin:pedidos-cambio', revisar);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
      window.removeEventListener('admin:pedidos-cambio', revisar);
    };
  }, []);

  // "(2) Pedidos..." en la pestaña del navegador cuando hay pedidos sin tomar.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = pendientes > 0 ? `(${pendientes}) ${base}` : base;
  }, [pendientes]);

  return { pendientes, sonidoActivo, toggleSonido };
}
