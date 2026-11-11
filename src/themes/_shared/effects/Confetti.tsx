"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * Konfeti ringan berbasis <canvas> (tanpa library). Loop requestAnimationFrame
 * hanya berjalan selama ada partikel, jadi tidak membebani CPU saat diam.
 * rAF otomatis berhenti saat tab tidak aktif.
 */

export interface ConfettiHandle {
  /** Ledakan dari titik (px relatif canvas, default tengah atas). */
  burst: (opts?: { x?: number; y?: number; count?: number; spread?: number }) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  shape: 0 | 1 | 2; // persegi, lingkaran, pita
  life: number;
}

export const Confetti = forwardRef<ConfettiHandle, { colors: string[]; className?: string }>(
  function Confetti({ colors, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particles = useRef<Particle[]>([]);
    const frame = useRef<number | null>(null);
    const colorsRef = useRef(colors);
    colorsRef.current = colors;

    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, width, height);

      particles.current = particles.current.filter((p) => p.y < height / dpr + 40 && p.life > 0);
      for (const p of particles.current) {
        p.vy += 0.16; // gravitasi
        p.vx *= 0.985; // hambatan udara
        p.vy *= 0.985;
        p.x += p.vx + Math.sin(p.rot) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;

        ctx.save();
        ctx.translate(p.x * dpr, p.y * dpr);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life / 40);
        if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, (p.w / 2) * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Efek berputar 3D sederhana: lebar mengecil mengikuti sin(rot).
          const w = p.w * dpr * (p.shape === 2 ? 0.45 : Math.abs(Math.cos(p.rot * 1.3)) + 0.15);
          ctx.fillRect(-w / 2, (-p.h * dpr) / 2, w, p.h * dpr);
        }
        ctx.restore();
      }

      frame.current = particles.current.length > 0 ? requestAnimationFrame(loop) : null;
    };

    useImperativeHandle(ref, () => ({
      burst({ x, y, count = 120, spread = 1 } = {}) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ox = x ?? rect.width / 2;
        const oy = y ?? rect.height * 0.35;
        const palette = colorsRef.current;
        for (let i = 0; i < count; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
          const speed = 6 + Math.random() * 9;
          particles.current.push({
            x: ox,
            y: oy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.3,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            color: palette[i % palette.length],
            shape: (i % 3) as 0 | 1 | 2,
            life: 220 + Math.random() * 120,
          });
        }
        if (frame.current === null) frame.current = requestAnimationFrame(loop);
      },
    }));

    // Ukuran canvas mengikuti elemen (tajam di layar retina).
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        aria-hidden
        style={{ width: "100%", height: "100%" }}
      />
    );
  },
);
