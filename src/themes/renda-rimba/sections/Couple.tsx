"use client";

import Image from "next/image";

import { useSlotAsset } from "../../_shared/assets";
import { Anthurium, Lily } from "../../_shared/ornaments";
import { couple, displayFullName, parentNames } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { Person } from "@/schemas/wedding";
import { F, Pic, Section, box, fitSize, txt, u, useFit } from "../canvas";

/**
 * Kartu mempelai (desain 430 × 900): kartu renda portrait (aset renda via
 * border-image), salam, nama + orang tua + Instagram, photo strip miring, dan
 * bunga anthurium/lili. Animasi masuk berurutan seperti desain (cc-enter).
 */
const H = 900;
const CARD = { l: 30, t: 58, w: 340, h: 704 };
const SALAM = "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ";

/** Bingkai renda: aset asli via border-image, cadangan garis ganda krem. */
export function useLaceBorder(width: number): React.CSSProperties {
  const img = useSlotAsset(undefined, "lace-card");
  if (!img) {
    return {
      border: `${u(10)} double var(--inv-lace-shade)`,
      outline: `${u(3)} solid var(--inv-lace)`,
      outlineOffset: u(-14),
      background: "#fbf6ee",
    };
  }
  // Irisan 112 px pada file 800 px desain asli → skala ke ukuran file hasil sync.
  const slice = Math.round((112 * img.width) / 800);
  return {
    border: `${u(width)} solid transparent`,
    borderImage: `url("${img.src}") ${slice} fill / ${u(width)} round`,
  };
}

function Name({ person, d }: { person: Person; d: number }) {
  const label = displayFullName(person);
  const ref = useFit<HTMLHeadingElement>(label, 0.94);
  return (
    <h3
      ref={ref}
      style={{
        ...txt(F.script, 33, 1.25, { color: "var(--inv-ink-dark)" }),
        fontSize: fitSize(33),
        whiteSpace: "nowrap",
        alignSelf: "stretch",
      }}
    >
      <span data-a="write" style={{ display: "inline-block", ["--d" as string]: `${d}s` }}>
        {label}
      </span>
    </h3>
  );
}

function PersonBlock({ person, lead, d }: { person: Person; lead: string; d: number }) {
  const names = parentNames(person.father, person.mother);
  const intro = person.childOrder ? `${person.childOrder} dari` : lead;
  return (
    <>
      <Name person={person} d={d} />
      {names.length > 0 && (
        <p
          data-a="up"
          style={{
            ...txt(F.sans, 10, 1.45, { weight: 300, color: "var(--inv-ink)" }),
            marginTop: u(4),
            ["--d" as string]: `${d + 0.55}s`,
          }}
        >
          {intro} {names[0]}
          {names[1] && (
            <>
              {" "}
              &amp;
              <br />
              {names[1]}
            </>
          )}
        </p>
      )}
      {person.instagram && (
        <a
          data-a="up"
          href={`https://instagram.com/${encodeURIComponent(person.instagram)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram @${person.instagram}`}
          style={{
            ["--d" as string]: `${d + 0.55}s`,
            display: "inline-flex",
            alignItems: "center",
            gap: u(4),
            marginTop: u(14),
            ...txt(F.body, 9.2, 1.2, { color: "var(--inv-ink)" }),
            textDecoration: "none",
            pointerEvents: "auto",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            style={{ width: u(10), height: u(10) }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          @{person.instagram}
        </a>
      )}
    </>
  );
}

export function RendaCouple() {
  const { inv } = useInvitation();
  const lace = useLaceBorder(48);
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const lead = (p: Person) => (p === d.bride ? "Putri dari" : "Putra dari");
  const islami = d.greeting?.style === "islami";
  const opening =
    d.greeting?.openingText ??
    (islami
      ? "Dengan memohon rahmat dan ridho Allah SWT,\nkami mengundang Bapak/Ibu/Saudara/i\nuntuk hadir di hari bahagia kami."
      : "Dengan penuh sukacita,\nkami mengundang Bapak/Ibu/Saudara/i\nuntuk hadir di hari bahagia kami.");
  const strip = d.photos.strip.slice(0, 3);

  return (
    <Section id="profil" height={H} z={2} threshold={0.25}>
      <Pic
        slot="anthurium"
        l={300}
        t={-36}
        w={136}
        ratio={799 / 343}
        flip
        rotate={-8}
        a="soft"
        d={0.3}
        sway="hang"
        z={4}
        fallback={<Anthurium slot={false} className="h-full w-full" />}
      />

      <div
        data-a="unfold"
        style={{
          ...box(CARD.l, CARD.t, CARD.w),
          minHeight: u(CARD.h),
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: `${u(20)} ${u(4)}`,
          filter: "drop-shadow(0 6px 14px rgb(0 0 0 / .35))",
          zIndex: 3,
          ...lace,
        }}
      >
        {islami && (
          <p
            lang="ar"
            dir="rtl"
            data-a="up"
            style={{
              ...txt(F.arabic, 22, 1.5, { color: "var(--inv-arabic)" }),
              ["--d" as string]: "0.55s",
            }}
          >
            {SALAM}
          </p>
        )}
        <p
          data-a="up"
          style={{
            ...txt(F.body, 10, 1.65, { color: "var(--inv-ink)" }),
            margin: `${u(14)} 0 ${u(44)}`,
            whiteSpace: "pre-line",
            ["--d" as string]: "0.75s",
          }}
        >
          {opening}
        </p>
        <PersonBlock person={a} lead={lead(a)} d={0.95} />
        <p
          data-a="pop"
          aria-hidden
          style={{
            ...txt(F.script, 38, 1, { color: "var(--inv-ink-dark)" }),
            margin: `${u(36)} 0 ${u(22)}`,
            ["--d" as string]: "1.55s",
          }}
        >
          &amp;
        </p>
        <PersonBlock person={b} lead={lead(b)} d={1.75} />
      </div>

      {strip.length > 0 && (
        <div
          data-a="drop"
          style={{
            ...box(262, 646, 106),
            ["--d" as string]: "1.2s",
            rotate: "11deg",
            display: "flex",
            flexDirection: "column",
            gap: u(5),
            padding: `${u(6)} ${u(6)} ${u(20)}`,
            background: "#fbfaf7",
            boxShadow: "0 8px 18px rgb(0 0 0 / .45)",
            zIndex: 4,
          }}
        >
          {strip.map((photo, i) => (
            <div
              key={photo.url + i}
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                overflow: "hidden",
                background: "#ddd",
              }}
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="(max-width: 440px) 25vw, 110px"
                style={{
                  objectFit: "cover",
                  objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 40}%`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Pic
        slot="anthurium"
        l={-8}
        t={448}
        w={146}
        ratio={799 / 343}
        a="soft"
        d={0.3}
        sway="hang"
        z={4}
        fallback={<Anthurium slot={false} className="h-full w-full" />}
      />
      <Pic
        slot="lily"
        l={344}
        t={862}
        w={88}
        ratio={737 / 799}
        rotate={-14}
        a="bloom"
        d={1.9}
        sway="stand"
        z={5}
        fallback={<Lily slot={false} className="h-full w-full" />}
      />
    </Section>
  );
}
