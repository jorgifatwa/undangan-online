"use client";

import { useId, useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import { Honeypot, useGuestbook } from "../../_shared/runtime/guestbook";
import { smoke } from "../art/FloralColumn";
import { FlowerDefs, GreenOrchid, PinkLily } from "../art/Flowers";
import { F, Section, txt, u } from "../canvas";

/**
 * Ucapkan Sesuatu (section `ucapan`, RSVP menyatu seperti desain): latar
 * sage berkabut, lili pink besar di kanan atas, pita renda vertikal di tepi
 * kanan, anggrek hijau di kiri bawah. Form "You're Invited": nama, pilihan
 * hadir (dua kotak), ucapan & doa, tombol putih "RSVP". Di bawahnya dinding
 * ucapan tamu.
 */
type Attendance = "HADIR" | "TIDAK_HADIR";
const MAX_MSG = 300;
const CREAM = "var(--inv-cream)";

const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
/** Pita renda vertikal: tepi kiri scallop + bunga kecil berlubang, ubin 42 × 40. */
const LACE_STRIP = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="40"><path d="M8 0 C0 5 0 15 8 20 C0 25 0 35 8 40 H42 V0Z" fill="#f4f2ec"/><g fill="none" stroke="#c9c6bd" stroke-width="1"><circle cx="24" cy="10" r="5"/><circle cx="24" cy="30" r="5"/><path d="M12 20 C18 16 30 16 36 20 C30 24 18 24 12 20Z"/></g><g fill="#d6d3ca"><circle cx="24" cy="10" r="1.6"/><circle cx="24" cy="30" r="1.6"/><circle cx="6" cy="10" r="1.2"/><circle cx="6" cy="30" r="1.2"/><circle cx="37" cy="4" r="1"/><circle cx="37" cy="36" r="1"/></g></svg>`,
);

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
  ...txt(F.serif, 13.5, 1.3, { color: CREAM, align: "left" }),
  display: "block",
  marginTop: u(22),
  marginBottom: u(8),
};
const field: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: `${u(7)} ${u(10)}`,
  borderRadius: u(8),
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
        padding: `${u(8)} ${u(10)}`,
        borderRadius: u(6),
        border: on ? "1.5px solid rgb(242 236 220 / 0.8)" : "1.5px solid transparent",
        background: on ? "rgb(255 255 255 / 0.24)" : "rgb(255 255 255 / 0.12)",
        cursor: "pointer",
        ...txt(F.serif, 13.5, 1.3, { color: CREAM, align: "left" }),
      }}
    >
      {children}
    </button>
  );
}

export function LiliWishes() {
  const { inv, guestName, showToast } = useInvitation();
  const id = useId().replace(/:/g, "");
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
        aria-hidden
        style={{
          position: "absolute",
          right: 0,
          top: u(150),
          bottom: 0,
          width: u(42),
          backgroundImage: LACE_STRIP,
          backgroundSize: `${u(42)} ${u(40)}`,
          filter: "drop-shadow(-1px 0 1.5px rgb(0 0 0 / 0.2))",
        }}
      />
      {/* lili besar kanan atas & anggrek kiri bawah */}
      <svg
        aria-hidden
        viewBox="0 0 170 170"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: u(170),
          height: u(170),
          overflow: "visible",
        }}
      >
        <defs>
          <FlowerDefs id={id} />
        </defs>
        <PinkLily id={id} x={158} y={62} s={2.1} rot={-28} />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 140 120"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: u(140),
          height: u(120),
          overflow: "visible",
        }}
      >
        <defs>
          <FlowerDefs id={`${id}b`} />
        </defs>
        <GreenOrchid id={`${id}b`} x={30} y={110} s={1.2} rot={18} />
      </svg>

      <div style={{ position: "relative", padding: `${u(108)} ${u(48)} ${u(110)} ${u(56)}` }}>
        <h2
          data-a
          style={{
            ...txt(F.serif, 31, 1.25, { italic: true, weight: 700, color: CREAM }),
            marginLeft: u(-12),
          }}
        >
          Ucapkan Sesuatu
        </h2>

        <form onSubmit={submit} data-a style={{ marginTop: u(34), ["--d" as string]: "0.15s" }}>
          <p style={txt(F.serif, 30, 1.2, { color: CREAM, align: "left" })}>You&rsquo;re Invited</p>
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
            style={{ ...field, minHeight: u(34), resize: "vertical" }}
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
              padding: `${u(10)} 0`,
              borderRadius: 999,
              border: 0,
              background: "#fffdf8",
              cursor: "pointer",
              ...txt(F.serif, 14, 1, { weight: 600, color: "var(--inv-sage-dark)", ls: 1 }),
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
