"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { resolveSections } from "@/schemas/sections";
import { siteConfig } from "@/lib/site";

import type { ThemeDefinition, ThemeProps } from "../../types";
import { ThemeAssetsProvider } from "../assets";
import { DEFAULT_SECTIONS, DefaultCover } from "../sections";
import { AudioProvider, useAudio } from "./audio";
import { InvitationContext, type InvitationContextValue } from "./context";
import { FloatingMusicButton } from "./FloatingMusicButton";
import { detectLowEndDevice } from "./lite";
import "./runtime.css";

interface ThemeRootProps extends ThemeProps {
  theme: ThemeDefinition;
}

/**
 * Akar setiap undangan. Menangani hal yang SAMA untuk semua tema:
 * token warna varian, font tema, kolom 440px + latar desktop, cover → buka,
 * musik (mulai hanya setelah "Buka Undangan"), mode ringan, reduced motion,
 * jeda animasi saat tab tidak aktif, watermark paket FREE, dan urutan section.
 */
export function ThemeRoot(props: ThemeRootProps) {
  const { theme, invitation } = props;
  const { manifest } = theme;

  const tracks = useMemo(() => {
    const own = invitation.data.music?.tracks ?? [];
    if (own.length > 0) return own;
    return manifest.defaultMusic ? [manifest.defaultMusic] : [];
  }, [invitation.data.music, manifest.defaultMusic]);

  return (
    <AudioProvider tracks={tracks}>
      <ThemeRootInner {...props} />
    </AudioProvider>
  );
}

function ThemeRootInner({
  theme,
  invitation,
  variantId,
  features,
  watermark,
  guestName,
  forceLite = false,
  preview = false,
  startOpened = false,
  wishes = [],
}: ThemeRootProps) {
  const { manifest } = theme;
  const audio = useAudio();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const variant = manifest.variants.find((v) => v.id === variantId) ?? manifest.variants[0];
  const sections = useMemo(
    () => resolveSections(invitation, manifest.sections, features, manifest.lockedSections),
    [invitation, manifest.sections, features, manifest.lockedSections],
  );
  const hasCover = sections.includes("cover");
  const [opened, setOpened] = useState(startOpened || !hasCover);

  // Mode ringan: deteksi di client (SSR selalu mode normal kecuali dipaksa).
  const [detectedLite, setDetectedLite] = useState(false);
  useEffect(() => {
    const { lite } = detectLowEndDevice();
    if (lite) setDetectedLite(true);
  }, []);
  const lite = forceLite || detectedLite;

  // Jeda semua animasi CSS saat tab tidak aktif.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const sync = () => el.toggleAttribute("data-inv-hidden", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Tema dengan prepareBehindCover: isi undangan dirender di balik cover saat
  // browser menganggur (setelah cover tampil & interaktif), sebagai transisi
  // React yang bisa diinterupsi ketukan tamu. Saat cover dibuka, yang tersisa
  // hanya animasinya — tidak ada render besar di tengah animasi pintu.
  const [prepared, setPrepared] = useState(false);
  const prepareBehindCover = theme.prepareBehindCover === true;
  useEffect(() => {
    if (!prepareBehindCover || opened || prepared) return;
    const run = () => startTransition(() => setPrepared(true));
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari < 18 belum punya requestIdleCallback
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, [prepareBehindCover, opened, prepared]);
  const showSections = opened || prepared;

  // Kunci scroll halaman selama cover tampil.
  useEffect(() => {
    if (opened) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [opened]);

  // Penanda performa: cover/halaman pertama siap (dibaca scripts/perf.ts).
  useEffect(() => {
    performance.mark("inv-ready");
    rootRef.current?.setAttribute("data-inv-ready", "");
  }, []);

  const startMusic = useCallback(() => {
    if (invitation.data.music?.autoplay !== false) audio.play();
  }, [audio, invitation.data.music?.autoplay]);

  const handleOpen = useCallback(() => {
    // Dipanggil dari gesture tamu → browser mengizinkan audio diputar.
    if (invitation.data.music?.autoplay !== false) audio.play();
    window.scrollTo(0, 0);
    setOpened(true);
  }, [audio, invitation.data.music?.autoplay]);

  // Toast sederhana bergaya tema (salin rekening, kirim ucapan, dll.).
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2600);
  }, []);

  const ctx = useMemo<InvitationContextValue>(
    () => ({
      inv: invitation,
      manifest,
      variant,
      guestName,
      preview,
      lite,
      opened,
      wishes,
      showToast,
    }),
    [invitation, manifest, variant, guestName, preview, lite, opened, wishes, showToast],
  );

  const Cover = theme.Cover ?? DefaultCover;
  const MusicControl = theme.MusicControl ?? FloatingMusicButton;
  const { Ambient, Backdrop } = theme;

  return (
    <InvitationContext.Provider value={ctx}>
      <ThemeAssetsProvider assets={theme.assets}>
        <MotionConfig reducedMotion="user">
          <div
            ref={rootRef}
            data-inv-root
            data-theme={manifest.id}
            data-variant={variant.id}
            data-lite={lite ? "" : undefined}
            className={theme.fontClassName}
            style={variant.tokens as React.CSSProperties}
          >
            <div className="inv-backdrop" aria-hidden>
              {Backdrop && <Backdrop />}
            </div>

            <main
              className="inv-column"
              // disiapkan di balik cover: belum boleh disentuh/dibaca pembaca layar
              aria-hidden={!opened || undefined}
              inert={!opened || undefined}
            >
              {showSections &&
                sections
                  .filter((id) => id !== "cover")
                  .map((id) => {
                    const Section =
                      theme.sections?.[id as Exclude<typeof id, "cover">] ?? DEFAULT_SECTIONS[id];
                    return Section ? <Section key={id} /> : null;
                  })}
              {watermark && <Watermark />}
            </main>

            {/* Lapisan tetap di atas kolom: efek, kontrol musik, toast, cover. */}
            <div className="inv-fixed-column pointer-events-none z-40">
              {Ambient && <Ambient opened={opened} />}
              {opened && <MusicControl />}
              <AnimatePresence>
                {toast && (
                  <div
                    key={toast.id}
                    role="status"
                    className="absolute top-4 left-1/2 max-w-[90%] -translate-x-1/2 rounded-full px-4 py-2 text-center text-sm shadow-lg"
                    style={{ background: "var(--inv-surface-text)", color: "var(--inv-surface)" }}
                  >
                    {toast.message}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!opened && (
                <div key="cover" className="inv-fixed-column z-50" data-inv-cover>
                  <Cover
                    onOpen={handleOpen}
                    startMusic={startMusic}
                    firstSection={sections.find((s) => s !== "cover") ?? null}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </MotionConfig>
      </ThemeAssetsProvider>
    </InvitationContext.Provider>
  );
}

function Watermark() {
  return (
    <a
      href={siteConfig.appUrl}
      target="_blank"
      rel="noopener"
      className="block py-6 text-center text-xs opacity-70"
      style={{ background: "var(--inv-bg-alt)", color: "var(--inv-text-muted)" }}
    >
      Undangan ini dibuat gratis dengan <strong>{siteConfig.name}</strong> · Buat punyamu →
    </a>
  );
}
