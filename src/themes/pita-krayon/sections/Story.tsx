"use client";

import { eventStart, firstEvent } from "@/lib/datetime";

import Image from "next/image";

import type { Photo } from "@/schemas/common";

import { useCountdown } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { box, F, Orn, Section, txt, Typewriter, u, useCountdownStrip, useDecor } from "../canvas";
import { Cake, Ribbon, Sparkle } from "../ornaments";

/** Cerita ulang tahun (section "cerita"): judul diketik + paragraf teks polos. */
export function Story() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  if (inv.eventType !== "BIRTHDAY" || !inv.data.story?.text.trim()) return null;
  const title = inv.data.story.title?.trim() || t.story;
  const paras = inv.data.story.text.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <Section id="cerita" style={{ padding: `${u(60)} ${u(30)} ${u(44)}` }}>
      <Orn
        slot="ribbon-b"
        l={18}
        t={34}
        w={40}
        ratio={1.36}
        rotate={-14}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-c"
        l={378}
        t={54}
        w={18}
        ratio={1.03}
        tint={false}
        a="fade"
        d={0.4}
        fallback={<Sparkle />}
      />
      <h2
        style={{
          ...txt(31, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 }),
          padding: `0 ${u(30)}`,
        }}
      >
        <Typewriter text={title} delay={0.1} />
      </h2>
      <div style={{ marginTop: u(22) }}>
        {paras.map((p, i) => (
          <p
            key={i}
            data-a="fade"
            style={{
              ...txt(14.5, 1.3),
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
              marginTop: i ? u(16) : 0,
              ["--d" as string]: `${0.4 + i * 0.15}s`,
            }}
          >
            {p.trim()}
          </p>
        ))}
      </div>
    </Section>
  );
}

/** Strip foto photobooth miring (3 foto pertama galeri) seperti desain. */
/**
 * Strip foto (kanvas 430): seperti desain — miring ±8°, dari kanan atas judul
 * menurun ke kanan. Di desain strip terpotong karena halaman berakhir; di
 * undangan masih ada section sesudahnya, jadi section dibuat setinggi strip
 * UTUH (3 foto) dan sudut kanan bawahnya tetap di dalam layar.
 *  tinggi strip = 3 × (w − 16) × 4/3 + 4 × 8; kanan bawah = l + w/2 + w/2·cos + tinggi·sin
 */
const STRIP = (() => {
  const w = 120;
  const rot = -8;
  const t = 92;
  const h = 3 * (w - 16) * (4 / 3) + 4 * 8;
  const rad = (Math.abs(rot) * Math.PI) / 180;
  const l = 426 - (w / 2 + (w / 2) * Math.cos(rad) + h * Math.sin(rad));
  const bottom = t + h * Math.cos(rad) + (w / 2) * Math.sin(rad);
  return { w, rot, t, l: Math.round(l), sectionH: Math.ceil(bottom + 28) };
})();

function CountdownStrip({ photos }: { photos: Photo[] }) {
  return (
    <div
      data-a="strip"
      style={{ ...box(STRIP.l, STRIP.t, STRIP.w), zIndex: 2, ["--d" as string]: "0.5s" }}
    >
      <div
        style={{
          transform: `rotate(${STRIP.rot}deg)`,
          transformOrigin: "50% 0",
          background: "var(--inv-deep)",
          padding: u(8),
          display: "flex",
          flexDirection: "column",
          gap: u(8),
          boxShadow: `0 ${u(10)} ${u(20)} rgb(0 0 0 / 0.18)`,
        }}
      >
        {photos.map((p, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              aspectRatio: "3 / 4",
              overflow: "hidden",
              background: "var(--inv-bg-alt)",
            }}
          >
            <Image
              src={p.url}
              alt={p.alt ?? `Foto ${i + 1}`}
              fill
              sizes="(max-width: 440px) 27vw, 112px"
              style={{
                objectFit: "cover",
                objectPosition: `${p.focusX ?? 50}% ${p.focusY ?? 40}%`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * "SEE YOU ON 8.8.26" + hitung mundur (Arimo, angka & label merah seperti
 * desain) + strip foto miring di kanan + kue coretan di kiri bawah.
 * Setelah hari-H: hitung mundur disembunyikan.
 */
export function Countdown() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const strip = useCountdownStrip();
  const e = firstEvent(inv.data.events);
  const cd = useCountdown(eventStart(e));
  const [y, m, d] = e.date.split("-");
  const short = `${Number(d)}.${Number(m)}.${y.slice(2)}`;
  const vals = [cd.days, cd.hours, cd.minutes, cd.seconds];
  return (
    <Section id="hitungMundur" minHeight={strip.length ? STRIP.sectionH : 380}>
      <div
        style={{
          position: "relative",
          padding: `${u(84)} 0 0 ${u(24)}`,
          width: u(strip.length ? 250 : 430),
          zIndex: 3,
        }}
      >
        <h2
          style={{
            ...txt(40, 0.98, { color: "var(--inv-red)", weight: 700, ls: 2, align: "left" }),
          }}
        >
          <span style={{ display: "block", whiteSpace: "nowrap" }}>
            <Typewriter text={t.seeYou} delay={0.1} />
          </span>
          <span style={{ display: "block", whiteSpace: "nowrap" }}>
            <Typewriter text={`${t.seeYouOn} ${short}`} delay={0.1 + t.seeYou.length * 0.055} />
          </span>
        </h2>
        {!cd.done && (
          <div
            data-a="up"
            role="timer"
            aria-label={`${cd.days} hari ${cd.hours} jam ${cd.minutes} menit lagi`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginTop: u(12),
              ["--d" as string]: "0.6s",
            }}
          >
            {vals.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: F.count,
                      fontSize: u(29),
                      lineHeight: 1,
                      color: i === 3 ? "var(--inv-ink)" : "var(--inv-red)",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: u(i === 0 ? 22 : 40),
                    }}
                    suppressHydrationWarning
                  >
                    {cd.ready ? (i === 0 ? v : String(v).padStart(2, "0")) : i === 0 ? "0" : "00"}
                  </p>
                  <p
                    style={{
                      fontFamily: F.count,
                      fontSize: u(10),
                      color: "var(--inv-red)",
                      marginTop: u(6),
                      letterSpacing: u(0.3),
                    }}
                  >
                    {t.units[i]}
                  </p>
                </div>
                {i < 3 && (
                  <span
                    aria-hidden
                    style={{
                      fontFamily: F.count,
                      fontSize: u(27),
                      lineHeight: 1,
                      color: "var(--inv-red)",
                      padding: `0 ${u(4)}`,
                    }}
                  >
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {strip.length > 0 && <CountdownStrip photos={strip} />}
      <Orn
        slot="cake"
        l={-8}
        t={strip.length ? STRIP.sectionH - 232 : 250}
        w={142}
        ratio={1.53}
        a="up"
        d={0.7}
        fallback={<Cake />}
      />
    </Section>
  );
}
