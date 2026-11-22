"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useCopy, whatsappLink } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import type { BankAccount } from "@/schemas/common";
import { F, Section, txt, u } from "../canvas";

/**
 * Amplop Digital (latar krem hangat berawan): judul tebal miring, kalimat
 * doa restu, kartu bank sage (chip emas, nama bank, nomor, pemilik, tombol
 * "Salin Rekening"). QRIS & alamat kado fisik memakai kartu sage yang sama;
 * kontak konfirmasi berupa tautan WhatsApp kecil.
 */
const FALLBACK_INTRO =
  "Doa restu Anda adalah anugerah yang sangat berarti bagi kami. Jika memberi merupakan ungkapan kasih, kami menerimanya dengan penuh rasa syukur dan terima kasih.";

/** Latar krem hangat + awan lembut (dipakai juga galeri). */
export const warmBg: React.CSSProperties = {
  background:
    "radial-gradient(ellipse 45% 18% at 85% 30%, rgb(255 255 255 / 0.35), transparent 70%), radial-gradient(ellipse 50% 20% at 10% 70%, rgb(200 190 160 / 0.18), transparent 70%), radial-gradient(ellipse 40% 16% at 70% 90%, rgb(255 255 255 / 0.3), transparent 70%), var(--inv-warm, #f2e9d4)",
};

function Chip({ shine }: { shine?: number }) {
  return (
    <span
      // key berubah tiap salin → kilau diputar ulang
      key={shine}
      className={shine ? "li-shine" : undefined}
      style={{
        position: "relative",
        display: "block",
        width: u(45),
        height: u(33),
        borderRadius: u(6),
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 45 33"
        style={{ width: u(45), height: u(33), display: "block" }}
        aria-hidden
      >
        <rect x={0.5} y={0.5} width={44} height={32} rx={6} fill="#f1cf5f" stroke="#c9a53a" />
        <path
          d="M0.5 11h13M0.5 22h13M31 11h13.5M31 22h13.5M13.5 0.5v32M31 0.5v32M13.5 16.5H31"
          stroke="#b8952c"
          strokeWidth={1}
          fill="none"
        />
        <rect x={13.5} y={6} width={17.5} height={21} rx={3} fill="none" stroke="#b8952c" />
      </svg>
    </span>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      style={{ width: u(10), height: u(10) }}
      aria-hidden
    >
      <rect x={8} y={8} width={12} height={12} rx={2} />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function SageCard({
  children,
  d,
  tilt = -4,
}: {
  children: React.ReactNode;
  d: number;
  tilt?: number;
}) {
  return (
    <div
      data-a="place"
      style={{
        ["--tilt" as string]: `${tilt}deg`,
        position: "relative",
        width: u(266),
        minHeight: u(155),
        margin: `${u(16)} auto 0`,
        borderRadius: u(16),
        background: "var(--inv-sage)",
        boxShadow: `0 ${u(2)} ${u(6)} rgb(60 60 40 / 0.18)`,
        padding: `${u(20)} ${u(22)} ${u(18)}`,
        ["--d" as string]: `${d}s`,
      }}
    >
      {children}
    </div>
  );
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: u(5),
        padding: `${u(5)} ${u(10)}`,
        borderRadius: u(3),
        background: "#f6f1e6",
        color: "#5d6046",
        fontFamily: F.serif,
        fontSize: u(9),
        boxShadow: `0 ${u(1)} ${u(2)} rgb(0 0 0 / 0.15)`,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
    >
      <CopyIcon />
      {label}
    </button>
  );
}

function BankCard({ a, i }: { a: BankAccount; i: number }) {
  const copy = useCopy();
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(0), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <SageCard d={0.25 + i * 0.12} tilt={i % 2 ? 4 : -4}>
      <p
        style={{
          position: "absolute",
          right: u(24),
          top: u(12),
          maxWidth: u(150),
          ...txt(F.serif, 28, 1.1, { color: "#cdb48a", align: "right" }),
          overflowWrap: "anywhere",
        }}
      >
        {a.bank}
      </p>
      <div style={{ marginTop: u(10) }}>
        <Chip shine={copied} />
      </div>
      <p
        style={{
          ...txt(F.serif, 13.5, 1.3, { color: "var(--inv-cream)", align: "left" }),
          fontVariantNumeric: "oldstyle-nums",
          marginTop: u(11),
          letterSpacing: u(0.3),
        }}
      >
        {a.number}
      </p>
      <p
        style={{
          ...txt(F.serif, 14.5, 1.3, { weight: 600, color: "var(--inv-cream)", align: "left" }),
          marginTop: u(3),
          paddingRight: u(90),
        }}
      >
        {a.holder}
      </p>
      <div style={{ position: "absolute", right: u(24), bottom: u(18) }}>
        <CopyButton
          label={copied ? "Tersalin ✓" : "Salin Rekening"}
          onClick={() => {
            void copy(a.number.replace(/\s/g, ""), "Nomor rekening disalin");
            setCopied(Date.now());
          }}
        />
      </div>
    </SageCard>
  );
}

export function LiliGift() {
  const { inv } = useInvitation();
  const copy = useCopy();
  const g = inv.data.gift;
  if (!g) return null;
  const n = g.accounts.length;

  return (
    <Section id="amplop" bg={warmBg}>
      <div style={{ padding: `${u(26)} ${u(34)} ${u(30)}` }}>
        <h2
          data-a
          style={txt(F.serif, 33, 1.25, { italic: true, weight: 700, color: "var(--inv-ink)" })}
        >
          Amplop Digital
        </h2>
        <p
          data-a
          style={{
            ...txt(F.serif, 12.6, u(17), { color: "#6f6b5c" }),
            marginTop: u(10),
            ["--d" as string]: "0.15s",
          }}
        >
          {g.intro ?? FALLBACK_INTRO}
        </p>

        {g.accounts.map((a, i) => (
          <BankCard key={`${a.bank}-${a.number}`} a={a} i={i} />
        ))}

        {g.qris && (
          <SageCard d={0.25 + n * 0.12}>
            <p
              style={txt(F.serif, 16, 1.3, {
                italic: true,
                weight: 600,
                color: "var(--inv-cream)",
              })}
            >
              QRIS
            </p>
            <div
              style={{
                position: "relative",
                width: u(150),
                height: u(150),
                margin: `${u(10)} auto 0`,
                background: "#fff",
                borderRadius: u(8),
                overflow: "hidden",
              }}
            >
              <Image
                src={g.qris.url}
                alt="QRIS"
                fill
                sizes="160px"
                style={{ objectFit: "contain" }}
              />
            </div>
          </SageCard>
        )}

        {g.physical && (
          <SageCard d={0.35 + n * 0.12}>
            <p
              style={txt(F.serif, 16, 1.3, {
                italic: true,
                weight: 600,
                color: "var(--inv-cream)",
                align: "left",
              })}
            >
              Kirim Kado
            </p>
            {g.physical.recipient && (
              <p
                style={{
                  ...txt(F.serif, 14, 1.3, {
                    weight: 600,
                    color: "var(--inv-cream)",
                    align: "left",
                  }),
                  marginTop: u(8),
                }}
              >
                {g.physical.recipient}
              </p>
            )}
            <p
              style={{
                ...txt(F.serif, 12.5, 1.45, { color: "var(--inv-cream)", align: "left" }),
                marginTop: u(4),
                marginBottom: u(12),
              }}
            >
              {g.physical.address}
              {g.physical.phone && (
                <>
                  <br />
                  {g.physical.phone}
                </>
              )}
            </p>
            <div style={{ textAlign: "right" }}>
              <CopyButton
                label="Salin Alamat"
                onClick={() => copy(g.physical!.address, "Alamat disalin")}
              />
            </div>
          </SageCard>
        )}

        {g.confirmContacts.length > 0 && (
          <p
            data-a
            style={{
              ...txt(F.serif, 12, 1.6, { color: "#6f6b5c" }),
              marginTop: u(16),
            }}
          >
            Konfirmasi hadiah:{" "}
            {g.confirmContacts.map((c, i) => (
              <span key={c.phone}>
                {i > 0 && " · "}
                <a
                  href={whatsappLink(c.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--inv-ink)",
                    textDecoration: "underline",
                    pointerEvents: "auto",
                  }}
                >
                  {c.name}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </Section>
  );
}
