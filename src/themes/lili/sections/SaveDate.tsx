"use client";

import { useInvitation } from "../../_shared/runtime/context";
import { FloralColumn } from "../art/FloralColumn";
import { paperBg } from "../art/textures";
import { F, Section, txt, u } from "../canvas";
import { CREAM_BLOCK, PAPER_H } from "./Couple";

/**
 * Save The Date (section `ayat`, kanvas 430 × 290): lanjutan kertas krem
 * mempelai kedua — bayangan daun lembut, judul "Save The Date", terjemahan
 * ayat + sumber. Kolom bunga kiri melanjutkan pola blok krem (+ gladiol
 * yang menjulur ke teks). Teks Arab tidak ditampilkan (seperti desain).
 */
const H = CREAM_BLOCK - PAPER_H; // 290

const DEFAULT_TRANSLATION =
  "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri agar kamu merasa tenteram kepadanya. Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.";
const DEFAULT_SOURCE = "QS. Ar-Rum: 21";

/** Bayangan daun (seperti bayangan ranting di atas kertas), diburamkan sekali. */
function LeafShadow() {
  const leaves = [
    [70, 40, -35, 84],
    [120, 70, -25, 96],
    [40, 120, -50, 78],
    [160, 130, -20, 90],
    [90, 170, -40, 84],
    [200, 200, -15, 72],
    [30, 220, -55, 70],
    [140, 230, -30, 80],
    [230, 120, -10, 70],
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 260 300"
      style={{
        position: "absolute",
        left: u(-10),
        top: u(10),
        width: u(300),
        height: u(300),
        filter: "blur(9px)",
        opacity: 0.85,
      }}
    >
      <path
        d="M-10 290 C60 200 140 120 260 30"
        stroke="rgb(70 68 55 / 0.25)"
        strokeWidth={5}
        fill="none"
      />
      {leaves.map(([x, y, r, l]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={l / 2}
          ry={l / 5.5}
          transform={`rotate(${r} ${x} ${y})`}
          fill="rgb(70 68 55 / 0.22)"
        />
      ))}
    </svg>
  );
}

export function LiliSaveDate() {
  const { inv } = useInvitation();
  const q = inv.data.quote;
  const translation = q?.translation ?? (q?.arabic ? null : DEFAULT_TRANSLATION);
  const source = q?.translation ? q.source : (q?.source ?? DEFAULT_SOURCE);

  return (
    <Section id="ayat" minHeight={H} bg={paperBg()} overflow="hidden">
      <LeafShadow />
      <FloralColumn
        from={PAPER_H}
        height={H + 160}
        total={CREAM_BLOCK + 160}
        side="left"
        shift={26}
        extraGlad={[PAPER_H + 250]}
      />
      <div
        style={{
          position: "relative",
          marginLeft: u(100),
          width: u(328),
          padding: `${u(90)} 0 ${u(22)}`,
        }}
      >
        <h2
          data-a
          style={{
            ...txt(F.serif, 33, 1.25, { italic: true, weight: 700, color: "var(--inv-ink)" }),
            marginLeft: u(18),
            ["--d" as string]: "0.1s",
          }}
        >
          Save The Date
        </h2>
        {translation && (
          <p
            data-a
            style={{
              ...txt(F.serif, 14.2, u(21.5), { weight: 600, color: "var(--inv-ink)" }),
              marginTop: u(12),
              ["--d" as string]: "0.3s",
            }}
          >
            &ldquo;{translation}&rdquo;
          </p>
        )}
        {source && (
          <p
            data-a
            style={{
              ...txt(F.serif, 13, 1.4, { weight: 600, color: "var(--inv-ink)" }),
              marginTop: u(12),
              ["--d" as string]: "0.45s",
            }}
          >
            &mdash; {source}
          </p>
        )}
      </div>
    </Section>
  );
}
