"use client";

import { useEffect, useRef } from "react";

import { PetalBurst, PetalRain, type PetalBurstHandle } from "../_shared/effects/Petals";
import { useInvitation } from "../_shared/runtime/context";

/**
 * Efek Renda Rimba: kelopak sakura putih terlempar dari celah pintu saat cover
 * dibuka, lalu hujan kelopak dari atas. Mode ringan: tanpa semburan, hujan
 * dikurangi (PetalRain lite).
 */
export function RendaAmbient({ opened }: { opened: boolean }) {
  const { lite } = useInvitation();
  const burst = useRef<PetalBurstHandle | null>(null);
  // Hanya menyembur bila undangan dibuka DI SESI INI (bukan mulai terbuka).
  const wasClosed = useRef(!opened);

  useEffect(() => {
    if (!opened || !wasClosed.current || lite) return;
    wasClosed.current = false;
    const t = window.setTimeout(
      () => burst.current?.burst(window.innerWidth / 2, window.innerHeight * 0.55),
      120,
    );
    return () => window.clearTimeout(t);
  }, [opened, lite]);

  return (
    <>
      <PetalBurst ref={burst} count={22} />
      {opened && <PetalRain count={9} lite={lite} enterFromTop className="z-20" />}
    </>
  );
}
