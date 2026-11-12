"use client";

import { useMemo, useState } from "react";

import { Sparkles } from "../../_shared/ornaments";
import { useInvitation, type WishItem } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { SuedeTexture } from "../../_shared/textures";
import { Art } from "../art";
import { CText, F, Placed, canvasText, u } from "../canvas";
import { AccentBouquet, HangingBouquet } from "../scene";

/**
 * Ucapan & Doa (desain: 440 × 932 di atas suede). Konfirmasi kehadiran (RSVP)
 * menyatu di formulir ini, seperti desain asli.
 * TAHAP 2: kiriman disimpan di state lokal; sambungan ke DB di tahap berikutnya.
 */
const MIN_H = 932;
const MAX_MSG = 300;
const OPTIONS = [
  { value: "HADIR", label: "Hadir" },
  { value: "TIDAK_HADIR", label: "Tidak Hadir" },
  { value: "RAGU", label: "Masih ragu" },
] as const;
type Attendance = (typeof OPTIONS)[number]["value"];
const BADGE: Record<Attendance, string> = {
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
  RAGU: "Ragu",
};

const field: React.CSSProperties = {
  padding: `${u(10)} ${u(12)}`,
  borderRadius: u(8),
  fontSize: `max(16px, ${u(17)})`,
};

function relative(iso: string) {
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units)
    if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
  return "baru saja";
}

export function TiraiWishes() {
  const { inv, wishes: initial, guestName, showToast } = useInvitation();
  const [local, setLocal] = useState<WishItem[]>([]);
  const [name, setName] = useState(guestName ?? "");
  const [attendance, setAttendance] = useState<Attendance | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const wishes = useMemo(() => [...local, ...initial], [local, initial]);
  const present = wishes.filter((w) => w.attendance === "HADIR").length;
  const absent = wishes.filter((w) => w.attendance === "TIDAK_HADIR").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama belum diisi.");
    if (!attendance) return setError("Pilih konfirmasi kehadiran.");
    if (!message.trim()) return setError("Ucapan belum diisi.");
    setError(null);
    setLocal((w) => [
      {
        name: name.trim(),
        message: message.trim(),
        attendance,
        createdAt: new Date().toISOString(),
      },
      ...w,
    ]);
    setMessage("");
    showToast("Terima kasih, ucapan Anda sudah terkirim!");
  };

  return (
    <SectionShell
      id="ucapan"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        minHeight: `calc(${u(MIN_H)})`,
        overflow: "hidden",
        containerType: "inline-size",
        background: "#2c3e28",
        contentVisibility: "visible",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <Art
          slot="suede-bg"
          w={960}
          fit="cover"
          filter="var(--inv-filter-suede)"
          fallback={<SuedeTexture slot={false} />}
        />
      </div>
      <Placed
        img={[-34.35, -23.84, 145.03, 181.3]}
        clip={[0, 0, 110.68, 157.46]}
        reveal="sway"
        parallax="hanging"
      >
        <HangingBouquet w={145} />
      </Placed>
      <Placed
        img={[302.3, -23.84, 180.94, 226.17]}
        clip={[302.3, 0, 137.7, 202.34]}
        flipX
        reveal="sway-right"
        parallax="hanging"
      >
        <HangingBouquet w={181} />
      </Placed>

      <div style={{ position: "relative", height: u(208) }}>
        <CText reveal="blur" style={canvasText([20, 52.56, 400], F.script, 51.574, 72.176)}>
          Ucapan &amp; Doa
        </CText>
        <Sparkles
          style={{
            position: "absolute",
            left: u(318),
            top: u(46),
            width: u(37.95),
            height: u(53.45),
          }}
        />
        <Sparkles
          style={{
            position: "absolute",
            left: u(96),
            top: u(100),
            width: u(27.64),
            height: u(38.92),
          }}
        />
        <p
          style={canvasText([40, 138, 360], F.cormorant, 16.341, 24.238, { renderScale: 0.73447 })}
        >
          Kirimkan ucapan dan doa terbaik
        </p>
        <p
          style={canvasText([40, 162.24, 360], F.cormorant, 16.341, 24.238, {
            renderScale: 0.73447,
          })}
        >
          {inv.eventType === "WEDDING" ? "untuk kedua mempelai" : "untuk yang berulang tahun"}
        </p>
      </div>

      <div
        style={{
          position: "relative",
          margin: `0 ${u(40)}`,
          display: "flex",
          flexDirection: "column",
          paddingBottom: u(140),
        }}
      >
        <form
          onSubmit={submit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: u(10) }}
        >
          <input
            className="tb-field"
            style={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Nama Anda"
            aria-label="Nama"
            autoComplete="name"
          />
          <select
            className="tb-field"
            style={{ ...field, color: attendance ? "var(--inv-cream)" : "rgb(250 243 237 / 0.6)" }}
            value={attendance}
            onChange={(e) => setAttendance(e.target.value as Attendance)}
            aria-label="Konfirmasi kehadiran"
          >
            <option value="" disabled>
              Konfirmasi kehadiran
            </option>
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea
            className="tb-field"
            style={{ ...field, height: u(118), resize: "none" }}
            value={message}
            maxLength={MAX_MSG}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              inv.eventType === "WEDDING"
                ? "Tulis ucapan & doa untuk kedua mempelai..."
                : "Tulis ucapan & doa..."
            }
            aria-label="Ucapan"
          />
          <div
            style={{
              textAlign: "right",
              color: "rgb(250 243 237 / 0.7)",
              fontFamily: F.cormorant,
              fontSize: u(13),
              marginTop: u(-4),
            }}
          >
            {message.length}/{MAX_MSG}
          </div>
          <button
            type="submit"
            style={{
              alignSelf: "center",
              width: u(160),
              height: u(40),
              border: "none",
              borderRadius: u(6),
              background: "var(--inv-button)",
              color: "var(--inv-cream)",
              fontFamily: F.body,
              fontSize: u(15),
              letterSpacing: u(0.6),
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            Kirim Ucapan
          </button>
          <div
            role="alert"
            aria-live="polite"
            style={{
              minHeight: u(20),
              textAlign: "center",
              fontFamily: F.cormorant,
              fontSize: u(15),
              color: "#ffe4dc",
            }}
          >
            {error}
          </div>
        </form>

        <p
          style={{
            margin: `${u(10)} 0 ${u(8)}`,
            textAlign: "center",
            color: "var(--inv-cream)",
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: u(14.6),
            lineHeight: u(20),
          }}
        >
          {wishes.length} Ucapan · {present} Hadir · {absent} Tidak Hadir
        </p>
        <div
          style={{
            height: u(232),
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: `${u(4)} ${u(14)}`,
            background: "rgb(10 22 15 / 0.3)",
            border: "1px solid rgb(250 243 237 / 0.25)",
            borderRadius: u(10),
          }}
        >
          {wishes.length === 0 && (
            <p
              style={{
                margin: `${u(24)} 0`,
                textAlign: "center",
                color: "rgb(250 243 237 / 0.8)",
                fontFamily: F.cormorant,
                fontSize: u(16),
              }}
            >
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          )}
          {wishes.map((w, i) => (
            <article
              key={i}
              style={{
                padding: `${u(12)} 0`,
                borderTop: i === 0 ? "none" : "1px solid rgb(250 243 237 / 0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: u(8),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: u(8), minWidth: 0 }}>
                  <span
                    style={{
                      color: "var(--inv-cream)",
                      fontFamily: F.body,
                      fontWeight: 700,
                      fontSize: u(14.5),
                      lineHeight: 1.3,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {w.name}
                  </span>
                  {w.attendance && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: `${u(1)} ${u(7)}`,
                        borderRadius: 999,
                        border: "1px solid rgb(250 243 237 / 0.5)",
                        color: "var(--inv-cream)",
                        fontFamily: F.cormorant,
                        fontSize: u(11),
                      }}
                    >
                      {BADGE[w.attendance]}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    color: "rgb(250 243 237 / 0.65)",
                    fontFamily: F.cormorant,
                    fontStyle: "italic",
                    fontSize: u(13),
                  }}
                  suppressHydrationWarning
                >
                  {relative(w.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: `${u(4)} 0 0`,
                  color: "var(--inv-cream)",
                  fontFamily: F.cormorant,
                  fontSize: u(16),
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                  overflowWrap: "anywhere",
                }}
              >
                {w.message}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: u(260),
          pointerEvents: "none",
        }}
      >
        <Placed
          img={[280.36, 260 - 215.04, 202.88, 253.59]}
          clip={[352.72, 260 - 124.54, 87.28, 124.54]}
          reveal="rise"
          parallax="floor"
        >
          <AccentBouquet w={203} />
        </Placed>
      </div>
    </SectionShell>
  );
}
