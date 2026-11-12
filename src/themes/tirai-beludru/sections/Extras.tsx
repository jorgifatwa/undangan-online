"use client";

import Image from "next/image";

import { Reveal } from "../../_shared/motion/Reveal";
import { CapsuleFrame, Sparkles } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import type { SectionId } from "@/schemas/sections";
import { SuedeTexture, VelvetTexture } from "../../_shared/textures";
import { Art } from "../art";
import { CText, F, Placed, canvasText, u } from "../canvas";
import { AccentBouquet, HangingBouquet } from "../scene";

/**
 * Section tambahan (tidak ada di desain referensi) dengan bahasa visual Tirai
 * Beludru: latar suede/beludru asli, buket gantung di dua sudut atas (sama
 * seperti Wedding Gift & Ucapan), judul script, pemisah garis krem, buket lantai
 * di sudut bawah, dan animasi masuk yang sama.
 */

const text = (size: number, lh: number, o: { bold?: boolean; ls?: number; font?: string; italic?: boolean } = {}): React.CSSProperties => ({
  margin: 0,
  fontFamily: o.font ?? F.cormorant,
  fontSize: u(size),
  lineHeight: u(lh),
  letterSpacing: u(o.ls ?? 0),
  fontWeight: o.bold ? 700 : 400,
  fontStyle: o.italic ? "italic" : undefined,
  color: "var(--inv-cream)",
  textAlign: "center",
  overflowWrap: "anywhere",
});

function Shell({ id, bg, title, children }: { id: SectionId; bg: "suede" | "velvet"; title: string; children: React.ReactNode }) {
  return (
    <SectionShell
      id={id}
      className="tb-canvas"
      style={{ position: "relative", width: "100%", overflow: "hidden", containerType: "inline-size", background: bg === "suede" ? "#2c3e28" : "#4a0d18", contentVisibility: "visible" }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {bg === "suede" ? (
          <Art slot="suede-bg" w={960} fit="cover" filter="var(--inv-filter-suede)" fallback={<SuedeTexture slot={false} />} />
        ) : (
          <Art slot="velvet-bg" w={660} fit="cover" filter="var(--inv-filter-velvet)" fallback={<VelvetTexture slot={false} />} />
        )}
      </div>
      <Placed img={[-34.35, -23.84, 145.03, 181.3]} clip={[0, 0, 110.68, 157.46]} reveal="sway" parallax="hanging">
        <HangingBouquet w={145} />
      </Placed>
      <Placed img={[302.3, -23.84, 180.94, 226.17]} clip={[302.3, 0, 137.7, 202.34]} flipX reveal="sway-right" parallax="hanging">
        <HangingBouquet w={181} />
      </Placed>
      <div style={{ position: "relative", height: u(150) }}>
        <CText reveal="blur" style={canvasText([20, 52.56, 400], F.script, 51.574, 72.176)}>
          {title}
        </CText>
        <Sparkles style={{ position: "absolute", left: u(326), top: u(52), width: u(32), height: u(45) }} />
      </div>
      <div style={{ position: "relative", padding: `0 ${u(48)} ${u(150)}` }}>{children}</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: u(260), pointerEvents: "none" }}>
        <Placed img={[280.36, 260 - 215.04, 202.88, 253.59]} clip={[352.72, 260 - 124.54, 87.28, 124.54]} reveal="rise" parallax="floor">
          <AccentBouquet w={203} />
        </Placed>
      </div>
    </SectionShell>
  );
}

/** Garis krem pendek (seperti garis blok tanggal di Save the Date). */
function CreamRule() {
  return (
    <Reveal variant="wipe" style={{ width: u(126), height: u(2), margin: `${u(26)} auto`, background: "var(--inv-cream)" }}>
      <span />
    </Reveal>
  );
}

export function TiraiLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING" || inv.data.loveStory.length === 0) return null;
  return (
    <Shell id="loveStory" bg="suede" title="Love Story">
      {inv.data.loveStory.map((item, i) => (
        <div key={i}>
          {i > 0 && <CreamRule />}
          <Reveal variant={i % 2 ? "right" : "left"} style={{ textAlign: "center" }}>
            {item.photo && (
              <CapsuleFrame slot="capsule-frame" className="mx-auto mb-[3cqw]" style={{ width: u(118) }}>
                <Image src={item.photo.url} alt={item.title} fill sizes="120px" style={{ objectFit: "cover" }} />
              </CapsuleFrame>
            )}
            {item.date && <p style={text(12.5, 20, { ls: 2.2, bold: true, font: F.body })}>{item.date.toUpperCase()}</p>}
            <p style={{ ...text(32, 44, { font: F.script }), marginTop: u(2) }}>{item.title}</p>
            {item.text && <p style={{ ...text(15.5, 23), marginTop: u(6), opacity: 0.92 }}>{item.text}</p>}
          </Reveal>
        </div>
      ))}
    </Shell>
  );
}

export function TiraiDressCode() {
  const { inv } = useInvitation();
  const dc = inv.data.dressCode;
  if (!dc) return null;
  return (
    <Shell id="dressCode" bg="velvet" title="Dress Code">
      {dc.text && (
        <Reveal variant="fade">
          <p style={text(16.3, 24.2)}>{dc.text}</p>
        </Reveal>
      )}
      {dc.colors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: u(14), marginTop: u(26) }}>
          {dc.colors.map((c, i) => (
            <Reveal
              key={c + i}
              variant="pop"
              delay={i * 0.12}
              style={{
                width: u(48),
                height: u(48),
                borderRadius: "50%",
                background: c,
                boxShadow: `0 0 0 ${u(2.5)} var(--inv-velvet-dark, #2e050c), 0 0 0 ${u(4)} var(--inv-gold), 0 ${u(4)} ${u(10)} rgb(0 0 0 / .45), inset 0 ${u(2)} ${u(4)} rgb(255 255 255 / .25)`,
              }}
            >
              <span className="sr-only">{c}</span>
            </Reveal>
          ))}
        </div>
      )}
    </Shell>
  );
}

export function TiraiLiveStream() {
  const { inv } = useInvitation();
  const ls = inv.data.liveStream;
  if (!ls) return null;
  return (
    <Shell id="liveStream" bg="suede" title="Live Streaming">
      <Reveal variant="fade">
        <p style={text(16.3, 24.2)}>{ls.note ?? "Bagi yang berhalangan hadir, saksikan momen bahagia kami secara daring."}</p>
      </Reveal>
      <Reveal variant="pop" style={{ display: "flex", justifyContent: "center", marginTop: u(22) }}>
        <a
          href={ls.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", minWidth: u(172.15), padding: `0 ${u(16)}`, height: u(32.45), background: "var(--inv-button)", borderRadius: u(4), textDecoration: "none", ...text(16.32, 32.45, { font: F.body }) }}
        >
          Tonton di {ls.platform ?? "sini"}
        </a>
      </Reveal>
    </Shell>
  );
}
