"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { velvetBg } from "./art";

/**
 * PEMBUKA AMPLOP (sekali per kunjungan): tirai beludru + segel logo emas di
 * tengah; segel retak menjadi dua, tirai tersibak. ±2 dtk, bisa dilewati.
 * Skrip sebaris menandai <html data-intro> SEBELUM tirai digambar:
 *  - "play" → tampil & animasi; "skip" → tidak tampil sama sekali
 *    (sudah pernah dilihat di sesi ini / pengguna meminta gerak dikurangi).
 * Judul hero menunggu tirai (lihat .hero-word di marketing.css).
 */
const KEY = "undangku:intro";
const DURATION = 2300;

const INLINE = `(function(){try{var d=document.documentElement;var s=sessionStorage.getItem("${KEY}");var r=matchMedia("(prefers-reduced-motion: reduce)").matches;d.dataset.intro=(s||r)?"skip":"play";}catch(e){document.documentElement.dataset.intro="skip";}})();`;

export function IntroCurtain() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    if (d.dataset.intro !== "play") {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* abaikan */
    }
    const t = window.setTimeout(() => {
      d.dataset.intro = "done";
      setGone(true);
    }, DURATION);
    return () => window.clearTimeout(t);
  }, []);

  const skip = () => {
    document.documentElement.dataset.intro = "done";
    setGone(true);
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INLINE }} />
      {!gone && (
        <div className="intro" aria-hidden>
          <div className="intro-panel intro-left">
            <Image src={velvetBg} alt="" fill priority sizes="50vw" className="object-cover" />
          </div>
          <div className="intro-panel intro-right">
            <Image src={velvetBg} alt="" fill priority sizes="50vw" className="object-cover" />
          </div>
          <div className="intro-seal">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis */}
            <img src="/brand/ikon-emas.svg" alt="" className="intro-seal-half intro-seal-l" />
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis */}
            <img src="/brand/ikon-emas.svg" alt="" className="intro-seal-half intro-seal-r" />
          </div>
          <p className="intro-word">undanganonline.id</p>
          <button type="button" onClick={skip} className="intro-skip" aria-hidden={false}>
            Lewati
          </button>
        </div>
      )}
    </>
  );
}
