"use client";

import Image from "next/image";

import { useInvitation } from "../../_shared/runtime/context";
import { SwanPair } from "../art/Swans";
import { F, Section, txt, u } from "../canvas";

/**
 * Love Story: latar renda gading timbul (pola lubang & bunga kecil), panel
 * krem bertepi titik, judul skrip "Love Story", bab cerita (judul tebal
 * miring + paragraf), lalu sepasang angsa di antara lili pink di bawah.
 */
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const LACE = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><rect width="22" height="22" fill="#dcd4c2"/><circle cx="11" cy="11" r="4.4" fill="#e9e2d2" stroke="#fbf8f1" stroke-width="1.8"/><circle cx="11.7" cy="11.7" r="4.4" fill="none" stroke="#b9ae96" stroke-width="0.7"/><circle cx="0" cy="0" r="1.6" fill="#f8f5ee"/><circle cx="22" cy="0" r="1.6" fill="#f8f5ee"/><circle cx="0" cy="22" r="1.6" fill="#f8f5ee"/><circle cx="22" cy="22" r="1.6" fill="#f8f5ee"/><circle cx="11" cy="0" r="0.9" fill="#d8cfbd"/><circle cx="0" cy="11" r="0.9" fill="#d8cfbd"/></svg>`,
);
/** Motif bunga renda besar (pita atas), ubin 120 px. */
const LACE_FLORAL = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72"><g fill="none" stroke="#faf7f0" stroke-width="2"><path d="M60 64 C40 50 36 26 60 10 C84 26 80 50 60 64Z"/><path d="M60 50 C50 40 50 28 60 20 C70 28 70 40 60 50Z"/><path d="M10 60 C20 40 34 34 44 44 M110 60 C100 40 86 34 76 44"/></g><g fill="#cfc6b2" opacity="0.6"><circle cx="60" cy="36" r="2"/><circle cx="30" cy="20" r="1.4"/><circle cx="90" cy="20" r="1.4"/></g></svg>`,
);

export function LiliLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const items = inv.data.loveStory;
  if (items.length === 0) return null;

  return (
    <Section
      id="loveStory"
      bg={{
        backgroundColor: "#dcd4c2",
        backgroundImage: `${LACE_FLORAL}, ${LACE}`,
        backgroundSize: `${u(120)} ${u(72)}, ${u(22)} ${u(22)}`,
        backgroundRepeat: "repeat-x, repeat",
        backgroundPosition: "0 0, 0 0",
      }}
      overflow="hidden"
    >
      <div
        style={{
          position: "relative",
          margin: `${u(72)} ${u(38)} 0`,
          padding: `${u(26)} ${u(6)} ${u(96)}`,
          background: "#f3e9d3",
          boxShadow: "0 0 0 1px #ded5c2, inset 0 0 0 4px #f2ecdd, inset 0 0 0 5px #d9cfb9",
        }}
      >
        <h2
          data-a
          style={{
            ...txt(F.script, 58, 1.25, { color: "var(--inv-sage-dark)" }),
          }}
        >
          Love Story
        </h2>
        {items.map((it, i) => (
          <div
            key={`${it.title}-${i}`}
            data-a
            style={{ marginTop: u(i === 0 ? 8 : 26), ["--d" as string]: `${0.1 + i * 0.12}s` }}
          >
            {it.photo && (
              <div
                style={{
                  position: "relative",
                  width: u(180),
                  height: u(130),
                  margin: `0 auto ${u(10)}`,
                  border: `${u(4)} solid #fffdf8`,
                  boxShadow: "0 1px 3px rgb(0 0 0 / 0.18)",
                }}
              >
                <Image
                  src={it.photo.url}
                  alt={it.photo.alt ?? it.title}
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <h3 style={txt(F.serif, 15.5, 1.35, { italic: true, weight: 700, color: "#4f5238" })}>
              {it.title}
            </h3>
            {it.date && (
              <p style={txt(F.serif, 12, 1.4, { italic: true, color: "#7a7765" })}>{it.date}</p>
            )}
            {it.text && (
              <p
                style={{
                  ...txt(F.serif, 14, u(20.5), { color: "#5d5b4c" }),
                  marginTop: u(2),
                }}
              >
                {it.text}
              </p>
            )}
          </div>
        ))}
      </div>
      <div data-a="fade" style={{ position: "relative", marginTop: u(-110), height: u(230) }}>
        <SwanPair style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
    </Section>
  );
}
