"use client";

import { useInvitation } from "../../_shared/runtime/context";
import { safeHref } from "@/lib/links";
import { smoke } from "../art/FloralColumn";
import { TornCard } from "../art/TornCard";
import { F, Section, txt, u } from "../canvas";

/**
 * Section tambahan yang tidak ada di desain asli, tetap bergaya Lili: latar
 * sage berkabut, judul Playfair tebal miring krem, isi di kartu kertas sobek
 * (sama seperti kartu acara).
 */
function Shell({
  id,
  title,
  children,
}: {
  id: "dressCode" | "liveStream";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Section
      id={id}
      bg={{
        background: `${smoke([
          { x: 15, y: 30, w: 45, h: 30, a: 0.18 },
          { x: 85, y: 80, w: 40, h: 26, a: 0.14 },
        ])}, var(--inv-sage)`,
      }}
    >
      <div style={{ padding: `${u(44)} ${u(48)} ${u(48)}` }}>
        <h2
          data-a
          style={txt(F.serif, 30, 1.25, { italic: true, weight: 700, color: "var(--inv-cream)" })}
        >
          {title}
        </h2>
        <div data-a style={{ marginTop: u(18), ["--d" as string]: "0.15s" }}>
          <TornCard>
            <div style={{ padding: `${u(24)} ${u(26)} ${u(26)}` }}>{children}</div>
          </TornCard>
        </div>
      </div>
    </Section>
  );
}

export function LiliDressCode() {
  const { inv } = useInvitation();
  const dc = inv.data.dressCode;
  if (!dc || (!dc.text && dc.colors.length === 0)) return null;
  return (
    <Shell id="dressCode" title="Dress Code">
      {dc.colors.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: u(10) }}>
          {dc.colors.map((c) => (
            <span
              key={c}
              title={c}
              style={{
                width: u(34),
                height: u(34),
                borderRadius: "50%",
                background: c,
                boxShadow: "0 0 0 2px #fff, 0 1px 3px rgb(0 0 0 / 0.25)",
              }}
            />
          ))}
        </div>
      )}
      {dc.text && (
        <p
          style={{
            ...txt(F.serif, 13.5, 1.5, { color: "var(--inv-ink)" }),
            marginTop: dc.colors.length ? u(16) : 0,
          }}
        >
          {dc.text}
        </p>
      )}
    </Shell>
  );
}

export function LiliLiveStream() {
  const { inv } = useInvitation();
  const ls = inv.data.liveStream;
  const href = safeHref(ls?.url, "liveStream");
  if (!ls || !href) return null;
  return (
    <Shell id="liveStream" title="Live Streaming">
      <p style={txt(F.serif, 13.5, 1.5, { color: "var(--inv-ink)" })}>
        {ls.note ?? "Bagi yang berhalangan hadir, saksikan momen bahagia kami secara langsung."}
      </p>
      <div style={{ textAlign: "center", marginTop: u(16) }}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: `${u(5)} ${u(14)}`,
            borderRadius: 999,
            background: "#2b2c22",
            ...txt(F.serif, 13, 1.3, { weight: 600, color: "#f4efe3" }),
            textDecoration: "none",
            pointerEvents: "auto",
          }}
        >
          Tonton {ls.platform ? `di ${ls.platform}` : "Siaran"}
        </a>
      </div>
    </Shell>
  );
}
