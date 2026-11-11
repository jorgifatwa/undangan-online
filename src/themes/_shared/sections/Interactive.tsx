"use client";

import { useMemo, useState } from "react";

import { Reveal } from "../motion/Reveal";
import { useInvitation, type WishItem } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import { SectionTitle } from "./ui";

/*
 * TAHAP 2: RSVP & Ucapan baru berupa tampilan. Kiriman disimpan di state lokal
 * (hilang saat reload); sambungan ke tabel Rsvp/Wish dibuat di tahap berikutnya.
 */

const ATTENDANCE = [
  { value: "HADIR", label: "Hadir" },
  { value: "TIDAK_HADIR", label: "Tidak Hadir" },
  { value: "RAGU", label: "Masih Ragu" },
] as const;
type Attendance = (typeof ATTENDANCE)[number]["value"];

export const ATTENDANCE_LABEL: Record<Attendance, string> = {
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
  RAGU: "Ragu",
};

export function DefaultRsvp() {
  const { guestName, showToast } = useInvitation();
  const [name, setName] = useState(guestName ?? "");
  const [status, setStatus] = useState<Attendance>("HADIR");
  const [pax, setPax] = useState(1);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSent(true);
    showToast("Terima kasih atas konfirmasinya");
  };

  return (
    <SectionShell id="rsvp" className="px-7 py-20" style={{ background: "var(--inv-bg-alt)" }}>
      <SectionTitle kicker="RSVP" title="Konfirmasi Kehadiran" />
      <Reveal variant="rise" className="inv-card p-6">
        {sent ? (
          <p className="py-6 text-center">
            Terima kasih, <strong>{name}</strong>! Konfirmasi{" "}
            <strong>{ATTENDANCE_LABEL[status]}</strong>
            {status === "HADIR" ? ` untuk ${pax} orang` : ""} sudah kami terima.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="text-sm">
              Nama
              <input
                className="inv-input mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                placeholder="Nama Anda"
              />
            </label>
            <fieldset className="text-sm">
              <legend className="mb-1.5">Kehadiran</legend>
              <div className="grid grid-cols-3 gap-2">
                {ATTENDANCE.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setStatus(a.value)}
                    aria-pressed={status === a.value}
                    className="min-h-11 rounded-lg px-2 text-xs font-semibold transition-colors"
                    style={
                      status === a.value
                        ? { background: "var(--inv-primary)", color: "var(--inv-primary-text)" }
                        : { boxShadow: "inset 0 0 0 1px var(--inv-border)" }
                    }
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {status === "HADIR" && (
              <label className="text-sm">
                Jumlah orang
                <select
                  className="inv-input mt-1.5"
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} orang
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" className="inv-btn mt-2">
              Kirim Konfirmasi
            </button>
          </form>
        )}
      </Reveal>
    </SectionShell>
  );
}

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};

export function DefaultUcapan() {
  const { wishes: initial, guestName, showToast } = useInvitation();
  const [local, setLocal] = useState<WishItem[]>([]);
  const [name, setName] = useState(guestName ?? "");
  const [message, setMessage] = useState("");
  const wishes = useMemo(() => [...local, ...initial], [local, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLocal((w) => [
      { name: name.trim(), message: message.trim(), createdAt: new Date().toISOString() },
      ...w,
    ]);
    setMessage("");
    showToast("Ucapan terkirim, terima kasih!");
  };

  return (
    <SectionShell id="ucapan" className="px-7 py-20">
      <SectionTitle kicker="Doa & Harapan" title="Ucapan" />
      <Reveal variant="rise">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="inv-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            placeholder="Nama Anda"
          />
          <textarea
            className="inv-input min-h-28 resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            required
            placeholder="Tulis ucapan & doa terbaik…"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-60">{message.length}/300</span>
            <button type="submit" className="inv-btn">
              Kirim Ucapan
            </button>
          </div>
        </form>
      </Reveal>
      {wishes.length > 0 && (
        <div className="inv-card mt-8 max-h-96 overflow-y-auto px-5">
          {wishes.map((w, i) => (
            <div
              key={i}
              className="border-t py-4 first:border-t-0"
              style={{
                borderColor: "color-mix(in srgb, var(--inv-surface-text) 15%, transparent)",
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{w.name}</p>
                <p className="shrink-0 text-[11px] opacity-60" suppressHydrationWarning>
                  {timeAgo(w.createdAt)}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed opacity-85">{w.message}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
