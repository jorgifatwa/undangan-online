"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

import {
  Anthurium,
  Basmalah,
  DriedBouquet,
  PearlStrands,
  Sparkles,
  Vinyl,
} from "../../_shared/ornaments";
import { useAudio } from "../../_shared/runtime/audio";
import { useInvitation } from "../../_shared/runtime/context";
import { Art, F, Pic, Section, box, txt, u } from "../canvas";

/**
 * Section 1 (desain 430 × 850): bingkai scallop marmer bercincin marun berisi
 * basmalah, ayat & arti; untaian mutiara, buket gantung, anthurium, dan
 * piringan hitam pemutar musik. Elemen masuk berurutan (koreografi desain).
 */
const H = 850;
const FRAME = { l: 32, t: 56, w: 366, h: 680 };
/** Batas bawah isi bingkai (koordinat bingkai) sebelum teks dikecilkan. */
const CONTENT_MAX = 560;

/** Superelips bertepi bergelombang + cincin di atas, bawah, dan kedua sisi. */
function scallop(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const a = w / 2 - 17;
  const b = h / 2 - 17;
  const n = 2.6;
  const A = 14;
  const m = h > 500 ? 9 : 7;
  const N = 520;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const co = Math.cos(t);
    const si = Math.sin(t);
    const x = a * Math.sign(co) * Math.pow(Math.abs(co), 2 / n);
    const y = -b * Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    const r = Math.hypot(x, y) || 1;
    const k = 1 + (A * Math.abs(Math.sin(m * t))) / r;
    pts.push([cx + x * k, cy + y * k]);
  }
  const d = `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`;
  const edgeAt = (fy: number, side: -1 | 1): [number, number] => {
    const y = h * fy;
    const cand = pts
      .filter((p) => (side < 0 ? p[0] < cx : p[0] > cx))
      .sort((p, q) => Math.abs(p[1] - y) - Math.abs(q[1] - y))[0];
    return [cand[0] - side * 13, cand[1]];
  };
  const rings: [number, number][] = [
    [cx, 17],
    [cx, h - 17],
    edgeAt(0.43, -1),
    edgeAt(0.43, 1),
    edgeAt(0.6, -1),
    edgeAt(0.6, 1),
  ];
  return { d, rings };
}

function ScallopFrameSvg({ lite }: { lite: boolean }) {
  const { d, rings } = useMemo(() => scallop(FRAME.w, FRAME.h), []);
  return (
    <svg
      viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <filter id="rr-marble" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.035" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.84  0 0 0 0 0.83  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <path d={d} fill="var(--inv-paper)" />
      {!lite && <path d={d} fill="var(--inv-paper)" filter="url(#rr-marble)" />}
      <path d={d} fill="none" stroke="var(--inv-maroon)" strokeWidth="5" strokeLinejoin="round" />
      {rings.map(([x, y], i) => (
        <circle
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r="6.5"
          fill="var(--inv-paper)"
          stroke="var(--inv-maroon)"
          strokeWidth="3.6"
        />
      ))}
    </svg>
  );
}

function MusicDisc() {
  const { playing, toggle, available, tracks } = useAudio();
  if (tracks.length === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={!available}
        aria-label={playing ? "Jeda musik" : "Putar musik"}
        data-a="roll"
        className={playing ? "rr-playing" : undefined}
        style={{
          ...box(118, 640, 92, 92),
          ["--d" as string]: "1.15s",
          padding: 0,
          border: 0,
          background: "none",
          cursor: "pointer",
          borderRadius: "50%",
          zIndex: 4,
        }}
      >
        <span className="rr-disc" style={{ position: "absolute", inset: 0 }}>
          <Art slot="vinyl" w={92} fallback={<Vinyl slot={false} className="h-full w-full" />} />
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: u(22),
            height: u(22),
            margin: `${u(-11)} 0 0 ${u(-11)}`,
            color: "#fff",
            filter: "drop-shadow(0 1px 2px rgb(0 0 0 / .4))",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: "100%", height: "100%" }}>
            {playing ? (
              <path fill="currentColor" d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" />
            ) : (
              <path fill="currentColor" d="M8 5v14l11-7z" />
            )}
          </svg>
        </span>
      </button>
      <p
        data-a="soft"
        style={{
          ...box(138, 742),
          ...txt(F.script, 18, 1.2, { color: "#fff" }),
          ["--d" as string]: "1.9s",
          rotate: "-7deg",
          whiteSpace: "nowrap",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        play the music!
      </p>
    </>
  );
}

export function RendaIntro() {
  const { inv, lite } = useInvitation();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const quote = inv.data.quote;
  const islami = inv.data.greeting?.style === "islami";
  const arabic = quote?.arabic;

  // Ayat/arti panjang: kecilkan isi bingkai agar tidak menabrak piringan & buket.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      const top = 108;
      const max = CONTENT_MAX - top;
      const hgt = el.scrollHeight;
      const frameUnit = el.parentElement!.clientWidth / FRAME.w;
      const s = hgt > max * frameUnit ? Math.max(0.6, (max * frameUnit) / hgt) : 1;
      el.style.setProperty("--fit", s.toFixed(3));
      // Kutipan pendek: tengahkan isi di ruang bingkai (desain asli diisi ayat panjang).
      const spare = max * frameUnit - el.scrollHeight;
      el.style.transform = spare > 0 ? `translateY(${(spare / 2).toFixed(1)}px)` : "";
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [quote?.arabic, quote?.translation]);

  if (!quote) return null;
  const fs = (px: number) => `calc(${u(px)} * var(--fit, 1))`;

  return (
    <Section id="ayat" height={H} bg="var(--inv-intro-bg)" z={3} threshold={0.05}>
      <Pic
        slot="pearls"
        l={-34}
        t={0}
        w={250}
        ratio={799 / 461}
        a="pearls"
        d={0.5}
        sway="hang"
        fallback={<PearlStrands slot={false} className="h-full w-full" />}
      />

      <div
        data-a="frame"
        style={{
          ...box(FRAME.l, FRAME.t, FRAME.w, FRAME.h),
          ["--d" as string]: "0.35s",
          filter: "drop-shadow(0 6px 14px rgb(0 0 0 / .35))",
        }}
      >
        <ScallopFrameSvg lite={lite} />
        <div
          ref={contentRef}
          style={{ position: "absolute", left: 0, right: 0, top: u(108), textAlign: "center" }}
        >
          {islami && (
            <div
              data-a="up"
              style={{ ["--d" as string]: "0.8s", position: "relative", height: fs(34) }}
            >
              <Basmalah
                style={{
                  margin: 0,
                  fontFamily: F.arabic,
                  fontSize: fs(25),
                  lineHeight: fs(34),
                  color: "var(--inv-arabic)",
                  textAlign: "center",
                }}
              />
            </div>
          )}
          {arabic && (
            <p
              lang="ar"
              dir="rtl"
              data-a="up"
              style={{
                ["--d" as string]: "0.95s",
                margin: `${islami ? fs(26) : 0} ${u(30)} 0`,
                fontFamily: F.arabic,
                fontSize: fs(23),
                lineHeight: fs(38),
                color: "var(--inv-arabic)",
              }}
            >
              {arabic}
            </p>
          )}
          {quote.translation && (
            <p
              data-a="up"
              style={{
                ["--d" as string]: "1.4s",
                margin: `${arabic || islami ? fs(34) : 0} ${u(44)} 0`,
                fontFamily: F.body,
                fontSize: fs(12.2),
                lineHeight: fs(18.6),
                color: "var(--inv-ink)",
              }}
            >
              {quote.translation}
            </p>
          )}
          {quote.source && (
            <p
              data-a="up"
              style={{
                ["--d" as string]: "1.6s",
                margin: `${fs(12)} 0 0`,
                fontFamily: F.body,
                fontSize: fs(11),
                color: "var(--inv-ink)",
              }}
            >
              {quote.source}
            </p>
          )}
        </div>
      </div>

      <Pic
        slot="bouquet-hanging-2"
        l={252}
        t={532}
        w={196}
        ratio={800 / 508}
        flip
        a="right"
        d={0.9}
        sway="hang"
        fallback={
          <DriedBouquet slot={false} variant="hanging" seed={7} className="h-full w-full" />
        }
      />
      <div
        data-a="soft"
        aria-hidden
        style={{ ...box(380, 652, 64, 64), ["--d" as string]: "1.7s" }}
      >
        <div className="rr-twinkle" style={{ position: "absolute", inset: 0 }}>
          <Art
            slot="sparkle-star"
            w={64}
            fallback={<Sparkles style={{ width: "100%", height: "100%" }} />}
          />
        </div>
      </div>
      <MusicDisc />
      <Pic
        slot="anthurium"
        l={-8}
        t={604}
        w={168}
        ratio={799 / 343}
        a="left"
        d={1}
        sway="hang"
        z={5}
        fallback={<Anthurium slot={false} className="h-full w-full" />}
      />
    </Section>
  );
}
