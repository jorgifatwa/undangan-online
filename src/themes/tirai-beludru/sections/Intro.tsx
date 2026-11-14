"use client";

import { coupleNames } from "../../_shared/format";

import { eventDateLabel, firstEvent } from "@/lib/datetime";

import { useRef } from "react";

import { Butterfly, Tassel } from "../../_shared/ornaments";
import { useAudio } from "../../_shared/runtime/audio";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { Art } from "../art";
import { F, Placed, u, type Box } from "../canvas";
import { useTirai } from "../context";
import {
  AccentBouquet,
  Drapery,
  EnvelopeBack,
  EnvelopeFront,
  EnvelopeLining,
  HangingBouquet,
  LaceCard,
  SECTION1_DRAPERY,
  SECTION1_FIT_WIDTH,
  SECTION1_H,
  CardNames,
  Verse,
} from "../scene";

const ICON = "#ebe2d3";

function PlayerIcon({
  box,
  viewBox,
  d,
  fill = ICON,
  dim,
}: {
  box: Box;
  viewBox: string;
  d: string;
  fill?: string;
  dim?: boolean;
}) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden
      style={{
        position: "absolute",
        left: u(box[0]),
        top: u(box[1]),
        width: u(box[2]),
        height: u(box[3]),
        pointerEvents: "none",
        opacity: dim ? 0.45 : 1,
      }}
    >
      <path d={d} fill={fill} />
    </svg>
  );
}

function HitButton({
  box,
  label,
  onClick,
  pressed,
}: {
  box: Box;
  label: string;
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      style={{
        position: "absolute",
        left: u(box[0]),
        top: u(box[1]),
        width: u(box[2]),
        height: u(box[3]),
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        zIndex: 1,
      }}
    />
  );
}

/** Pemutar musik di bawah amplop: geser progres, acak, sebelumnya, putar/jeda, berikutnya, ulangi. */
function Player() {
  const a = useAudio();
  const barRef = useRef<HTMLDivElement | null>(null);
  // Desain menampilkan progres 15% saat diam.
  const pct = Math.min(100, Math.max(0, a.progress > 0 ? a.progress * 100 : 15));

  return (
    <>
      <div
        ref={barRef}
        role="slider"
        aria-label="Posisi lagu"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onClick={(e) => {
          const r = barRef.current?.getBoundingClientRect();
          if (r) a.seek((e.clientX - r.left) / r.width);
        }}
        style={{
          position: "absolute",
          left: u(139),
          top: u(763.3),
          width: u(161.7),
          height: u(14),
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: u(6),
            height: u(2),
            background: ICON,
            borderRadius: 9999,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: u(7),
            width: u(8.3),
            height: u(8.3),
            transform: "translate(-50%, -50%)",
            borderRadius: 9999,
            background: ICON,
            transition: "left 200ms ease",
          }}
        />
      </div>
      <PlayerIcon
        box={[139, 794.2, 13.7, 10]}
        viewBox="4 4 16 16"
        dim={!a.shuffle}
        d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
      />
      <HitButton
        box={[130.85, 784, 30, 30]}
        label="Acak lagu"
        onClick={a.toggleShuffle}
        pressed={a.shuffle}
      />
      <PlayerIcon
        box={[170.3, 792.5, 13.2, 13]}
        viewBox="6 6 11.5 12"
        d="M6 6h2v12H6zm3.5 6l8 6V6z"
      />
      <HitButton box={[161.9, 784, 30, 30]} label="Lagu sebelumnya" onClick={a.prev} />
      <div
        style={{
          position: "absolute",
          left: u(202.8),
          top: u(782),
          width: u(33.9),
          height: u(33.9),
          borderRadius: 9999,
          background: ICON,
          pointerEvents: "none",
          opacity: a.available ? 1 : 0.5,
        }}
      />
      {a.playing ? (
        <PlayerIcon
          box={[213.8, 792.2, 11.9, 13.6]}
          viewBox="6 5 12 14"
          d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
          fill="#3b1712"
        />
      ) : (
        <PlayerIcon
          box={[216.2, 792.2, 12.3, 13.6]}
          viewBox="8 5 11 14"
          d="M8 5v14l11-7z"
          fill="#3b1712"
        />
      )}
      <HitButton
        box={[199.75, 778.9, 40, 40]}
        label={a.playing ? "Jeda musik" : "Putar musik"}
        onClick={a.toggle}
      />
      <PlayerIcon
        box={[256.5, 792.5, 12.5, 13]}
        viewBox="6 6 12 12"
        d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"
      />
      <HitButton box={[247.75, 784, 30, 30]} label="Lagu berikutnya" onClick={a.next} />
      <PlayerIcon
        box={[288.2, 793.3, 12.5, 10.9]}
        viewBox="3 1 18 22"
        dim={a.repeat === "off"}
        d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"
      />
      {a.repeat === "one" && (
        <span
          style={{
            position: "absolute",
            left: u(298),
            top: u(788),
            fontFamily: F.body,
            fontSize: u(7),
            color: ICON,
            pointerEvents: "none",
          }}
        >
          1
        </span>
      )}
      <HitButton
        box={[279.45, 784, 30, 30]}
        label={`Ulangi: ${a.repeat === "all" ? "semua" : a.repeat === "one" ? "satu lagu" : "mati"}`}
        onClick={a.cycleRepeat}
      />
      <button
        type="button"
        onClick={a.toggle}
        style={{
          position: "absolute",
          left: u(92),
          top: u(827.3),
          width: u(256),
          margin: 0,
          padding: 0,
          background: "none",
          border: "none",
          fontFamily: F.cormorant,
          fontSize: u(12.582),
          lineHeight: u(18.67),
          color: "var(--inv-cream)",
          textAlign: "center",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        {a.available
          ? a.current?.title
            ? `♪ ${a.current.title}${a.current.artist ? ` — ${a.current.artist}` : ""}`
            : "ketuk pemutar untuk mendengarkan lagu kami"
          : "musik belum tersedia"}
      </button>
    </>
  );
}

/** Section "ayat": amplop terbuka + kartu renda berisi ayat + pemutar musik (Section 1 desain). */
export function TiraiIntro() {
  const { inv } = useInvitation();
  const { introPlayed } = useTirai();
  const q = inv.data.quote;

  return (
    <SectionShell
      id="ayat"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#060e0a",
        contentVisibility: "visible",
      }}
    >
      <div
        style={{
          position: "relative",
          width: SECTION1_FIT_WIDTH,
          margin: "0 auto",
          aspectRatio: `440 / ${SECTION1_H}`,
          containerType: "inline-size",
          userSelect: "none",
        }}
      >
        <Placed
          img={SECTION1_DRAPERY}
          clip={[SECTION1_DRAPERY[0], 0, SECTION1_DRAPERY[2], SECTION1_H]}
        >
          <Drapery priority />
        </Placed>
        <Placed img={[15.6, 88.1, 262, 327.5]} reveal="sway">
          <HangingBouquet w={262} />
        </Placed>
        <EnvelopeBack reveal="rise" skip={introPlayed} />
        <EnvelopeLining reveal="rise" skip={introPlayed} />
        <EnvelopeFront reveal="rise" skip={introPlayed} />
        <LaceCard skip={introPlayed} />
        <Placed
          img={[158.3, 431.9, 281.7, 352.1]}
          clip={[258.8, 557.5, 181.2, 226.5]}
          reveal="rise"
        >
          <AccentBouquet w={282} />
        </Placed>
        <Player />
        <Placed img={[44, 191.2, 134.5, 168.2]} reveal="sway">
          <HangingBouquet w={135} />
        </Placed>
        {/* teks ayat di atas untaian buket agar selalu terbaca */}
        {q?.translation ? (
          <Verse text={q.translation} source={q.source} skip={introPlayed} />
        ) : (
          inv.eventType === "WEDDING" && (
            <CardNames
              names={coupleNames(inv.data)}
              date={eventDateLabel(firstEvent(inv.data.events))}
              skip={introPlayed}
            />
          )
        )}
        <Placed img={[111.3, 117, 134.5, 168.2]} reveal="sway-right">
          <HangingBouquet w={135} />
        </Placed>
        <Placed img={[156.3, 108.9, 54.3, 56.7]} reveal="pop">
          <Art
            slot="butterfly"
            w={55}
            fallback={<Butterfly slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>
        <Placed
          img={[193.14, 478.53, 53.75, 110.4]}
          reveal="drop"
          rotate={1.234}
          style={{ overflow: "visible" }}
        >
          <Art
            slot="tassel"
            w={54}
            fallback={<Tassel slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>
      </div>
    </SectionShell>
  );
}
