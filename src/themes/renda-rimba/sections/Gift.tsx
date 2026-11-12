"use client";

import Image from "next/image";

import { useCopy, whatsappLink } from "../../_shared/hooks";
import { DriedBouquet, GiftBox, Sparkles } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { Art, F, Pic, Section, txt, u } from "../canvas";

/**
 * Wedding Gift (desain 430 × ±500): buket gantung di kedua sudut atas, judul,
 * sketsa kotak kado dengan kilau berkedip, teks, dan kartu rekening kaca
 * hijau-abu dengan tombol Copy gelap.
 */
const DEFAULT_TEXT =
  "Kehadiran dan doa Anda merupakan hadiah terindah bagi kami. Namun, apabila Anda ingin memberikan tanda kasih, kami akan menerimanya dengan tulus dan penuh rasa syukur.";

const CARD: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: u(12),
  margin: `0 ${u(55)} ${u(16)}`,
  padding: `${u(18)} ${u(16)} ${u(18)} ${u(18)}`,
  borderRadius: u(18),
  background: "linear-gradient(100deg, var(--inv-gift-a) 0%, var(--inv-gift-b) 100%)",
  boxShadow: `0 ${u(8)} ${u(20)} rgb(0 0 0 / .35), inset 0 1px 0 rgb(255 255 255 / .18)`,
  textAlign: "left",
};

function CopyButton({ onClick, label = "Copy" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: u(6),
        padding: `${u(9)} ${u(14)}`,
        border: 0,
        borderRadius: u(8),
        background: "var(--inv-copy)",
        cursor: "pointer",
        boxShadow: `0 ${u(3)} ${u(8)} rgb(0 0 0 / .35)`,
        ...txt(F.sans, 11.5, 1, { weight: 500, color: "#fff" }),
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(13), height: u(13) }}>
        <path
          fill="currentColor"
          d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"
        />
      </svg>
      {label}
    </button>
  );
}

export function RendaGift() {
  const { inv } = useInvitation();
  const copy = useCopy();
  const g = inv.data.gift;
  if (!g) return null;

  return (
    <Section id="amplop" minHeight={480} z={1} threshold={0.15} style={{ paddingBottom: u(40) }}>
      <Pic
        slot="bouquet-hanging"
        l={-26}
        t={-16}
        w={128}
        ratio={800 / 640}
        a="soft"
        sway="hang"
        z={2}
        fallback={<DriedBouquet slot={false} variant="hanging" className="h-full w-full" />}
      />
      <Pic
        slot="bouquet-hanging"
        l={312}
        t={-16}
        w={150}
        ratio={800 / 640}
        flip
        a="soft"
        d={0.15}
        sway="hang"
        z={2}
        fallback={
          <DriedBouquet slot={false} variant="hanging" seed={5} className="h-full w-full" />
        }
      />

      <div style={{ position: "relative", paddingTop: u(38), textAlign: "center" }}>
        <h2 data-a="up" style={txt(F.elegant, 42, 1.25)}>
          Wedding Gift
        </h2>
        <div
          data-a="zoom"
          aria-hidden
          style={{
            position: "relative",
            width: u(124),
            height: u(145),
            margin: `${u(10)} auto 0`,
            ["--d" as string]: "0.2s",
          }}
        >
          <Art
            slot="gift-box"
            w={124}
            fallback={<GiftBox slot={false} className="h-full w-full" />}
          />
          <div
            className="rr-twinkle"
            style={{ position: "absolute", left: u(96), top: u(-14), width: u(34), height: u(48) }}
          >
            <Sparkles style={{ width: "100%", height: "100%", color: "var(--inv-cream)" }} />
          </div>
          <div
            className="rr-twinkle"
            style={{
              position: "absolute",
              left: u(-14),
              top: u(70),
              width: u(24),
              height: u(34),
              animationDelay: "0.7s",
            }}
          >
            <Sparkles style={{ width: "100%", height: "100%", color: "var(--inv-cream)" }} />
          </div>
        </div>
        <p
          data-a="up"
          style={{
            ...txt(F.sans, 12.5, 1.65, { weight: 300 }),
            margin: `${u(26)} ${u(46)} ${u(40)}`,
            ["--d" as string]: "0.3s",
          }}
        >
          {g.intro ?? DEFAULT_TEXT}
        </p>
      </div>

      {g.accounts.map((acc, i) => (
        <div
          key={acc.number + i}
          data-a="up"
          style={{ ...CARD, ["--d" as string]: `${0.4 + i * 0.12}s` }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...txt(F.sans, 12, 1.35, { align: "left" }), overflowWrap: "anywhere" }}>
              BANK {acc.bank.replace(/^bank\s+/i, "").toUpperCase()} an. {acc.holder}
            </p>
            <p
              style={{
                ...txt(F.sans, 17, 1.3, { ls: 1, align: "left" }),
                marginTop: u(8),
                paddingLeft: u(20),
              }}
            >
              {acc.number}
            </p>
          </div>
          <CopyButton
            onClick={() => copy(acc.number.replace(/\s/g, ""), "Nomor rekening disalin")}
          />
        </div>
      ))}

      {g.qris && (
        <div data-a="up" style={{ ...CARD, flexDirection: "column", textAlign: "center" }}>
          <p style={txt(F.sans, 12, 1.3)}>Scan QRIS</p>
          <div
            style={{
              position: "relative",
              width: u(170),
              aspectRatio: "1",
              background: "#fff",
              borderRadius: u(8),
              overflow: "hidden",
            }}
          >
            <Image
              src={g.qris.url}
              alt="QRIS"
              fill
              sizes="180px"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {g.physical && (
        <div data-a="up" style={CARD}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={txt(F.sans, 12, 1.35, { align: "left", weight: 500 })}>Kirim Hadiah</p>
            {g.physical.recipient && (
              <p style={{ ...txt(F.sans, 12, 1.4, { align: "left" }), marginTop: u(6) }}>
                {g.physical.recipient}
              </p>
            )}
            <p
              style={{
                ...txt(F.sans, 11.5, 1.5, { align: "left", weight: 300 }),
                marginTop: u(4),
                whiteSpace: "pre-line",
              }}
            >
              {g.physical.address}
            </p>
          </div>
          <CopyButton onClick={() => copy(g.physical!.address, "Alamat disalin")} />
        </div>
      )}

      {g.confirmContacts.length > 0 && (
        <div data-a="up" style={{ textAlign: "center", marginTop: u(8) }}>
          <p style={{ ...txt(F.sans, 11.5, 1.4, { weight: 300 }), marginBottom: u(10) }}>
            Konfirmasi pengiriman hadiah:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: u(10) }}>
            {g.confirmContacts.map((c) => (
              <a
                key={c.phone}
                href={whatsappLink(c.phone, "Halo, saya ingin konfirmasi pengiriman hadiah.")}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: `${u(8)} ${u(16)}`,
                  borderRadius: 99,
                  border: "1px solid rgb(246 239 228 / .6)",
                  textDecoration: "none",
                  ...txt(F.sans, 12, 1),
                }}
              >
                WhatsApp {c.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
