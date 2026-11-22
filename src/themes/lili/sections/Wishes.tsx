"use client";

import Image from "next/image";
import { useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import { Honeypot, useGuestbook } from "../../_shared/runtime/guestbook";
import { smoke } from "../art/FloralColumn";
import orchid from "../art/orchid.webp";
import wishesLily from "../art/wishes-lily.webp";
import laceStrip from "../art/lace-strip.webp";
import { F, Section, txt, u } from "../canvas";

/**
 * Ucapkan Sesuatu (section `ucapan`, RSVP menyatu seperti desain): latar
 * sage berkabut, rangkaian lili (gambar milik pemilik) di kanan atas, pita renda vertikal di tepi
 * kanan, anggrek hijau di kiri bawah. Form "You're Invited": nama, pilihan
 * hadir (dua kotak), ucapan & doa, tombol putih "RSVP". Di bawahnya dinding
 * ucapan tamu.
 */
type Attendance = "HADIR" | "TIDAK_HADIR";
const MAX_MSG = 300;
/** Lebar rangkaian lili kanan atas (px kanvas). */
const LILY_W = 130;
const CREAM = "var(--inv-cream)";

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

const label: React.CSSProperties = {
  ...txt(F.serif, 12, 1.3, { color: CREAM, align: "left" }),
  display: "block",
  marginTop: u(26),
  marginBottom: u(8),
};
const field: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  height: u(32),
  padding: `0 ${u(10)}`,
  borderRadius: u(6),
  border: "1.5px solid rgb(242 236 220 / 0.75)",
  background: "transparent",
  color: CREAM,
  fontFamily: F.serif,
  fontSize: `max(16px, ${u(13)})`,
  outline: "none",
};

function Option({
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
        display: "block",
        width: "100%",
        marginTop: u(7),
        height: u(32),
        padding: `0 ${u(8)}`,
        borderRadius: u(5),
        border: on ? "1.5px solid rgb(242 236 220 / 0.8)" : "1.5px solid transparent",
        background: on ? "rgb(255 255 255 / 0.24)" : "rgb(255 255 255 / 0.12)",
        cursor: "pointer",
        ...txt(F.serif, 12, 1.3, { color: CREAM, align: "left" }),
      }}
    >
      {children}
    </button>
  );
}

export function LiliWishes() {
  const { inv, guestName, showToast } = useInvitation();
  const guestbook = useGuestbook();
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(guestName ?? "");
  const [attendance, setAttendance] = useState<Attendance | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [soft, setSoft] = useState(false);
  const { wishes, stats } = guestbook;
  if (inv.eventType !== "WEDDING") return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama belum diisi.");
    if (!attendance) return setError("Pilih salah satu: hadir atau tidak hadir.");
    setBusy(true);
    const r = await guestbook.submit({
      name,
      attendance: attendance || undefined,
      message: message.trim() || undefined,
      website: hp,
    });
    setBusy(false);
    setSoft(!r.ok && !!r.soft);
    if (!r.ok) return setError(r.error);
    setError(null);
    setMessage("");
    showToast("Terima kasih atas konfirmasi & doanya!");
  };

  return (
    <Section
      id="ucapan"
      threshold={0.1}
      overflow="hidden"
      bg={{
        background: `${smoke([
          { x: 8, y: 14, w: 40, h: 22, a: 0.24 },
          { x: 12, y: 88, w: 46, h: 14, a: 0.2 },
          { x: 45, y: 96, w: 40, h: 10, a: 0.14 },
        ])}, var(--inv-sage)`,
      }}
    >
      {/* pita renda vertikal di tepi kanan */}
      <div
        data-a="unroll"
        aria-hidden
        style={{
          position: "absolute",
          right: u(-6),
          top: u(96), // mulai di balik rangkaian lili (tanpa celah)
          bottom: 0,
          width: u(52),
          // foto renda lurus milik pemilik, ubin mulus (art/lace-strip.webp)
          backgroundImage: `url(${laceStrip.src})`,
          backgroundSize: `${u(52)} ${u((52 * laceStrip.height) / laceStrip.width)}`,
          backgroundRepeat: "repeat-y",
          filter: "drop-shadow(-1px 0 1.5px rgb(0 0 0 / 0.25))",
          ["--d" as string]: "0.4s",
        }}
      />
      {/* rangkaian lili kanan atas (gambar milik pemilik, dicerminkan ke kiri),
          menumpang ujung atas pita renda */}
      <div
        aria-hidden
        data-a="hang"
        data-sway="corner"
        style={{
          transformOrigin: "100% 0",
          ["--amp" as string]: "2deg",
          ["--sdur" as string]: "5.2s",
          position: "absolute",
          right: u(-20),
          top: u(-4),
          width: u(LILY_W),
          height: u((LILY_W * wishesLily.height) / wishesLily.width),
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <Image src={wishesLily} alt="" fill sizes="(max-width: 440px) 40vw, 180px" />
      </div>
      {/* anggrek hijau kiri bawah (gambar milik pemilik), menyerong & terpotong
          tepi kiri-bawah seperti desain */}
      <div
        aria-hidden
        data-sway="corner"
        style={{
          position: "absolute",
          left: u(-30),
          bottom: u(-26),
          width: u(140),
          height: u((140 * orchid.height) / orchid.width),
          transformOrigin: "0 100%",
          ["--amp" as string]: "2.2deg",
          ["--sdur" as string]: "4.6s",
          ["--sdly" as string]: "-1.5s",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: "rotate(32deg)" }}>
          <Image src={orchid} alt="" fill sizes="(max-width: 440px) 42vw, 190px" />
        </div>
      </div>

      <div style={{ position: "relative", padding: `${u(116)} ${u(66)} ${u(110)} ${u(40)}` }}>
        {/* kolom isi 40–364: tidak bertabrakan dengan pita renda (±384) */}
        <h2
          data-a="write"
          style={{
            ...txt(F.serif, 25, 1.25, { italic: true, weight: 700, color: CREAM }),
            // judul ditengahkan pada area kiri renda (0–384)
            marginLeft: u(-40 + 6),
          }}
        >
          Ucapkan Sesuatu
        </h2>

        <form onSubmit={submit} data-a style={{ marginTop: u(48), ["--d" as string]: "0.7s" }}>
          <p style={txt(F.serif, 24, 1.2, { color: CREAM, align: "left" })}>You&rsquo;re Invited</p>
          <label htmlFor="li-name" style={label}>
            Your name
          </label>
          <input
            id="li-name"
            style={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
          <p style={{ ...label, marginBottom: u(2) }} id="li-att">
            Will you be attending our wedding?
          </p>
          <div role="group" aria-labelledby="li-att">
            <Option value="HADIR" current={attendance} onPick={setAttendance}>
              Joyfully accepts
            </Option>
            <Option value="TIDAK_HADIR" current={attendance} onPick={setAttendance}>
              Regretfully declines
            </Option>
          </div>
          <label htmlFor="li-msg" style={label}>
            Berikan Ucapan &amp; Doa
          </label>
          <textarea
            id="li-msg"
            style={{ ...field, height: u(32), padding: `${u(6)} ${u(10)}`, resize: "none" }}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
          />
          {error && (
            <p
              role={soft ? "status" : "alert"}
              style={{
                ...txt(F.serif, 12.5, 1.4, { color: "#fde3e3", align: "left" }),
                marginTop: u(8),
              }}
            >
              {error}
            </p>
          )}
          <Honeypot value={hp} onChange={setHp} />
          <button
            type="submit"
            disabled={busy}
            style={{
              display: "block",
              width: "100%",
              marginTop: u(12),
              height: u(36),
              borderRadius: u(12),
              border: 0,
              background: "#fffdf8",
              cursor: "pointer",
              ...txt(F.serif, 13, 1, { weight: 600, color: "var(--inv-sage-dark)", ls: 1 }),
            }}
          >
            {busy ? "Mengirim…" : "RSVP"}
          </button>
        </form>

        {/* dinding ucapan */}
        <div data-a style={{ marginTop: u(34), ["--d" as string]: "0.25s" }}>
          <p style={txt(F.serif, 20, 1.3, { italic: true, weight: 700, color: CREAM })}>
            Ucapan &amp; Doa
          </p>
          <p
            style={{
              ...txt(F.serif, 11, 1.4, { color: "rgb(242 236 220 / 0.8)" }),
              marginTop: u(2),
            }}
          >
            {stats.ucapan} Ucapan · {stats.hadir} Hadir · {stats.tidakHadir} Tidak Hadir
          </p>
          {wishes.length === 0 ? (
            <p
              style={{
                ...txt(F.serif, 12.5, 1.4, { italic: true, color: "rgb(242 236 220 / 0.85)" }),
                marginTop: u(14),
              }}
            >
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: `${u(10)} 0 0`,
                padding: 0,
                maxHeight: u(300),
                overflowY: "auto",
                overscrollBehavior: "contain",
                pointerEvents: "auto",
              }}
            >
              {wishes.map((w, i) => (
                <li
                  key={w.id ?? w.createdAt + i}
                  style={{
                    marginTop: i ? u(8) : 0,
                    padding: `${u(9)} ${u(11)}`,
                    borderRadius: u(8),
                    background: "rgb(255 255 255 / 0.1)",
                  }}
                >
                  <b
                    style={{
                      ...txt(F.serif, 13, 1.3, { weight: 600, color: CREAM, align: "left" }),
                      display: "block",
                    }}
                  >
                    {w.name}
                    {w.attendance && w.attendance !== "RAGU" && (
                      <span style={{ fontWeight: 400, fontStyle: "italic", opacity: 0.8 }}>
                        {" "}
                        · {w.attendance === "HADIR" ? "Hadir" : "Tidak Hadir"}
                      </span>
                    )}
                  </b>
                  {w.message && (
                    <p
                      style={{
                        ...txt(F.serif, 12.5, 1.45, { color: CREAM, align: "left" }),
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
                      marginTop: u(3),
                      ...txt(F.serif, 10, 1.2, { color: "rgb(242 236 220 / 0.65)", align: "left" }),
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
