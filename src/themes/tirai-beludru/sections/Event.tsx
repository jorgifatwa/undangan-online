"use client";

import { Fragment } from "react";

import { googleCalendarUrl, icsContent, isAppleDevice } from "@/lib/calendar";
import {
  dateParts,
  eventDateLabel,
  eventEnd,
  eventStart,
  eventTimeLabel,
  firstEvent,
} from "@/lib/datetime";
import type { InvitationEvent } from "@/schemas/common";

import { useCountdown } from "../../_shared/hooks";
import { coupleNames } from "../../_shared/format";
import { Reveal } from "../../_shared/motion/Reveal";
import {
  Butterfly,
  CallaLily,
  Skyline,
  Sparkles,
  Street,
  StreetTree,
  Tower,
} from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { SuedeTexture } from "../../_shared/textures";
import { Art } from "../art";
import { CText, CREAM, F, Placed, canvasText, u, type Box } from "../canvas";

/**
 * Section 3 desain (acara). Bagian dekoratif atas memakai koordinat kanvas asli
 * (Save the Date, blok tanggal, ilustrasi gedung pop-up). Detail acara di
 * bawahnya MENGALIR dengan metrik desain yang sama (ukuran font, jarak baris
 * 24,8 px, jarak antar-blok 107,65 px dengan pemisah calla di tengahnya),
 * sehingga 1–3 acara & alamat panjang tetap rapi.
 */

const SUEDE = (
  <Art
    slot="suede-bg"
    w={960}
    fit="cover"
    filter="var(--inv-filter-suede)"
    fallback={<SuedeTexture slot={false} />}
  />
);

function RotatedWord({
  text,
  center,
  size,
  fontSize,
}: {
  text: string;
  center: [number, number];
  size: [number, number];
  fontSize: number;
}) {
  return (
    <Reveal
      variant="swing"
      style={{
        position: "absolute",
        left: u(center[0] - size[0] / 2),
        top: u(center[1] - size[1] / 2),
        width: u(size[0]),
        height: u(size[1]),
        pointerEvents: "none",
      }}
    >
      <p
        style={{
          margin: 0,
          transform: "rotate(-8.85deg)",
          fontFamily: F.saveDate,
          fontSize: u(fontSize),
          lineHeight: u(size[1]),
          color: "var(--inv-cream)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </p>
    </Reveal>
  );
}

function Rule({ box, rotate }: { box: Box; rotate?: number }) {
  return (
    <Reveal
      variant="wipe"
      style={{
        position: "absolute",
        left: u(box[0]),
        top: u(box[1]),
        width: u(box[2]),
        height: u(box[3]),
        background: CREAM,
        rotate: rotate ? `${rotate}deg` : undefined,
        pointerEvents: "none",
      }}
    >
      <span />
    </Reveal>
  );
}

function Sparkle({ at }: { at: [number, number] }) {
  return (
    <Sparkles
      style={{
        position: "absolute",
        left: u(at[0]),
        top: u(at[1]),
        width: u(37.95),
        height: u(53.45),
        pointerEvents: "none",
      }}
    />
  );
}

const DATE_BLOCK_SCALE = 1.14795;
const pukul = (e?: InvitationEvent) =>
  e?.startTime ? `Pukul ${e.startTime.replace(":", ".")} ${e.timezone}` : "";

/** Gaya teks mengalir (renderScale 1 agar ukuran kotak = ukuran tampil). */
const flowText = (
  size: number,
  lh: number,
  o: { bold?: boolean; ls?: number; font?: string } = {},
): React.CSSProperties => ({
  margin: 0,
  fontFamily: o.font ?? F.body,
  fontSize: u(size),
  lineHeight: u(lh),
  letterSpacing: u(o.ls ?? 0),
  fontWeight: o.bold ? 700 : 400,
  color: "var(--inv-cream)",
  textAlign: "center",
});

function MapsButton({ href }: { href: string }) {
  return (
    <Reveal variant="pop" style={{ display: "flex", justifyContent: "center" }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: u(172.15),
          height: u(32.45),
          background: "var(--inv-button)",
          borderRadius: u(4),
          textDecoration: "none",
          ...flowText(16.32, 32.45),
        }}
      >
        Google Maps
      </a>
    </Reveal>
  );
}

function EventBlock({ e }: { e: InvitationEvent }) {
  const time = eventTimeLabel(e);
  const address = (e.address ?? "").split("\n").filter(Boolean);
  return (
    <div>
      <Reveal variant="blur">
        <p style={{ ...flowText(51.556, 72.15, { font: F.script }), padding: `0 ${u(20)}` }}>
          {e.name}
        </p>
      </Reveal>
      <div style={{ marginTop: u(28.26), padding: `0 ${u(58.76)}` }}>
        <p style={flowText(14.602, 24.8, { bold: true, ls: 1.037 })}>{eventDateLabel(e)}</p>
        {time && <p style={flowText(14.602, 24.8, { ls: 1.037 })}>{time.replace(" – ", " - ")}</p>}
        {e.venueName && (
          <p
            style={{
              ...flowText(14.602, 24.8, { bold: true, ls: 1.037 }),
              marginTop: u(24.8),
              textTransform: "uppercase",
            }}
          >
            {e.venueName}
          </p>
        )}
        {address.map((line, i) => (
          <p key={i} style={flowText(14.602, 24.8, { ls: 1.037 })}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Pemisah calla lily (diputar −98,54°): pusatnya 57,9 di bawah blok sebelumnya, blok berikut mulai 107,65 di bawahnya. */
function CallaDivider() {
  return (
    <div style={{ position: "relative", height: u(107.65) }}>
      <Reveal
        variant="pop"
        style={{
          position: "absolute",
          left: u(225.08 - 47.24 / 2),
          top: u(57.9 - 90.88 / 2),
          width: u(47.24),
          height: u(90.88),
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: "rotate(-98.54deg)" }}>
          <Art
            slot="calla-divider"
            w={48}
            fallback={
              <CallaLily stems={1} slot={false} className="absolute inset-0 h-full w-full" />
            }
          />
        </div>
      </Reveal>
    </div>
  );
}

export function TiraiEvent() {
  const { inv } = useInvitation();
  const events = inv.data.events;
  const first = firstEvent(events);
  const second = events.find((e) => e !== first);
  const p = dateParts(first.date, first.timezone);
  // Satu tombol peta bila semua acara di tempat yang sama, selain itu per acara.
  const mapsUrls = [...new Set(events.map((e) => e.mapsUrl).filter(Boolean))] as string[];
  const sharedMap = mapsUrls.length === 1 ? mapsUrls[0] : null;

  return (
    <SectionShell
      id="acara"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        containerType: "inline-size",
        background: "#2c3e28",
        contentVisibility: "visible",
        perspective: 900,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>{SUEDE}</div>

      {/* --- Bagian dekoratif (koordinat kanvas) --- */}
      <div style={{ position: "relative", height: u(741.57) }}>
        <RotatedWord
          text="Save"
          center={[222.16, 136.11]}
          size={[315.13, 101.62]}
          fontSize={72.85}
        />
        <RotatedWord text="the" center={[244.66, 185.06]} size={[157.56, 50.81]} fontSize={36.42} />
        <RotatedWord
          text="Date"
          center={[228.02, 270.61]}
          size={[315.13, 101.62]}
          fontSize={72.85}
        />
        <Placed img={[333.52, 208.11, 30.86, 32.22]} reveal="pop">
          <Art
            slot="butterfly"
            w={31}
            fallback={<Butterfly slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>

        <CText
          reveal="drop"
          style={canvasText([106.73, 348.72, 236.67], F.body, 18.367, 18.37, {
            letterSpacing: -0.037,
            bold: true,
            renderScale: DATE_BLOCK_SCALE,
          })}
        >
          {p.month.toUpperCase()}
        </CText>
        <Rule box={[50.22, 383.74, 126.52, 2]} />
        <Rule box={[50.22, 463.7, 126.52, 2]} rotate={-0.484} />
        <CText
          reveal="left"
          style={canvasText([27.01, 396.36, 141.11], F.script, 38.265, 37.88, {
            letterSpacing: -0.0765,
            align: "right",
            renderScale: DATE_BLOCK_SCALE,
          })}
        >
          {first.name}
        </CText>
        <CText
          reveal="left"
          style={canvasText([36.29, 438.99, 140.43], F.body, 13.775, 13.78, {
            letterSpacing: -0.0275,
            align: "right",
            bold: true,
            renderScale: DATE_BLOCK_SCALE,
          })}
        >
          {pukul(first)}
        </CText>
        <Reveal
          variant="flip"
          style={{
            position: "absolute",
            left: u(140.08),
            top: u(388.35),
            width: u(170.01),
            height: u(63.31),
            pointerEvents: "none",
          }}
        >
          <div className="tb-pulse" style={{ position: "absolute", inset: 0 }}>
            <p
              style={{
                ...canvasText([0, 0, 170.01], F.body, 45.39, 63.31, {
                  bold: true,
                  renderScale: 0.34783,
                }),
                position: "absolute",
              }}
            >
              {p.day}
            </p>
          </div>
        </Reveal>
        {second && (
          <>
            <Rule box={[278.74, 378.64, 125.92, 2]} />
            <Rule box={[278.74, 460.21, 125.92, 2]} />
            <CText
              reveal="right"
              style={canvasText([278.74, 392.32, 141.56], F.script, 38.265, 37.88, {
                letterSpacing: -0.0765,
                align: "left",
                renderScale: DATE_BLOCK_SCALE,
              })}
            >
              {second.name}
            </CText>
            <CText
              reveal="right"
              style={canvasText([278.74, 434.96, 140.43], F.body, 13.775, 13.78, {
                letterSpacing: -0.0275,
                align: "left",
                bold: true,
                renderScale: DATE_BLOCK_SCALE,
              })}
            >
              {pukul(second)}
            </CText>
          </>
        )}
        <CText
          reveal="rise"
          style={canvasText([146.37, 463.74, 157.44], F.body, 21.43, 29.97, {
            bold: true,
            renderScale: 0.483403,
          })}
        >
          {p.year}
        </CText>

        {/* Ilustrasi gedung seperti buku pop-up: jalan → menara → sayap → pohon */}
        <Placed img={[40, 648, 360, 33]} reveal="popup-ground">
          <Art
            slot="city-street"
            w={360}
            fallback={<Street slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>
        <Placed img={[47, 552, 121, 104]} reveal="popup-left" delay={0.8}>
          <Art
            slot="city-skyline-left"
            w={121}
            fallback={
              <Skyline side="left" slot={false} className="absolute inset-0 h-full w-full" />
            }
          />
        </Placed>
        <Placed img={[273, 550, 108, 105]} reveal="popup-right" delay={0.8}>
          <Art
            slot="city-skyline-right"
            w={108}
            fallback={
              <Skyline side="right" slot={false} className="absolute inset-0 h-full w-full" />
            }
          />
        </Placed>
        <Placed img={[143, 491, 195, 163]} reveal="popup-up" delay={0.35}>
          <Art
            slot="city-tower"
            w={195}
            fallback={<Tower slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>
        <Placed img={[107, 613, 68, 47]} reveal="popup-up" delay={1.5}>
          <Art
            slot="city-tree-left"
            w={68}
            fallback={<StreetTree slot={false} className="absolute inset-0 h-full w-full" />}
          />
        </Placed>
        <Placed img={[261, 613, 90, 47]} reveal="popup-up" delay={1.65}>
          <Art
            slot="city-tree-right"
            w={90}
            fallback={
              <StreetTree lamp="right" slot={false} className="absolute inset-0 h-full w-full" />
            }
          />
        </Placed>

        <Sparkle at={[332.36, 495.02]} />
        <Sparkle at={[54.17, 623.37]} />
        <Sparkle at={[290.28, 699.86]} />
      </div>

      {/* --- Detail acara (mengalir) --- */}
      <div style={{ position: "relative" }}>
        {events.map((e, i) => (
          <Fragment key={e.id}>
            {i > 0 && <CallaDivider />}
            <EventBlock e={e} />
            {!sharedMap && e.mapsUrl && (
              <div style={{ marginTop: u(21.11) }}>
                <MapsButton href={e.mapsUrl} />
              </div>
            )}
          </Fragment>
        ))}
        {sharedMap && (
          <div style={{ marginTop: u(21.11) }}>
            <MapsButton href={sharedMap} />
          </div>
        )}
        <div style={{ height: u(67.84) }} />
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------------ */

const BOX_W = 74;
const BOX_H = 70;
const BOX_GAP = 12;
const BOXES_LEFT = (440 - 4 * BOX_W - 3 * BOX_GAP) / 2;
const COUNT_H = 50 + 162 + 32.45 + 67.84;
const UNITS = ["Hari", "Jam", "Menit", "Detik"] as const;

/** Hitung mundur + "Simpan ke Kalender" (desain: di bawah tombol peta, latar suede yang sama). */
export function TiraiCountdown() {
  const { inv } = useInvitation();
  const first = firstEvent(inv.data.events);
  const last = [...inv.data.events].sort(
    (a, b) => eventEnd(b).getTime() - eventEnd(a).getTime(),
  )[0];
  const c = useCountdown(eventStart(first));
  const over = c.ready && Date.now() > eventEnd(last).getTime();
  const values = [c.days, c.hours, c.minutes, c.seconds];
  const title = inv.eventType === "WEDDING" ? `Pernikahan ${coupleNames(inv.data)}` : "Undangan";
  const top = 50;

  const onCalendar = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAppleDevice()) return;
    e.preventDefault();
    const url = URL.createObjectURL(
      new Blob([icsContent(title, inv.data.events, window.location.href)], {
        type: "text/calendar",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "undangan.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionShell
      id="hitungMundur"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${COUNT_H}`,
        overflow: "hidden",
        containerType: "inline-size",
        background: "#2c3e28",
        contentVisibility: "visible",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>{SUEDE}</div>
      <CText reveal="blur" style={canvasText([20, top, 400], F.script, 34, 48)}>
        Menuju Hari Bahagia
      </CText>
      {c.done || over ? (
        <CText
          reveal="rise"
          style={canvasText([20, top + 86, 400], F.body, 15, 22, { letterSpacing: 1, bold: true })}
        >
          {over ? "Terima kasih atas doa dan restunya" : "Hari bahagia kami telah tiba"}
        </CText>
      ) : (
        UNITS.map((unit, i) => (
          <Reveal
            key={unit}
            variant="pop"
            style={{
              position: "absolute",
              left: u(BOXES_LEFT + i * (BOX_W + BOX_GAP)),
              top: u(top + 62),
              width: u(BOX_W),
              height: u(BOX_H),
              border: `${u(1)} solid rgb(250 243 237 / 0.55)`,
              borderRadius: u(6),
              background: "rgb(250 243 237 / 0.07)",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            <div role="timer" aria-label={`${values[i]} ${unit}`}>
              <p style={canvasText([0, 9, BOX_W - 2], F.body, 28, 34, { bold: true })}>
                <span key={c.ready ? values[i] : "-"} className="tb-tick">
                  {c.ready ? String(values[i]).padStart(2, "0") : "--"}
                </span>
              </p>
              <p style={canvasText([0, 45, BOX_W - 2], F.body, 10.5, 14, { letterSpacing: 1.6 })}>
                {unit.toUpperCase()}
              </p>
            </div>
          </Reveal>
        ))
      )}
      <Reveal
        variant="pop"
        style={{
          position: "absolute",
          left: u(120),
          top: u(top + 162),
          width: u(200),
          height: u(32.45),
        }}
      >
        <a
          href={googleCalendarUrl(title, first)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCalendar}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            background: "var(--inv-button)",
            borderRadius: u(4),
            textDecoration: "none",
            ...flowText(16.32, 32.45),
          }}
        >
          Simpan ke Kalender
        </a>
      </Reveal>
      <Sparkle at={[311.57, top + 150]} />
    </SectionShell>
  );
}
