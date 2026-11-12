"use client";

import { forwardRef, useEffect, useRef, useState } from "react";

const W = 390;
const H = 844;

/**
 * Bingkai HP berisi iframe pratinjau 390×844, diskalakan agar muat di ruang
 * yang tersedia (ResizeObserver). Isi iframe adalah halaman tema sungguhan.
 */
export const PreviewFrame = forwardRef<HTMLIFrameElement, { src: string; title: string }>(
  function PreviewFrame({ src, title }, ref) {
    const box = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0.8);

    useEffect(() => {
      const el = box.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => {
        const { width, height } = e.contentRect;
        // ruang untuk bingkai 12px
        setScale(Math.max(0.3, Math.min(1, (width - 24) / W, (height - 24) / H)));
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    return (
      <div ref={box} className="flex h-full w-full items-center justify-center overflow-hidden">
        <div
          className="shrink-0 overflow-hidden rounded-[2.4rem] border-[10px] border-neutral-900 bg-black shadow-2xl"
          style={{ width: W * scale + 20, height: H * scale + 20 }}
        >
          <iframe
            ref={ref}
            src={src}
            title={title}
            width={W}
            height={H}
            style={{
              width: W,
              height: H,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
            }}
          />
        </div>
      </div>
    );
  },
);
