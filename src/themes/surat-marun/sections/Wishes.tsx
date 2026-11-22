"use client";

import Image from "next/image";
import { useState } from "react";

import { useInvitation } from "../../_shared/runtime/context";
import { Honeypot, useGuestbook } from "../../_shared/runtime/guestbook";
import { F, Section, txt, u } from "../canvas";

/**
 * Share your Blessing (ucapan + RSVP menyatu): latar foto hitam-putih, kartu
 * marun judul skrip, ajakan krem keemasan, form (nama, pilihan hadir 3
 * opsi, ucapan), rekap kehadiran, lalu daftar ucapan kartu putih transparan.
 */
type Att = "HADIR" | "RAGU" | "TIDAK_HADIR";
const OPTIONS: [Att, string][] = [
  ["HADIR", "I'm planning to attend"],
  ["RAGU", "I'm not sure"],
  ["TIDAK_HADIR", "Sorry, I can't attend"],
];
const LABEL: Record<Att, string> = {
  HADIR: "I'm planning to attend",
  RAGU: "I'm not sure",
  TIDAK_HADIR: "Sorry, I can't attend",
};
const MAX = 300;

const field: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: `${u(6)} ${u(12)}`,
  borderRadius: 999,
  border: 0,
  background: "#fff",
  color: "#333",
  fontFamily: F.sans,
  fontSize: `max(16px, ${u(11)})`,
  outline: "none",
};
const label: React.CSSProperties = {
  ...txt(F.sans, 10.5, 1.2, { color: "#333", weight: 700, align: "left" }),
  display: "block",
  marginTop: u(10),
  marginBottom: u(4),
};

export function SuratMarunWishes() {
  const { inv, guestName, showToast } = useInvitation();
  const gb = useGuestbook();
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(guestName ?? "");
  const [att, setAtt] = useState<Att>("HADIR");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [shown, setShown] = useState(5);
  if (inv.eventType !== "WEDDING") return null;
  const bg = inv.data.photos.strip[1] ?? inv.data.photos.cover;
  const { wishes, stats } = gb;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Nama belum diisi.");
    setBusy(true);
    const r = await gb.submit({
      name,
      attendance: att,
      message: msg.trim() || undefined,
      website: hp,
    });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setErr(null);
    setMsg("");
    showToast("Terima kasih atas konfirmasi & doanya!");
  };

  return (
    <Section id="ucapan" bg="#1f1d1c" style={{ overflow: "hidden" }}>
      {bg && (
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, filter: "grayscale(1)", opacity: 0.55 }}
        >
          <Image src={bg.url} alt="" fill sizes="440px" style={{ objectFit: "cover" }} />
        </div>
      )}
      <div style={{ position: "relative", padding: `${u(26)} ${u(10)} ${u(50)}` }}>
        <div
          data-a
          style={{
            background: "var(--inv-maroon)",
            borderRadius: u(4),
            padding: `${u(20)} 0`,
            boxShadow: "0 4px 12px rgb(0 0 0 / 0.35)",
          }}
        >
          <p style={txt(F.script, 30, 1.2, { color: "#f1e6e1" })}>
            Share your{" "}
            <span
              style={{
                display: "inline-block",
                width: u(34),
                borderTop: "1px dotted #f1e6e1",
                verticalAlign: "middle",
              }}
            />{" "}
            Blessing
          </p>
        </div>
        <p
          data-a
          style={{
            ...txt(F.sans, 10.5, 1.55, { color: "#f2d48a" }),
            marginTop: u(18),
            ["--d" as string]: "0.1s",
          }}
        >
          We are overjoyed to celebrate with you!
          <br />
          Kindly fill the RSVP and write your wishes for us.
        </p>

        <form
          onSubmit={submit}
          data-a
          style={{
            margin: `${u(18)} ${u(10)} 0`,
            padding: u(16),
            borderRadius: u(10),
            background: "rgb(255 255 255 / 0.78)",
            ["--d" as string]: "0.2s",
          }}
        >
          <label htmlFor="sm-name" style={{ ...label, marginTop: 0 }}>
            Name
          </label>
          <input
            id="sm-name"
            style={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Name"
            autoComplete="name"
          />
          <label htmlFor="sm-att" style={label}>
            Attendance
          </label>
          <select
            id="sm-att"
            style={field}
            value={att}
            onChange={(e) => setAtt(e.target.value as Att)}
          >
            {OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <label htmlFor="sm-msg" style={label}>
            Message
          </label>
          <textarea
            id="sm-msg"
            style={{ ...field, borderRadius: u(10), minHeight: u(64), resize: "vertical" }}
            value={msg}
            onChange={(e) => setMsg(e.target.value.slice(0, MAX))}
            placeholder="Message"
          />
          {err && (
            <p
              role="alert"
              style={{
                ...txt(F.sans, 10, 1.4, { color: "#9b1c1c", align: "left" }),
                marginTop: u(6),
              }}
            >
              {err}
            </p>
          )}
          <Honeypot value={hp} onChange={setHp} />
          <div style={{ textAlign: "right", marginTop: u(10) }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: `${u(5)} ${u(16)}`,
                borderRadius: 999,
                background: "var(--inv-bottle)",
                ...txt(F.sans, 10.5, 1, { color: "#fff", weight: 700 }),
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              {busy ? "Sending…" : "Send ›"}
            </button>
          </div>
        </form>

        {/* rekap kehadiran */}
        <div data-a style={{ marginTop: u(22), textAlign: "center", ["--d" as string]: "0.1s" }}>
          <span
            style={{
              display: "inline-block",
              padding: `${u(4)} ${u(26)}`,
              borderRadius: 999,
              background: "var(--inv-bottle)",
              ...txt(F.sans, 11, 1, { color: "#fff", weight: 700 }),
            }}
          >
            Attendance
          </span>
          {(
            [
              [stats.ragu ?? 0, "Not sure"],
              [stats.hadir, "Planning to attend"],
              [stats.tidakHadir, "Can't attend"],
            ] as const
          ).map(([v, l]) => (
            <div key={l} style={{ marginTop: u(10) }}>
              <p style={txt(F.sans, 17, 1.1, { color: "#f4efe6", weight: 700 })}>{v}</p>
              <p style={txt(F.sans, 7.5, 1.2, { color: "rgb(244 239 230 / 0.75)" })}>{l}</p>
            </div>
          ))}
        </div>

        {/* daftar ucapan */}
        <div data-a style={{ margin: `${u(18)} ${u(10)} 0`, ["--d" as string]: "0.2s" }}>
          {wishes.slice(0, shown).map((w, i) => (
            <div
              key={w.id ?? w.createdAt + i}
              style={{
                marginTop: i ? u(8) : 0,
                padding: `${u(10)} ${u(12)}`,
                borderRadius: u(8),
                background: "rgb(255 255 255 / 0.85)",
                border: "1px dashed rgb(0 0 0 / 0.15)",
              }}
            >
              <p style={txt(F.sans, 11, 1.3, { color: "#333", weight: 700, align: "left" })}>
                {w.name}
              </p>
              {w.attendance && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: u(3),
                    padding: `${u(1)} ${u(6)}`,
                    border: "1px solid #999",
                    borderRadius: 999,
                    ...txt(F.sans, 7.5, 1.2, { color: "#555" }),
                  }}
                >
                  {LABEL[w.attendance as Att] ?? w.attendance}
                </span>
              )}
              <p
                style={{
                  ...txt(F.sans, 7.5, 1.2, { color: "#888", align: "left" }),
                  marginTop: u(3),
                }}
              >
                {new Date(w.createdAt).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              {w.message && (
                <p
                  style={{
                    ...txt(F.sans, 10.5, 1.5, { color: "#333", align: "left" }),
                    marginTop: u(6),
                    overflowWrap: "anywhere",
                  }}
                >
                  {w.message}
                </p>
              )}
            </div>
          ))}
          {wishes.length === 0 && (
            <p style={txt(F.sans, 10.5, 1.4, { color: "#f4efe6" })}>
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          )}
          {wishes.length > shown && (
            <div style={{ textAlign: "center", marginTop: u(14) }}>
              <button
                type="button"
                onClick={() => setShown((s) => s + 5)}
                style={{
                  padding: `${u(5)} ${u(20)}`,
                  borderRadius: 999,
                  border: "1.5px solid var(--inv-bottle)",
                  background: "rgb(255 255 255 / 0.85)",
                  ...txt(F.sans, 10.5, 1, { color: "var(--inv-bottle)" }),
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
              >
                ⟳ Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
