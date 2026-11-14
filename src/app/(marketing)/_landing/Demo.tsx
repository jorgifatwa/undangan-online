"use client";

import { useEffect, useRef, useState } from "react";

// Hanya TIPE dari protokol (tanpa Zod → bundel landing tetap kecil).
import type { ToPreview } from "@/lib/editor/protocol";
import { cn } from "@/lib/utils";

export interface DemoTheme {
  id: string;
  name: string;
  eventType: "WEDDING" | "BIRTHDAY";
  thumb: string | null;
  background: string;
}

const W = 390;
const H = 844;

/**
 * Demo "coba dengan namamu": iframe /preview/{tema}?demo=1 merender komponen
 * tema ASLI; nama dikirim lewat postMessage (lihat DemoPreview). Iframe baru
 * dimuat saat section mendekati layar agar tidak membebani hero.
 */
export function Demo({ themes }: { themes: DemoTheme[] }) {
  const [themeId, setThemeId] = useState(themes[0]?.id);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const wedding = theme?.eventType === "WEDDING";

  // muat iframe saat hampir terlihat
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // kirim nama (debounce) setiap berubah & setiap iframe siap
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const msg: ToPreview = {
        ns: "undangku",
        type: "names",
        primary: primary.slice(0, 40),
        secondary: wedding ? secondary.slice(0, 40) : "",
      };
      frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    }, 120);
    return () => clearTimeout(t);
  }, [primary, secondary, ready, wedding]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // sama ketatnya dengan parseMessage: origin sendiri + sumber iframe ini + bentuk pesan
      const src = frame.current?.contentWindow;
      const d = event.data as { ns?: unknown; type?: unknown } | null;
      if (
        event.origin === window.location.origin &&
        src &&
        event.source === src &&
        d?.ns === "undangku" &&
        d.type === "ready"
      )
        setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!theme) return null;
  const scale = 0.62;
  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
      <div className="space-y-5" data-reveal>
        <div>
          <p className="text-sm font-medium">Pilih tema</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Tema demo">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={t.id === themeId}
                onClick={() => {
                  if (t.id === themeId) return;
                  setReady(false);
                  setThemeId(t.id);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  t.id === themeId
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-sand",
                )}
              >
                {t.name}
                <span className="ml-1.5 text-xs opacity-70">
                  {t.eventType === "WEDDING" ? "Pernikahan" : "Ulang tahun"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">
            {wedding ? "Namamu" : "Nama yang berulang tahun"}
          </span>
          <input
            id="demo-primary"
            value={primary}
            maxLength={24}
            onChange={(e) => setPrimary(e.target.value)}
            placeholder={wedding ? "mis. Laras" : "mis. Aira"}
            autoComplete="off"
            className="bg-card focus-visible:ring-primary/30 mt-1.5 w-full rounded-2xl border px-4 py-3 text-base outline-none focus-visible:ring-4"
          />
        </label>
        {wedding && (
          <label className="block">
            <span className="text-sm font-medium">Nama pasangan</span>
            <input
              id="demo-secondary"
              value={secondary}
              maxLength={24}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="mis. Bima"
              autoComplete="off"
              className="bg-card focus-visible:ring-primary/30 mt-1.5 w-full rounded-2xl border px-4 py-3 text-base outline-none focus-visible:ring-4"
            />
          </label>
        )}
        <p className="text-muted-foreground text-sm">
          Ini tema yang sama persis dengan undangan sungguhan. Ketuk tombol di cover untuk membuka
          isinya.
        </p>
      </div>

      <div
        ref={box}
        className="mx-auto"
        data-reveal
        style={{ ["--reveal-delay" as string]: "120ms" }}
      >
        <div className="phone" style={{ width: W * scale + 18 }}>
          <div className="screen" style={{ width: W * scale, height: H * scale }}>
            {/* gambar tema tampil selagi iframe dimuat */}
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-opacity duration-500",
                ready ? "opacity-0" : "opacity-100",
              )}
              style={{
                background: theme.thumb ? `center / cover url(${theme.thumb})` : theme.background,
              }}
            />
            {near && (
              <iframe
                key={theme.id}
                ref={frame}
                src={`/preview/${theme.id}?demo=1`}
                title={`Demo undangan tema ${theme.name}`}
                width={W}
                height={H}
                loading="lazy"
                className={cn(
                  "transition-opacity duration-500",
                  ready ? "opacity-100" : "opacity-0",
                )}
                style={{
                  width: W,
                  height: H,
                  border: 0,
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0",
                }}
              />
            )}
            {near && !ready && (
              <span className="absolute inset-x-0 bottom-6 z-10 text-center text-xs text-white/80">
                Memuat tema…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
