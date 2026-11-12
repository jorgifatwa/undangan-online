"use client";

import Image from "next/image";

import { Butterfly, CallaLily, SealArt, StampCard } from "../../_shared/ornaments";
import { couple, parentNames, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { LeafPattern } from "../../_shared/textures";
import type { Person } from "@/schemas/wedding";
import { Art, F, Pic, Section, box, fitSize, txt, u, useFit } from "../canvas";

/**
 * Penutup (desain 430 × 900): polaroid berselotip + "Kami Akan Menikah!" di
 * atas latar gelap, lalu pita daun dengan kertas tepi perangko bersegel emas
 * kupu-kupu, ucapan terima kasih, nama pasangan, dan keluarga.
 */
const H = 900;
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .4 0 0 0 0 .32 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

const DEFAULT_TEXT =
  "Suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa dan restu kepada kedua mempelai.";

function family(p: Person) {
  const names = parentNames(p.father, p.mother);
  return names.length ? `Keluarga ${names.join(" & ")}` : null;
}

export function RendaClosing() {
  const { inv } = useInvitation();
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const names = d ? `${shortName(couple(d)[0])} & ${shortName(couple(d)[1])}` : "";
  const namesRef = useFit<HTMLParagraphElement>(names, 1);
  if (!d) return null;
  const [a, b] = couple(d);
  const islami = d.greeting?.style === "islami";
  const photo = d.photos.closing ?? d.gallery[0];
  const families = d.signature?.families.length
    ? d.signature.families
    : ([family(a), family(b)].filter(Boolean) as string[]);

  return (
    <Section id="penutup" height={H} z={1} threshold={0.12} overflow="hidden">
      <div
        aria-hidden
        style={{ ...box(0, 370, 430, 530), overflow: "hidden", background: "var(--inv-band)" }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
          <Art
            slot="leaf-bg"
            fit="cover"
            w={430}
            position="center 30%"
            filter="var(--inv-filter-leaf) brightness(1.75) saturate(0.72) contrast(1.12)"
            fallback={<LeafPattern slot={false} />}
          />
        </div>
      </div>

      {photo && (
        <div
          data-a="poldrop"
          style={{
            ...box(30, 46, 204, 246),
            ["--d" as string]: "0.15s",
            rotate: "-4deg",
            boxSizing: "border-box",
            padding: `${u(11)} ${u(11)} ${u(53)}`,
            background: `radial-gradient(120% 90% at 30% 20%, rgb(255 255 255 / .55), transparent 60%), ${NOISE}, linear-gradient(170deg, #fbf8f1, #f1ebdd)`,
            boxShadow:
              "0 1px 1px rgb(0 0 0 / .18), 0 6px 10px rgb(0 0 0 / .28), 6px 16px 22px -6px rgb(0 0 0 / .55)",
            zIndex: 3,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              top: u(-11),
              width: u(76),
              height: u(24),
              marginLeft: u(-38),
              rotate: "5deg",
              zIndex: 2,
              background:
                "repeating-linear-gradient(90deg, transparent 0 6px, rgb(255 255 255 / .18) 6px 7px), rgb(236 222 196 / .78)",
              boxShadow: "0 1px 2px rgb(0 0 0 / .18)",
              clipPath:
                "polygon(3% 0, 97% 4%, 100% 30%, 97% 55%, 100% 80%, 96% 100%, 2% 96%, 0 70%, 3% 45%, 0 20%)",
            }}
          />
          <span
            style={{
              position: "relative",
              display: "block",
              width: u(182),
              height: u(182),
              overflow: "hidden",
              background: "#2a2a2a",
            }}
          >
            <Image
              src={photo.url}
              alt={`Foto ${shortName(a)} dan ${shortName(b)}`}
              fill
              sizes="(max-width: 440px) 43vw, 190px"
              style={{
                objectFit: "cover",
                objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 28}%`,
                filter: "sepia(.14) saturate(.9) contrast(.96) brightness(1.03)",
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 0 1px rgb(0 0 0 / .22), inset 0 2px 6px rgb(0 0 0 / .35)",
                background:
                  "linear-gradient(160deg, rgb(255 236 200 / .12), transparent 45%, rgb(40 20 0 / .08))",
              }}
            />
          </span>
        </div>
      )}

      <Pic
        slot="calla-lily"
        l={318}
        t={-4}
        w={108}
        ratio={800 / 450}
        a="soft"
        d={0.3}
        sway="stand"
        z={2}
        fallback={<CallaLily slot={false} className="h-full w-full" />}
      />
      <div
        data-a="soft"
        aria-hidden
        style={{ ...box(262, 96, 48, 50), ["--d" as string]: "0.6s", zIndex: 4 }}
      >
        <Art
          slot="butterfly"
          w={48}
          fallback={<Butterfly slot={false} className="h-full w-full" />}
        />
      </div>
      <h2
        data-a="up"
        style={{
          ...box(232, 140, 180),
          ...txt(F.casual, 36, 0.95),
          rotate: "-6deg",
          zIndex: 4,
          ["--d" as string]: "0.5s",
        }}
      >
        Kami
        <br />
        Akan
        <br />
        Menikah!
      </h2>
      <p
        data-a="up"
        style={{
          ...box(240, 262, 170),
          ...txt(F.body, 11.5, 1.55, { italic: true, color: "rgb(246 239 228 / .9)" }),
          zIndex: 4,
          ["--d" as string]: "0.7s",
        }}
      >
        Dengan izin Allah, kami memulai lembaran baru. Terima kasih telah menjadi bagian dari
        perjalanan kami.
      </p>

      <div
        data-a="up"
        style={{
          ...box(40, 412, 350, 418),
          ["--d" as string]: "0.2s",
          boxSizing: "border-box",
          padding: `${u(46)} ${u(30)} ${u(26)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          filter: "drop-shadow(0 8px 18px rgb(0 0 0 / .4))",
          zIndex: 3,
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1 }}>
          <Art
            slot="stamp-card"
            w={350}
            fit="fill"
            fallback={<StampCard slot={false} className="h-full w-full" />}
          />
        </div>
        <p
          style={{
            ...txt(F.body, 12, 1.6, { color: "#3a2814" }),
            marginBottom: u(10),
            whiteSpace: "pre-line",
          }}
        >
          {d.greeting?.closingText ?? DEFAULT_TEXT}
        </p>
        <p style={{ ...txt(F.body, 12, 1.6, { color: "#3a2814" }), marginBottom: u(10) }}>
          Atas kehadiran serta doa restunya, kami ucapkan terima kasih.
        </p>
        {islami && (
          <p
            style={{
              ...txt(F.body, 12, 1.6, { italic: true, color: "#3a2814" }),
              marginBottom: u(10),
            }}
          >
            Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh
          </p>
        )}
        <p style={{ ...txt(F.body, 11, 1.4, { italic: true, color: "#7a6450" }), marginTop: u(8) }}>
          {d.signature?.text ?? "Kami yang berbahagia"}
        </p>
        <p
          ref={namesRef}
          style={{
            ...txt(F.brush, 44, 1.15, { color: "var(--inv-brown)" }),
            fontSize: fitSize(44),
            margin: `${u(2)} 0 ${u(6)}`,
            whiteSpace: "nowrap",
            alignSelf: "stretch",
          }}
        >
          {names}
        </p>
        {families.map((f) => (
          <p key={f} style={txt(F.sans, 9.4, 1.6, { color: "#4b3a2a" })}>
            {f}
          </p>
        ))}
      </div>

      <div
        data-a="pop"
        aria-hidden
        style={{
          ...box(175, 372, 80, 84),
          ["--d" as string]: "0.45s",
          filter: "drop-shadow(0 4px 8px rgb(0 0 0 / .45))",
          zIndex: 5,
        }}
      >
        <Art
          slot="wax-seal-gold"
          w={80}
          fallback={<SealArt slot={false} tone="gold" emblem="butterfly" />}
        />
      </div>
      <Pic
        slot="flowers-burgundy"
        l={-44}
        t={372}
        w={112}
        ratio={800 / 450}
        a="left"
        d={0.4}
        sway="stand"
        z={6}
        fallback={<CallaLily slot={false} className="h-full w-full" />}
      />
    </Section>
  );
}
