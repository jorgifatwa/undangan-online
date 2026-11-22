"use client";

import Image from "next/image";

import { useCopy } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { House } from "../art/Ornaments";
import { F, Section, txt, u } from "../canvas";

/**
 * Wedding Gift: kartu marun judul skrip "Wedding — Gift"; kartu "Send Here"
 * (sketsa rumah, penerima, telepon, alamat kirim kado); kalimat pengantar di
 * latar coklat gelap; rekening sebagai pil putih (ikon kartu, nomor, salin) +
 * "A.N : pemilik".
 */
const DARK = "#21160f";
const FALLBACK =
  "Your presence on our big day means the world for us, and we truly appreciate you being part of our special moment. With all due respect, should you wish to send a gift, you may use the bank account below.";

function ScriptCard({ left, right }: { left: string; right?: string }) {
  return (
    <div
      style={{
        background: "var(--inv-maroon)",
        borderRadius: u(4),
        padding: `${u(16)} 0`,
        boxShadow: "0 4px 12px rgb(0 0 0 / 0.35)",
      }}
    >
      <p style={txt(F.script, 30, 1.2, { color: "#f1e6e1" })}>
        {left}
        {right && (
          <>
            {" "}
            <span
              style={{
                display: "inline-block",
                width: u(34),
                borderTop: "1px dotted #f1e6e1",
                verticalAlign: "middle",
              }}
            />{" "}
            {right}
          </>
        )}
      </p>
    </div>
  );
}

export function SuratMarunGift() {
  const { inv } = useInvitation();
  const copy = useCopy();
  const g = inv.data.gift;
  if (!g) return null;
  const cover =
    inv.eventType === "WEDDING" ? (inv.data.photos.strip[3] ?? inv.data.photos.cover) : undefined;

  return (
    <Section id="amplop" bg={DARK}>
      <div
        style={{ position: "relative", padding: `${u(28)} ${u(8)} ${u(10)}`, overflow: "hidden" }}
      >
        {cover && (
          <div
            aria-hidden
            style={{ position: "absolute", inset: 0, opacity: 0.35, filter: "grayscale(1)" }}
          >
            <Image src={cover.url} alt="" fill sizes="440px" style={{ objectFit: "cover" }} />
          </div>
        )}
        <div style={{ position: "relative" }}>
          <div data-a>
            <ScriptCard left="Wedding" right="Gift" />
          </div>
          {g.physical && (
            <div
              data-a
              style={{
                marginTop: u(6),
                background: "var(--inv-maroon)",
                borderRadius: u(4),
                padding: `${u(22)} ${u(20)} ${u(26)}`,
                textAlign: "center",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.35)",
                ["--d" as string]: "0.1s",
              }}
            >
              <p style={txt(F.script, 30, 1.2, { color: "#f1e6e1" })}>Send Here</p>
              <div
                style={{ width: u(80), height: u(60), margin: `${u(14)} auto 0`, color: "#f1e6e1" }}
              >
                <House style={{ width: "100%", height: "100%" }} />
              </div>
              {g.physical.recipient && (
                <p
                  style={{
                    ...txt(F.sans, 8.5, 1.6, { color: "#f1e6e1", ls: 2.4 }),
                    marginTop: u(16),
                  }}
                >
                  {g.physical.recipient.toUpperCase()}
                </p>
              )}
              {g.physical.phone && (
                <p style={txt(F.sans, 8.5, 1.6, { color: "#f1e6e1", ls: 2.4 })}>
                  {g.physical.phone}
                </p>
              )}
              <p
                style={{
                  ...txt(F.sans, 8.5, 1.7, { color: "#f1e6e1", ls: 2.4 }),
                  marginTop: u(14),
                }}
              >
                {g.physical.address.toUpperCase()}
              </p>
              <button
                type="button"
                onClick={() => copy(g.physical!.address, "Alamat disalin")}
                style={{
                  marginTop: u(14),
                  padding: `${u(5)} ${u(12)}`,
                  border: "1px solid rgb(241 230 225 / 0.7)",
                  borderRadius: 999,
                  ...txt(F.sans, 9, 1, { color: "#f1e6e1" }),
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
              >
                Salin alamat
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: `${u(18)} ${u(30)} ${u(46)}`, textAlign: "center" }}>
        <p data-a style={txt(F.sans, 10.5, 1.6, { color: "#efe9df" })}>
          {g.intro ?? FALLBACK}
        </p>
        {g.accounts.map((a, i) => (
          <div
            key={`${a.bank}-${a.number}`}
            data-a
            style={{
              marginTop: u(i ? 14 : 30),
              paddingTop: i ? u(14) : 0,
              borderTop: i ? "1px solid rgb(239 233 223 / 0.25)" : undefined,
              ["--d" as string]: `${0.1 + i * 0.1}s`,
            }}
          >
            <p style={txt(F.sans, 11, 1.3, { color: "#efe9df", weight: 700 })}>{a.bank}</p>
            <button
              type="button"
              onClick={() => copy(a.number.replace(/\s/g, ""), "Nomor rekening disalin")}
              aria-label={`Salin nomor rekening ${a.bank}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: u(10),
                marginTop: u(8),
                padding: `${u(6)} ${u(10)}`,
                borderRadius: 999,
                background: "#fff",
                ...txt(F.sans, 11, 1, { color: "#333" }),
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              <svg viewBox="0 0 24 18" style={{ width: u(18), height: u(13) }} aria-hidden>
                <rect x={0.5} y={0.5} width={23} height={17} rx={2.5} fill="#4a7fd1" />
                <rect x={0.5} y={4} width={23} height={3} fill="#2c5aa0" />
                <rect x={3} y={11} width={8} height={2} rx={1} fill="#d6e4f7" />
              </svg>
              <span style={{ minWidth: u(110), textAlign: "left" }}>{a.number}</span>
              <svg viewBox="0 0 24 24" style={{ width: u(14), height: u(14) }} aria-hidden>
                <rect x={8} y={8} width={12} height={12} rx={2} fill="#f2c23a" />
                <path
                  d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                  fill="none"
                  stroke="#f2c23a"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <p style={{ ...txt(F.sans, 9.5, 1.3, { color: "#efe9df" }), marginTop: u(6) }}>
              A.N : {a.holder}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
