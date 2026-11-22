"use client";

import Image from "next/image";

import { firstEvent } from "@/lib/datetime";

import { LaceDoily } from "../../_shared/ornaments";
import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { quiltCard } from "../art/Ornaments";
import { F, Section, txt, u } from "../canvas";

/**
 * Pembuka (section `ayat`, marun): kartu krem berjahit "WE ARE / GETTING /
 * Married" + tanggal; foto dengan keterangan kiri ("NAMA & NAMA") & kanan
 * ("LOVE LOCKED"); ayat (terjemahan); renda oval berisi nama; "The honour of
 * your presence is requested at the wedding of".
 */
const DEFAULT_AYAT =
  "And of His signs is that He created for you from yourselves mates that you may find tranquillity in them; and He placed between you affection and mercy. Indeed in that are signs for a people who give thought.";

const caps = (size: number, ls = 2.4): React.CSSProperties => ({
  ...txt(F.sans, size, 1.55, { color: "var(--inv-cream)", ls }),
  textTransform: "uppercase",
});

export function SuratMarunOpening() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const ev = firstEvent(d.events);
  const [y, m, day] = ev.date.split("-");
  const photo1 = d.photos.strip[0] ?? d.photos.cover;
  const photo2 = d.photos.strip[1] ?? d.photos.cover;
  const q = d.quote;
  const ayat = q?.translation ?? DEFAULT_AYAT;

  return (
    <Section id="ayat" style={{ paddingBottom: u(56) }}>
      {/* kartu "We are getting married" */}
      <div
        data-a
        style={{
          position: "relative",
          width: u(306),
          height: u(406),
          paddingTop: u(72),
          margin: `${u(64)} auto 0`,
          ...quiltCard(10),
          textAlign: "center",
        }}
      >
        {photo1 && (
          <div style={{ position: "relative", width: u(90), height: u(90), margin: "0 auto" }}>
            <Image
              src={photo1.url}
              alt={photo1.alt ?? ""}
              fill
              sizes="100px"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <p
          style={{
            ...txt(F.sans, 9, 1.4, { color: "var(--inv-ink)", ls: 1.4 }),
            marginTop: u(34),
            fontWeight: 600,
          }}
        >
          WE ARE
        </p>
        <p
          style={{
            ...txt(F.serif, 38, 1, { color: "var(--inv-ink)" }),
            marginTop: u(14),
            transform: "scaleY(1.15)",
          }}
        >
          GETTING
        </p>
        <p
          style={{
            ...txt(F.script, 34, 1, { color: "var(--inv-ink)" }),
            marginTop: u(-2),
            transform: "rotate(-8deg)",
          }}
        >
          Married
        </p>
        <p
          style={{
            ...txt(F.sans, 8.5, 1.4, { color: "var(--inv-ink)", ls: 0.6 }),
            marginTop: u(16),
          }}
        >
          {day}.{m}.{y.slice(2)}
        </p>
      </div>

      {/* foto berketerangan */}
      {photo2 && (
        <div data-a style={{ position: "relative", height: u(240), marginTop: u(70) }}>
          <p
            style={{
              ...caps(6.5, 0.6),
              position: "absolute",
              left: u(36),
              top: u(110),
              width: u(70),
              lineHeight: 1.3,
            }}
          >
            {shortName(a)} &amp; {shortName(b)}
          </p>
          <div
            style={{ position: "absolute", left: u(132), top: 0, width: u(166), height: u(240) }}
          >
            <Image
              src={photo2.url}
              alt={photo2.alt ?? ""}
              fill
              sizes="(max-width: 440px) 40vw, 180px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <p
            style={{
              ...caps(6.5, 0.6),
              position: "absolute",
              right: u(36),
              top: u(110),
              width: u(70),
              lineHeight: 1.3,
            }}
          >
            Love
            <br />
            Locked
          </p>
        </div>
      )}

      <p
        data-a
        style={{
          ...txt(F.serif, 12.4, 1.55, { italic: true, color: "var(--inv-cream)" }),
          margin: `${u(36)} ${u(70)} 0`,
          ["--d" as string]: "0.1s",
        }}
      >
        &ldquo;{ayat}&rdquo;
        {q?.source && (
          <>
            <br />
            <span style={{ fontStyle: "normal", fontSize: "0.85em" }}>— {q.source}</span>
          </>
        )}
      </p>

      {/* renda oval berisi nama */}
      <div
        data-a
        style={{ position: "relative", width: u(270), height: u(190), margin: `${u(40)} auto 0` }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: u(190),
            height: u(272),
            transform: "translate(-50%, -50%) rotate(90deg)",
            ["--inv-lace" as string]: "#cfc6c0",
            ["--inv-lace-shade" as string]: "#8f7f7c",
          }}
        >
          <LaceDoily slot={false} className="absolute inset-0 h-full w-full" />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: u(150),
            height: u(86),
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "rgb(80 60 60 / 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={txt(F.serif, 17, 1, { color: "#efe6e1" })}>
            {shortName(a)} &amp; {shortName(b)}
          </p>
        </div>
      </div>

      <p data-a style={{ ...caps(9.5, 3), marginTop: u(44), ["--d" as string]: "0.1s" }}>
        The honour of
        <br />
        your presence is requested
        <br />
        at the wedding of
      </p>
    </Section>
  );
}
