"use client";

import Image from "next/image";
import { useId } from "react";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { FRAME_H, FRAME_HOLE, FRAME_W, OvalFrame } from "../art/OvalFrame";
import { paperBg } from "../art/textures";
import { Alstroemeria, FlowerDefs, GreenOrchid, PinkLily } from "../art/Flowers";
import { Butterfly, LilyCluster } from "../art/Watercolor";
import { F, Section, box, txt, u, useFit } from "../canvas";

/**
 * Penutup (kanvas 430, kertas krem + sapuan cat air pink): bingkai oval
 * dengan foto penutup, lili cat air + mutiara, kupu-kupu, kalimat penutup
 * miring, "Wassalamualaikum Wr. Wb" (gaya islami), nama skrip, lalu hamparan
 * bunga (lili krem & pink, anggrek hijau, alstroemeria) selebar layar.
 */
const FRAME = { l: 75, t: 24 };
const FALLBACK =
  "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu untuk mengiringi langkah baru kami. Atas kehadiran dan doa yang diberikan, kami ucapkan terima kasih.";

function FloralBed() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden
      viewBox="0 0 430 180"
      style={{ display: "block", width: "100%", height: u(180), overflow: "visible" }}
    >
      <defs>
        <FlowerDefs id={id} />
      </defs>
      <GreenOrchid id={id} x={178} y={70} s={1.25} rot={-6} />
      <GreenOrchid id={id} x={20} y={150} s={1.1} rot={20} />
      <PinkLily id={id} x={330} y={78} s={1.15} rot={18} white />
      <PinkLily id={id} x={52} y={88} s={1.1} rot={-20} white />
      <Alstroemeria id={id} x={250} y={118} s={1.25} rot={8} />
      <Alstroemeria id={id} x={118} y={150} s={1.15} rot={-16} />
      <PinkLily id={id} x={400} y={160} s={1.1} rot={-8} />
      <PinkLily id={id} x={200} y={176} s={1.05} rot={14} white />
      <Alstroemeria id={id} x={312} y={186} s={1.1} rot={30} />
    </svg>
  );
}

export function LiliClosing() {
  const { inv } = useInvitation();
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const [a, b] = d ? couple(d) : [null, null];
  const names = `${a ? shortName(a) : ""}|${b ? shortName(b) : ""}`;
  const namesRef = useFit<HTMLParagraphElement>(names);
  const islami = inv.data.greeting?.style === "islami";
  const photo = d?.photos.closing ?? d?.photos.cover;
  const hole = {
    l: FRAME.l + FRAME_HOLE.cx - FRAME_HOLE.rx,
    t: FRAME.t + FRAME_HOLE.cy - FRAME_HOLE.ry,
    w: FRAME_HOLE.rx * 2,
    h: FRAME_HOLE.ry * 2,
  };

  return (
    <Section
      id="penutup"
      bg={{
        ...paperBg(),
        backgroundImage: `radial-gradient(ellipse 34% 20% at 82% 40%, rgb(240 170 196 / 0.35), transparent 70%), radial-gradient(ellipse 30% 12% at 10% 6%, rgb(240 170 196 / 0.22), transparent 70%), ${paperBg().backgroundImage}`,
        backgroundSize: `auto, auto, ${paperBg().backgroundSize}`,
        backgroundBlendMode: `normal, normal, ${paperBg().backgroundBlendMode}`,
      }}
      overflow="hidden"
    >
      <div style={{ position: "relative", height: u(FRAME.t + FRAME_H + 20) }}>
        <div
          data-a="zoom"
          style={{ ...box(0, 0, 430, FRAME.t + FRAME_H), ["--d" as string]: "0.1s" }}
        >
          <div
            style={{
              ...box(hole.l, hole.t, hole.w, hole.h),
              borderRadius: "50%",
              overflow: "hidden",
              background: "linear-gradient(160deg, var(--inv-sage-light), var(--inv-sage))",
            }}
          >
            {photo && (
              <Image
                src={photo.url}
                alt={photo.alt ?? "Foto penutup"}
                fill
                sizes="(max-width: 440px) 46vw, 200px"
                style={{
                  objectFit: "cover",
                  objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 40}%`,
                }}
              />
            )}
          </div>
          <OvalFrame
            style={{
              ...box(FRAME.l, FRAME.t, FRAME_W, FRAME_H),
              filter: "drop-shadow(0 2px 3px rgb(60 60 40 / 0.28))",
            }}
          />
        </div>
        <div data-a="fade" style={{ ...box(206, -14, 150, 165), ["--d" as string]: "0.4s" }}>
          <LilyCluster style={{ width: "100%", height: "100%", overflow: "visible" }} />
        </div>
        <div data-a="left" style={{ ...box(92, 308, 92, 78), ["--d" as string]: "0.5s" }}>
          <Butterfly style={{ width: "100%", height: "100%", overflow: "visible" }} />
        </div>
      </div>

      <div style={{ position: "relative", padding: `${u(14)} ${u(34)} 0` }}>
        <p
          data-a
          style={{
            ...txt(F.serif, 12.2, u(15.5), { italic: true, color: "var(--inv-ink)" }),
            ["--d" as string]: "0.2s",
          }}
        >
          {inv.data.greeting?.closingText ?? FALLBACK}
        </p>
        {islami && (
          <p
            data-a
            style={{
              ...txt(F.serif, 19, 1.3, { color: "var(--inv-ink)" }),
              marginTop: u(16),
              ["--d" as string]: "0.3s",
            }}
          >
            Wassalamualaikum Wr. Wb
          </p>
        )}
        <p
          ref={namesRef}
          data-a
          style={{
            ...txt(F.script, 46, 1.4, { color: "var(--inv-sage-dark)" }),
            fontSize: `calc(${u(46)} * var(--fit, 1))`,
            whiteSpace: "nowrap",
            marginTop: u(10),
            ["--d" as string]: "0.4s",
          }}
        >
          {a ? shortName(a) : ""}{" "}
          <span style={{ fontFamily: F.amp, fontSize: "0.9em" }}>&amp;</span>{" "}
          {b ? shortName(b) : ""}
        </p>
      </div>
      <div data-a="fade" style={{ marginTop: u(8), ["--d" as string]: "0.3s" }}>
        <FloralBed />
      </div>
    </Section>
  );
}
