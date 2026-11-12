"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { PetalBurst, type PetalBurstHandle } from "../_shared/effects/Petals";

/**
 * Status bersama Tirai Beludru:
 *  - burst(x, y): semburan kelopak dari mulut amplop (lapisan di atas segalanya)
 *  - introPlayed: amplop & kartu sudah tampil lewat transisi cover → section
 *    "ayat" tidak menganimasikannya lagi (frame terakhir transisi = section 1)
 */
interface TiraiState {
  burst: (x: number, y: number) => void;
  introPlayed: boolean;
  setIntroPlayed: (v: boolean) => void;
}

const Ctx = createContext<TiraiState>({
  burst: () => undefined,
  introPlayed: false,
  setIntroPlayed: () => undefined,
});

export const useTirai = () => useContext(Ctx);

export function TiraiProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<PetalBurstHandle | null>(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const burst = useCallback((x: number, y: number) => ref.current?.burst(x, y), []);
  const value = useMemo(() => ({ burst, introPlayed, setIntroPlayed }), [burst, introPlayed]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {/* 12 kelopak: cukup ramai, ringan selama transisi amplop (sebelumnya 22) */}
      <PetalBurst ref={ref} count={12} />
    </Ctx.Provider>
  );
}
