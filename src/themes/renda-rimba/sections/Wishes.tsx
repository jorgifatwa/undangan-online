"use client";

import { useMemo, useState } from "react";

import { eventDateLabel, firstEvent } from "@/lib/datetime";

import { Lily } from "../../_shared/ornaments";
import { couple, shortName } from "../../_shared/format";
import { useInvitation, type WishItem } from "../../_shared/runtime/context";
import { F, Fleuron, Pic, Section, txt, u } from "../canvas";
import { useLaceBorder } from "./Couple";

/**
 * Konfirmasi Kehadiran (desain 430 × 760): judul, kartu renda tipis hampir
 * selebar layar berisi nama pasangan, tanggal, pilihan Hadir/Tidak Hadir,
 * ucapan, dan "Dinding Tamu". RSVP & ucapan menyatu seperti desain asli.
 * TAHAP 2: kiriman disimpan di state lokal; sambungan ke DB di tahap berikutnya.
 */
type Attendance = "HADIR" | "TIDAK_HADIR";
const MAX_MSG = 300;
const INK = "var(--inv-ink-dark)";
const MAROON = "var(--inv-maroon)";

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

const field: React.CSSProperties = {
  boxSizing: "border-box",
  padding: `${u(9)} ${u(12)}`,
  borderRadius: u(8),
  fontFamily: F.body,
  fontSize: `max(16px, ${u(13)})`,
};

function Choice({
  value,
  current,
  onPick,
  children,
}: {
  value: Attendance;
  current: string;
  onPick: (v: Attendance) => void;
  children: React.ReactNode;
}) {
  const on = current === value;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onPick(value)}
      style={{
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: u(6),
        padding: `${u(10)} ${u(6)}`,
        borderRadius: 99,
        border: `1.5px solid ${MAROON}`,
        background: on ? MAROON : "transparent",
        cursor: "pointer",
        ...txt(F.body, 13.5, 1, { weight: 600, color: on ? "#fff" : MAROON }),
      }}
    >
      {children}
    </button>
  );
}

export function RendaWishes() {
  const { inv, wishes: initial, guestName, showToast } = useInvitation();
  const lace = useLaceBorder(30);
  const [local, setLocal] = useState<WishItem[]>([]);
  const [name, setName] = useState(guestName ?? "");
  const [attendance, setAttendance] = useState<Attendance | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const wishes = useMemo(() => [...local, ...initial], [local, initial]);
  if (inv.eventType !== "WEDDING") return null;
  const [a, b] = couple(inv.data);
  const present = wishes.filter((w) => w.attendance === "HADIR").length;
  const absent = wishes.filter((w) => w.attendance === "TIDAK_HADIR").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama belum diisi.");
    if (!attendance) return setError("Pilih Hadir atau Tidak Hadir.");
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
    showToast("Terima kasih atas konfirmasi & doanya!");
  };

  return (
    <Section id="ucapan" minHeight={760} z={1} threshold={0.12} style={{ paddingBottom: u(34) }}>
      <h2
        data-a="up"
        style={{ ...txt(F.script, 36, 1.2), paddingTop: u(34), whiteSpace: "nowrap" }}
      >
        Konfirmasi Kehadiran
      </h2>
      <p
        data-a="up"
        style={{
          ...txt(F.body, 12, 1.5, { italic: true, color: "rgb(246 239 228 / .85)" }),
          margin: `${u(8)} ${u(30)} 0`,
          ["--d" as string]: "0.1s",
        }}
      >
        Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami
      </p>

      <Pic
        slot="lily"
        l={330}
        t={92}
        w={100}
        ratio={737 / 799}
        rotate={18}
        a="bloom"
        d={0.5}
        sway="stand"
        z={5}
        fallback={<Lily slot={false} className="h-full w-full" />}
      />

      <div
        data-a="zoom"
        style={{
          position: "relative",
          margin: `${u(18)} ${u(26)} 0`,
          minHeight: u(596),
          boxSizing: "border-box",
          filter: "drop-shadow(0 8px 18px rgb(0 0 0 / .45))",
          ["--d" as string]: "0.2s",
          ...lace,
        }}
      >
        <div style={{ padding: `${u(16)} ${u(16)} ${u(10)}`, textAlign: "center", color: INK }}>
          <p style={{ ...txt(F.script, 36, 1.15, { color: INK }), whiteSpace: "nowrap" }}>
            {shortName(a)} &amp; {shortName(b)}
          </p>
          <p style={{ ...txt(F.body, 12.5, 1.3, { color: "#7a6450" }), marginTop: u(2) }}>
            {eventDateLabel(firstEvent(inv.data.events))}
          </p>
          <Fleuron color={MAROON} line="rgb(122 100 80 / .55)" width={80} dotted margin={8} />

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: u(10) }}>
            <p style={txt(F.body, 12, 1.4, { color: "#7a6450" })}>
              Mohon konfirmasi kehadiran Anda
            </p>
            <label className="sr-only" htmlFor="rr-name">
              Nama
            </label>
            <input
              id="rr-name"
              className="rr-field"
              style={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              maxLength={80}
              autoComplete="name"
            />
            <div
              style={{ display: "flex", gap: u(10) }}
              role="group"
              aria-label="Konfirmasi kehadiran"
            >
              <Choice value="HADIR" current={attendance} onPick={setAttendance}>
                <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(14), height: u(14) }}>
                  <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                </svg>
                Hadir
              </Choice>
              <Choice value="TIDAK_HADIR" current={attendance} onPick={setAttendance}>
                <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(14), height: u(14) }}>
                  <path
                    fill="currentColor"
                    d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z"
                  />
                </svg>
                Tidak Hadir
              </Choice>
            </div>
            <label className="sr-only" htmlFor="rr-msg">
              Ucapan & doa
            </label>
            <textarea
              id="rr-msg"
              className="rr-field"
              style={{ ...field, minHeight: u(74), resize: "vertical" }}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
              placeholder="Tulis ucapan & doa (opsional)"
            />
            {error && (
              <p role="alert" style={txt(F.body, 12, 1.3, { color: MAROON })}>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                padding: `${u(10)} 0`,
                borderRadius: 99,
                border: 0,
                background: MAROON,
                cursor: "pointer",
                ...txt(F.body, 13.5, 1, { weight: 600, color: "#fff", ls: 0.3 }),
              }}
            >
              Kirim
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: u(10), marginTop: u(18) }}>
            <span style={{ flex: 1, borderTop: "1px dashed rgb(74 59 46 / .45)" }} />
            <h3 style={txt(F.serif, 19, 1.2, { weight: 500, color: INK })}>Dinding Tamu</h3>
            <span style={{ flex: 1, borderTop: "1px dashed rgb(74 59 46 / .45)" }} />
          </div>
          <p style={{ ...txt(F.body, 10, 1.3, { color: "#7a6450" }), margin: `${u(2)} 0 ${u(6)}` }}>
            {wishes.length} Ucapan · {present} Hadir · {absent} Tidak Hadir
          </p>
          {wishes.length === 0 ? (
            <p
              style={{
                ...txt(F.body, 12.5, 1.4, { italic: true, color: "#7a6450" }),
                marginTop: u(18),
              }}
            >
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: u(260),
                overflowY: "auto",
                textAlign: "left",
                overscrollBehavior: "contain",
              }}
            >
              {wishes.map((w, i) => (
                <li
                  key={w.createdAt + i}
                  style={{
                    padding: `${u(8)} 0`,
                    borderTop: i ? "1px dotted rgb(74 59 46 / .3)" : undefined,
                  }}
                >
                  <b
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: u(6),
                      ...txt(F.body, 12.5, 1.3, { weight: 600, color: INK, align: "left" }),
                    }}
                  >
                    {w.name}
                    {w.attendance && w.attendance !== "RAGU" && (
                      <em
                        style={{
                          fontStyle: "normal",
                          padding: `${u(1)} ${u(7)}`,
                          borderRadius: 99,
                          fontSize: u(9),
                          fontWeight: 400,
                          background:
                            w.attendance === "HADIR"
                              ? "rgb(62 99 64 / .15)"
                              : "rgb(139 26 43 / .12)",
                          color: w.attendance === "HADIR" ? "#2f5a33" : MAROON,
                        }}
                      >
                        {w.attendance === "HADIR" ? "Hadir" : "Tidak Hadir"}
                      </em>
                    )}
                  </b>
                  {w.message && (
                    <p
                      style={{
                        ...txt(F.body, 12.5, 1.45, { color: "var(--inv-ink)", align: "left" }),
                        marginTop: u(3),
                        overflowWrap: "anywhere",
                      }}
                    >
                      {w.message}
                    </p>
                  )}
                  <time
                    dateTime={w.createdAt}
                    style={{
                      display: "block",
                      marginTop: u(2),
                      ...txt(F.body, 9.5, 1.2, { color: "#9a8670", align: "left" }),
                    }}
                  >
                    {relative(w.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}
