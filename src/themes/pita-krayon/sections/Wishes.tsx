"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { eventDateLabel, firstEvent } from "@/lib/datetime";
import { LINK_RE, MAX_MESSAGE, MAX_NAME, MAX_PAX } from "@/lib/guestbook/schema";

import { CalendarButton } from "../../_shared/sections";
import { Honeypot, useGuestbook } from "../../_shared/runtime/guestbook";
import { useInvitation, type WishItem } from "../../_shared/runtime/context";
import { Orn, Section, txt, Typewriter, u, useNick } from "../canvas";
import { Ribbon, Sparkle } from "../ornaments";

/**
 * KARTU UCAPAN — form ucapan khusus Pita Krayon (RSVP + ucapan dalam satu
 * kartu), di atas useGuestbook & API yang SAMA dengan tema lain (anti-spam,
 * honeypot, batas kiriman, teks tidak pernah jadi link — semua tetap di server).
 *
 * Alur (nyaman satu tangan):
 *  1. pilih kehadiran (3 ubin besar) → kartu terbuka
 *  2. nama terisi dari ?to= ("Dari: Bu Rina · ubah"), jumlah orang (stepper,
 *     hanya bila hadir), ucapan + chip saran yang bisa diketuk
 *  3. Kirim (tombol lebar di bawah) → kartu berubah jadi catatan terima kasih
 *     yang personal + letupan pita/kilau; ucapan baru meluncur ke atas daftar
 *     dengan label "Ucapanmu".
 * Draf ucapan disimpan di sessionStorage (tidak hilang saat koneksi putus).
 * Teks form, tombol, dan pesan untuk tamu selalu bahasa Indonesia.
 */

type Att = "HADIR" | "TIDAK_HADIR" | "RAGU";
const OPTIONS: { v: Att; label: string; icon: string }[] = [
  { v: "HADIR", label: "Hadir", icon: "🎉" },
  { v: "TIDAK_HADIR", label: "Belum bisa", icon: "🤍" },
  { v: "RAGU", label: "Masih ragu", icon: "🤔" },
];
const BADGE: Record<Att, string> = {
  HADIR: "✓ hadir",
  TIDAK_HADIR: "belum bisa",
  RAGU: "masih ragu",
};
const PAGE = 6;

const keyOf = (w: Pick<WishItem, "name" | "message">) =>
  `${w.name.trim().toLowerCase()}|${w.message.trim().slice(0, 60)}`;
const firstName = (n: string) => n.trim().split(/\s+/).slice(0, 2).join(" ");

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};

/** Penyimpanan kecil yang aman (mode privat/diblokir → diam saja). */
const store = {
  get(k: string, s: Storage | undefined) {
    try {
      return s?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  set(k: string, v: string | null, s: Storage | undefined) {
    try {
      if (v === null) s?.removeItem(k);
      else s?.setItem(k, v);
    } catch {
      /* diabaikan */
    }
  },
};
const ss = () => (typeof window === "undefined" ? undefined : window.sessionStorage);
const ls = () => (typeof window === "undefined" ? undefined : window.localStorage);

/** Letupan pita & kilau setelah kirim (CSS; mati di reduced motion, lebih sedikit di mode ringan). */
function Burst({ lite }: { lite: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: lite ? 6 : 14 }, (_, i) => {
        const a = (i / (lite ? 6 : 14)) * Math.PI * 2 + (i % 2 ? 0.3 : 0);
        const r = 70 + (i % 3) * 28;
        return {
          x: Math.cos(a) * r,
          y: Math.sin(a) * r - 30,
          rot: (i * 47) % 360,
          shape: ["✦", "✧", "♡", "〰"][i % 4],
        };
      }),
    [lite],
  );
  return (
    <div aria-hidden className="pk-burst">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            ["--x" as string]: u(b.x),
            ["--y" as string]: u(b.y),
            ["--r" as string]: `${b.rot}deg`,
            ["--d" as string]: `${(i % 4) * 0.04}s`,
          }}
        >
          {b.shape}
        </span>
      ))}
    </div>
  );
}

function ThankYou({
  name,
  att,
  hasMessage,
  live,
  onAgain,
}: {
  name: string;
  att: Att;
  hasMessage: boolean;
  live: boolean;
  onAgain: () => void;
}) {
  const { inv, lite } = useInvitation();
  const nick = useNick();
  const e = firstEvent(inv.data.events);
  const who = firstName(name);
  const lines =
    att === "HADIR"
      ? [
          `Makasih, ${who}!`,
          `${nick} senang banget kamu bisa datang 🎉`,
          `Sampai ketemu ${eventDateLabel(e)}${e.venueName ? ` di ${e.venueName}` : ""}.`,
        ]
      : att === "TIDAK_HADIR"
        ? [
            `Makasih doanya, ${who} 🤍`,
            hasMessage
              ? `${nick} pasti senang baca ucapanmu.`
              : `Semoga bisa ketemu di lain waktu ya.`,
          ]
        : [`Siap, ${who}!`, `Kabari ${nick} ya kalau sudah pasti — tinggal isi lagi kartu ini.`];
  return (
    <div className="pk-thanks" role="status" aria-live="polite" style={{ position: "relative" }}>
      <Burst lite={lite} />
      <p style={txt(30, 1.15, { color: "var(--inv-red)", weight: 700 })}>{lines[0]}</p>
      {lines.slice(1).map((l, i) => (
        <p key={i} style={{ ...txt(18, 1.4), marginTop: u(i ? 4 : 10) }}>
          {l}
        </p>
      ))}
      {hasMessage && live && (
        <p style={{ ...txt(15, 1.3, { color: "var(--inv-text-muted)" }), marginTop: u(12) }}>
          Ucapanmu sudah tampil di bawah ↓
        </p>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: u(10),
          marginTop: u(20),
        }}
      >
        {att === "HADIR" && <CalendarButton className="pk-btn pk-btn-sm" />}
        <button type="button" onClick={onAgain} className="pk-btn pk-btn-sm pk-btn-ghost">
          {att === "RAGU" ? "Ubah jawaban" : "Kirim ucapan lagi"}
        </button>
      </div>
    </div>
  );
}

export function WishCard() {
  const { inv, guestName } = useInvitation();
  const nick = useNick();
  const { wishes, stats, live, submit } = useGuestbook();
  const draftKey = `pk-draft:${inv.data.events[0]?.id ?? "x"}:${nick}`;
  const mineKey = `pk-mine:${nick}`;

  const [att, setAtt] = useState<Att | null>(null);
  const [name, setName] = useState(guestName ?? "");
  const [editName, setEditName] = useState(!guestName);
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    field?: "name" | "message";
    text: string;
    soft?: boolean;
  } | null>(null);
  const [sent, setSent] = useState<{ name: string; att: Att; hasMessage: boolean } | null>(null);
  const [mine, setMine] = useState<string[]>([]);
  const [shown, setShown] = useState(PAGE);
  const seen = useRef<Set<string> | null>(null);
  const msgRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // pulihkan draf & daftar "ucapanku"
  useEffect(() => {
    const d = store.get(draftKey, ss());
    if (d) setMessage(d);
    try {
      setMine(JSON.parse(store.get(mineKey, ls()) ?? "[]") as string[]);
    } catch {
      /* abaikan */
    }
  }, [draftKey, mineKey]);
  useEffect(() => {
    store.set(draftKey, message.trim() ? message : null, ss());
  }, [draftKey, message]);

  // ucapan yang sudah ada saat pertama dirender tidak dianimasikan
  if (seen.current === null) seen.current = new Set(wishes.map(keyOf));

  // tinggi textarea mengikuti isi
  useEffect(() => {
    const el = msgRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, [message, att]);

  const chips = [
    `🎂 Selamat ulang tahun, ${nick}!`,
    "Sehat & bahagia selalu ✨",
    "Makin sukses ya! 🎉",
    "Sampai ketemu di pesta! 🥳",
  ];

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!att) return;
    const n = name.trim();
    const m = message.trim();
    if (!n) {
      setEditName(true);
      return setError({ field: "name", text: "Nama belum diisi." });
    }
    if (LINK_RE.test(n) || LINK_RE.test(m))
      return setError({
        field: LINK_RE.test(n) ? "name" : "message",
        text: "Ucapan tidak boleh berisi tautan/link.",
      });
    setBusy(true);
    setError(null);
    const r = await submit({
      name: n,
      attendance: att,
      pax: att === "HADIR" ? pax : undefined,
      message: m || undefined,
      website: hp,
    });
    setBusy(false);
    if (!r.ok) return setError({ text: r.error, soft: r.soft });
    if (m) {
      const k = keyOf({ name: n, message: m });
      const next = [k, ...mine.filter((x) => x !== k)].slice(0, 20);
      setMine(next);
      store.set(mineKey, JSON.stringify(next), ls());
    }
    store.set(draftKey, null, ss());
    setSent({ name: n, att, hasMessage: !!m });
    setMessage("");
    // gulir pelan ke ucapan baru (setelah animasi kartu)
    if (m)
      window.setTimeout(
        () =>
          listRef.current?.firstElementChild?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        900,
      );
  };

  const again = () => {
    setSent(null);
    setAtt(null);
    setPax(1);
    setError(null);
  };

  const list = wishes.slice(0, shown);

  return (
    <Section id="ucapan" style={{ padding: `${u(34)} ${u(22)} ${u(50)}` }}>
      <Orn
        slot="ribbon-a"
        l={24}
        t={14}
        w={46}
        ratio={1.02}
        rotate={-12}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-pair"
        l={366}
        t={30}
        w={26}
        ratio={1.22}
        tint={false}
        a="fade"
        d={0.4}
        fallback={<Sparkle />}
      />
      <h2 style={txt(33, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 })}>
        <Typewriter text="Kirim Ucapan" delay={0.1} />
      </h2>
      <p
        data-a="fade"
        style={{
          ...txt(16, 1.3, { color: "var(--inv-text-muted)" }),
          marginTop: u(6),
          ["--d" as string]: "0.5s",
        }}
      >
        {stats.orang > 0 ? `${stats.orang} tamu akan hadir · ` : ""}
        {stats.ucapan} ucapan
      </p>

      {/* ===== Kartu ===== */}
      <div data-a="tilt" style={{ marginTop: u(22), ["--d" as string]: "0.3s" }}>
        <div className="pk-card">
          <span aria-hidden className="pk-tape" />
          {sent ? (
            <ThankYou
              name={sent.name}
              att={sent.att}
              hasMessage={sent.hasMessage}
              live={live}
              onAgain={again}
            />
          ) : (
            <form onSubmit={send} noValidate className="pk-form">
              <p id="pk-att-label" style={txt(19, 1.3, { weight: 700 })}>
                Kamu bisa datang ke pesta {nick}?
              </p>
              <div role="radiogroup" aria-labelledby="pk-att-label" className="pk-tiles">
                {OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={att === o.v}
                    onClick={() => {
                      setAtt(o.v);
                      setError(null);
                    }}
                    className={`pk-tile ${att === o.v ? "is-on" : ""}`}
                  >
                    <span aria-hidden style={{ fontSize: u(26), lineHeight: 1 }}>
                      {o.icon}
                    </span>
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>

              {att && (
                <div className="pk-step2">
                  {/* nama */}
                  {!editName ? (
                    <p style={{ ...txt(18, 1.3, { align: "left" }), marginTop: u(18) }}>
                      Dari: <strong>{name}</strong>{" "}
                      <button type="button" className="pk-link" onClick={() => setEditName(true)}>
                        ✎ ubah
                      </button>
                    </p>
                  ) : (
                    <label className="pk-field">
                      <span>Nama kamu</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={MAX_NAME}
                        autoComplete="name"
                        enterKeyHint="next"
                        aria-invalid={error?.field === "name"}
                        aria-describedby={error?.field === "name" ? "pk-err" : undefined}
                        placeholder="mis. Tante Rina"
                      />
                    </label>
                  )}

                  {/* jumlah orang (hanya bila hadir) */}
                  {att === "HADIR" && (
                    <div className="pk-field" style={{ marginTop: u(14) }}>
                      <span id="pk-pax-label">Datang berapa orang?</span>
                      <div className="pk-stepper" role="group" aria-labelledby="pk-pax-label">
                        <button
                          type="button"
                          aria-label="Kurangi"
                          onClick={() => setPax((p) => Math.max(1, p - 1))}
                          disabled={pax <= 1}
                        >
                          −
                        </button>
                        <output aria-live="polite">{pax} orang</output>
                        <button
                          type="button"
                          aria-label="Tambah"
                          onClick={() => setPax((p) => Math.min(MAX_PAX, p + 1))}
                          disabled={pax >= MAX_PAX}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ucapan */}
                  <label className="pk-field" style={{ marginTop: u(14) }}>
                    <span>
                      Ucapan untuk {nick}{" "}
                      <em style={{ opacity: 0.6, fontStyle: "normal" }}>(boleh kosong)</em>
                    </span>
                    <textarea
                      ref={msgRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={MAX_MESSAGE}
                      rows={3}
                      aria-invalid={error?.field === "message"}
                      aria-describedby={error?.field === "message" ? "pk-err" : undefined}
                      placeholder="Tulis doa & harapan terbaikmu…"
                    />
                  </label>
                  <div className="pk-chips" aria-label="Saran ucapan">
                    {chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setMessage((m) =>
                            (m.trim() ? `${m.trimEnd()} ${c}` : c).slice(0, MAX_MESSAGE),
                          );
                          msgRef.current?.focus();
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p
                    style={{
                      ...txt(13, 1, { color: "var(--inv-text-muted)", align: "right" }),
                      marginTop: u(6),
                    }}
                  >
                    {message.length}/{MAX_MESSAGE}
                  </p>

                  <Honeypot value={hp} onChange={setHp} />
                  {error && (
                    <p
                      id="pk-err"
                      role={error.soft ? "status" : "alert"}
                      className={error.soft ? "pk-note-soft" : "pk-err"}
                      key={error.text}
                    >
                      {error.text}
                    </p>
                  )}
                  <button type="submit" className="pk-btn pk-send" disabled={busy}>
                    {busy
                      ? "Mengirim…"
                      : error && !error.field && !error.soft
                        ? "Coba lagi ✈︎"
                        : "Kirim ✈︎"}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* ===== Daftar ucapan ===== */}
      {wishes.length > 0 && (
        <>
          <ul ref={listRef} className="pk-wishes" aria-label="Ucapan tamu">
            {list.map((w, i) => {
              const k = keyOf(w);
              const isMine = mine.includes(k);
              const isNew = !seen.current?.has(k);
              return (
                <li
                  key={w.id ?? `${k}|${w.createdAt}`}
                  className={`pk-wish ${isNew ? "is-new" : ""} ${isMine ? "is-mine" : ""}`}
                  style={{ ["--tilt" as string]: `${i % 2 ? 1.1 : -1.1}deg` }}
                >
                  {isMine && <span className="pk-mine">Ucapanmu</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: u(10) }}>
                    <span aria-hidden className="pk-avatar">
                      {w.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          ...txt(18, 1.2, { weight: 700, align: "left" }),
                          overflowWrap: "anywhere",
                        }}
                      >
                        {w.name}
                      </p>
                      <p
                        style={txt(12.5, 1.2, { color: "var(--inv-text-muted)", align: "left" })}
                        suppressHydrationWarning
                      >
                        {w.attendance ? `${BADGE[w.attendance]} · ` : ""}
                        {timeAgo(w.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      ...txt(16.5, 1.4, { align: "left" }),
                      marginTop: u(8),
                      whiteSpace: "pre-line",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {w.message}
                  </p>
                </li>
              );
            })}
          </ul>
          {wishes.length > shown && (
            <div style={{ textAlign: "center", marginTop: u(18) }}>
              <button
                type="button"
                className="pk-btn pk-btn-sm pk-btn-ghost"
                onClick={() => setShown((s) => s + PAGE)}
              >
                Lihat lebih banyak ({wishes.length - shown})
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
