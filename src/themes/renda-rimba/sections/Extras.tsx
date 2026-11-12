"use client";

import Image from "next/image";

import { Anthurium, DriedBouquet, Lily, PearlStrands } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { LeafPattern } from "../../_shared/textures";
import { Art, F, Fleuron, Pic, Section, txt, u } from "../canvas";
import { useLaceBorder } from "./Couple";
import { MapButton, MaroonCard } from "./Event";

/**
 * Section tambahan (tidak ada di desain referensi) dengan bahasa visual Renda
 * Rimba — memakai elemen yang sama dengan section asli:
 *  - Love Story  → kartu renda (seperti kartu mempelai) + anthurium & lili
 *  - Dress Code  → pita daun (seperti Save The Date) + buket gantung
 *  - Live Stream → kartu marun bertekstur (seperti kartu acara) + mutiara
 * dan animasi masuk yang sama (data-a di theme.css).
 */

export function RendaLoveStory() {
  const { inv } = useInvitation();
  const lace = useLaceBorder(40);
  if (inv.eventType !== "WEDDING" || inv.data.loveStory.length === 0) return null;
  const items = inv.data.loveStory;

  return (
    <Section id="loveStory" minHeight={520} z={2} threshold={0.12} style={{ paddingBottom: u(70) }}>
      <h2 data-a="up" style={{ ...txt(F.script, 42, 1.2), paddingTop: u(40) }}>
        Love Story
      </h2>
      <Pic
        slot="anthurium"
        l={312}
        t={-24}
        w={118}
        ratio={799 / 343}
        flip
        rotate={-8}
        a="soft"
        d={0.2}
        sway="hang"
        z={4}
        fallback={<Anthurium slot={false} className="h-full w-full" />}
      />

      <div
        data-a="unfold"
        style={{
          position: "relative",
          margin: `${u(18)} ${u(34)} 0`,
          padding: `${u(18)} ${u(6)}`,
          boxSizing: "border-box",
          textAlign: "center",
          filter: "drop-shadow(0 6px 14px rgb(0 0 0 / .35))",
          ["--d" as string]: "0.15s",
          ...lace,
        }}
      >
        {items.map((it, i) => (
          <div key={i} data-a="up" style={{ ["--d" as string]: `${0.6 + i * 0.25}s` }}>
            {i > 0 && (
              <Fleuron
                color="var(--inv-maroon)"
                line="rgb(122 100 80 / .5)"
                width={60}
                dotted
                margin={16}
              />
            )}
            {it.photo && (
              <div
                style={{
                  position: "relative",
                  width: u(110),
                  height: u(130),
                  margin: `0 auto ${u(10)}`,
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: `0 0 0 ${u(3)} var(--inv-gold-dark)`,
                }}
              >
                <Image
                  src={it.photo.url}
                  alt={it.title}
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            {it.date && (
              <p style={txt(F.serif, 13, 1.3, { weight: 600, ls: 3, color: "var(--inv-maroon)" })}>
                {it.date.toUpperCase()}
              </p>
            )}
            <h3
              style={{
                ...txt(F.script, 30, 1.25, { color: "var(--inv-ink-dark)" }),
                marginTop: u(2),
              }}
            >
              {it.title}
            </h3>
            {it.text && (
              <p
                style={{ ...txt(F.body, 11.5, 1.6, { color: "var(--inv-ink)" }), marginTop: u(4) }}
              >
                {it.text}
              </p>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: u(140),
          height: u(200),
          pointerEvents: "none",
        }}
      >
        <Pic
          slot="lily"
          l={-10}
          t={110}
          w={96}
          ratio={737 / 799}
          rotate={12}
          a="bloom"
          d={0.9}
          sway="stand"
          z={5}
          fallback={<Lily slot={false} className="h-full w-full" />}
        />
      </div>
    </Section>
  );
}

export function RendaDressCode() {
  const { inv } = useInvitation();
  const dc = inv.data.dressCode;
  if (!dc) return null;
  return (
    <Section
      id="dressCode"
      minHeight={300}
      bg="var(--inv-band)"
      overflow="hidden"
      z={1}
      threshold={0.2}
      style={{ paddingBottom: u(44) }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
        <Art
          slot="leaf-bg"
          fit="cover"
          w={430}
          position="center 30%"
          filter="var(--inv-filter-leaf) brightness(1.75) saturate(0.72) contrast(1.12)"
          fallback={<LeafPattern slot={false} />}
        />
      </div>
      <Pic
        slot="bouquet-hanging-2"
        l={300}
        t={-60}
        w={150}
        ratio={800 / 508}
        flip
        a="right"
        d={0.2}
        sway="hang"
        z={2}
        fallback={
          <DriedBouquet slot={false} variant="hanging" seed={7} className="h-full w-full" />
        }
      />
      <div style={{ position: "relative", zIndex: 3, textAlign: "center", paddingTop: u(48) }}>
        <h2 data-a="up" style={txt(F.serif, 28, 1.15, { weight: 500, ls: 1.4 })}>
          DRESS <i>CODE</i>
        </h2>
        {dc.text && (
          <p
            data-a="up"
            style={{
              ...txt(F.body, 13, 1.6, { italic: true }),
              margin: `${u(12)} ${u(56)} 0`,
              ["--d" as string]: "0.15s",
            }}
          >
            {dc.text}
          </p>
        )}
        {dc.colors.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: u(14),
              margin: `${u(24)} ${u(40)} 0`,
            }}
          >
            {dc.colors.map((c, i) => (
              <span
                key={c + i}
                data-a="pop"
                style={{
                  ["--d" as string]: `${0.3 + i * 0.12}s`,
                  width: u(46),
                  height: u(46),
                  borderRadius: "50%",
                  background: c,
                  boxShadow: `0 0 0 ${u(2.5)} var(--inv-cream), 0 0 0 ${u(4)} var(--inv-gold-dark), 0 ${u(4)} ${u(10)} rgb(0 0 0 / .4), inset 0 ${u(2)} ${u(4)} rgb(255 255 255 / .25)`,
                }}
              >
                <span className="sr-only">{c}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

export function RendaLiveStream() {
  const { inv } = useInvitation();
  const ls = inv.data.liveStream;
  if (!ls) return null;
  return (
    <Section
      id="liveStream"
      minHeight={360}
      z={1}
      threshold={0.2}
      style={{ padding: `${u(56)} 0 ${u(54)}` }}
    >
      <Pic
        slot="pearls"
        l={-30}
        t={0}
        w={150}
        ratio={799 / 461}
        a="pearls"
        d={0.3}
        sway="hang"
        z={3}
        fallback={<PearlStrands slot={false} className="h-full w-full" />}
      />
      <MaroonCard
        style={{
          position: "relative",
          margin: `0 ${u(38)}`,
          padding: `${u(22)} ${u(26)} ${u(26)}`,
          textAlign: "center",
        }}
      >
        <h2 style={txt(F.casual, 44, 1.15)}>Live Streaming</h2>
        <Fleuron
          color="var(--inv-gold)"
          line="color-mix(in srgb, var(--inv-gold) 50%, transparent)"
        />
        <p style={txt(F.body, 13, 1.6)}>
          {ls.note ?? "Bagi yang berhalangan hadir, saksikan momen bahagia kami secara daring."}
        </p>
        <MapButton href={ls.url} label={`Tonton di ${ls.platform ?? "sini"}`} icon="play" />
      </MaroonCard>
    </Section>
  );
}
