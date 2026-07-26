'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fade + slide up the first time the element scrolls into view. */
export function Reveal({ children, className = '', delayMs = 0 }: { children: ReactNode; className?: string; delayMs?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reducedMotion()) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${delayMs}ms` : '0ms' }}
      className={`transition-all duration-[900ms] ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'} ${className}`}
    >
      {children}
    </div>
  );
}

/** Ref for a full-bleed background image that drifts slower than scroll. */
export function useParallaxRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (reducedMotion()) return;
    let ticking = false;
    const update = () => {
      const el = ref.current;
      if (el && el.parentElement) {
        const r = el.parentElement.getBoundingClientRect();
        const mid = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = `translateY(${mid * -0.12}px)`;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return ref;
}

/** Props to spread onto a button/link so it drifts slightly toward the cursor. */
export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  };
  return { ref, onMouseMove, onMouseLeave };
}
