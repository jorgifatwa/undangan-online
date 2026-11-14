"use client";

import Image from "next/image";

import { safeHref } from "@/lib/links";

import { useCopy, whatsappLink } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { Orn, Section, txt, Typewriter, u, useDecor, useNick } from "../canvas";
import { Ribbon, Sparkle } from "../ornaments";

/**
 * Section tambahan yang tidak ada di desain asli, tetap bergaya tema:
 * catatan kertas bertempel selotip, judul diketik, pita & kilau.
 * Teks bebas tidak pernah dijadikan link; link hanya domain tepercaya.
 */

/** Kertas catatan bertempel selotip, sedikit miring. */
function Note({
  children,
  tilt = -1.2,
  d = 0.2,
  style,
}: {
  children: React.ReactNode;
  tilt?: number;
  d?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div data-a="tilt" style={{ ["--d" as string]: `${d}s`, ...style }}>
      <div
        style={{
          position: "relative",
          transform: `rotate(${tilt}deg)`,
          background: "var(--inv-note)",
          padding: `${u(24)} ${u(20)} ${u(20)}`,
          boxShadow: `0 ${u(6)} ${u(16)} rgb(0 0 0 / 0.10)`,
          border: `1px solid var(--inv-line)`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: u(-10),
            left: "50%",
            width: u(78),
            height: u(22),
            transform: "translateX(-50%) rotate(-3deg)",
            background: "color-mix(in srgb, var(--inv-accent) 35%, transparent)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

function Title({ text }: { text: string }) {
  return (
    <h2
      style={{
        ...txt(31, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 }),
        padding: `0 ${u(30)}`,
      }}
    >
      <Typewriter text={text} delay={0.1} />
    </h2>
  );
}

const small = (o: Parameters<typeof txt>[2] = {}) => txt(15.5, 1.4, o);
const btnStyle: React.CSSProperties = {
  marginTop: u(14),
  height: u(38),
  padding: `0 ${u(22)}`,
  fontSize: u(16),
  letterSpacing: u(1),
};

export function DressCode() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const dc = inv.data.dressCode;
  if (!dc) return null;
  return (
    <Section id="dressCode" style={{ padding: `${u(30)} ${u(34)} ${u(40)}` }}>
      <Title text={t.dress} />
      <Note d={0.3} style={{ marginTop: u(24) }}>
        {dc.text && <p style={small()}>{dc.text}</p>}
        {dc.colors.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: u(14),
              marginTop: u(16),
            }}
          >
            {dc.colors.map((c, i) => (
              <span
                key={c + i}
                aria-label={`Warna ${c}`}
                role="img"
                style={{
                  width: u(46),
                  height: u(46),
                  background: c,
                  // bentuk coretan krayon (blob tidak simetris)
                  borderRadius: "48% 52% 44% 56% / 55% 45% 55% 45%",
                  transform: `rotate(${i * 23}deg)`,
                  boxShadow: "inset 0 0 0 2px rgb(0 0 0 / 0.08)",
                }}
              />
            ))}
          </div>
        )}
      </Note>
    </Section>
  );
}

export function LiveStream() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const ls = inv.data.liveStream;
  const href = safeHref(ls?.url, "liveStream");
  if (!ls || !href) return null;
  return (
    <Section id="liveStream" style={{ padding: `${u(30)} ${u(34)} ${u(40)}` }}>
      <Title text={t.live} />
      <Note tilt={1.2} d={0.3} style={{ marginTop: u(24) }}>
        {ls.note && <p style={small()}>{ls.note}</p>}
        <div style={{ textAlign: "center" }}>
          <a href={href} target="_blank" rel="noopener" className="pk-btn" style={btnStyle}>
            ▶ Tonton di {ls.platform ?? "sini"}
          </a>
        </div>
      </Note>
    </Section>
  );
}

export function Gift() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const copy = useCopy();
  const gift = inv.data.gift;
  const wishlist = inv.eventType === "BIRTHDAY" ? inv.data.wishlist : [];
  const intro =
    gift?.intro ??
    "Doa dan kehadiranmu sudah jadi kado terbaik. Tapi kalau ingin memberi tanda kasih, bisa lewat:";
  return (
    <Section id="amplop" style={{ padding: `${u(30)} ${u(34)} ${u(44)}` }}>
      <Orn
        slot="ribbon-a"
        l={20}
        t={14}
        w={46}
        ratio={1.02}
        rotate={-10}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Title text={t.gift} />
      {gift && (
        <p data-a="fade" style={{ ...small(), marginTop: u(14), ["--d" as string]: "0.3s" }}>
          {intro}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: u(26), marginTop: u(28) }}>
        {gift?.accounts.map((a, i) => (
          <Note key={a.number + i} tilt={i % 2 ? 1.4 : -1.4} d={0.35 + i * 0.1}>
            <p style={small({ weight: 700, ls: 1.5, upper: true, color: "var(--inv-deep)" })}>
              {a.bank}
            </p>
            <p
              style={{
                ...txt(26, 1.2, { weight: 700, ls: 1.5 }),
                fontVariantNumeric: "tabular-nums",
                marginTop: u(4),
              }}
            >
              {a.number}
            </p>
            <p style={small()}>a.n. {a.holder}</p>
            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                className="pk-btn"
                style={btnStyle}
                onClick={() => copy(a.number.replace(/\s/g, ""), "Nomor rekening disalin")}
              >
                Salin nomor
              </button>
            </div>
          </Note>
        ))}
        {gift?.qris && (
          <Note tilt={1} d={0.5}>
            <p style={small({ weight: 700, ls: 1.5, color: "var(--inv-deep)" })}>QRIS</p>
            <div
              style={{
                position: "relative",
                width: u(200),
                aspectRatio: "1",
                margin: `${u(10)} auto 0`,
                background: "#fff",
              }}
            >
              <Image
                src={gift.qris.url}
                alt="Kode QRIS"
                fill
                sizes="(max-width: 440px) 47vw, 200px"
                style={{ objectFit: "contain" }}
              />
            </div>
          </Note>
        )}
        {gift?.physical && (
          <Note tilt={-1} d={0.55}>
            <p style={small({ weight: 700, ls: 1.5, color: "var(--inv-deep)" })}>Kirim Kado</p>
            {gift.physical.recipient && (
              <p style={{ ...small({ weight: 700 }), marginTop: u(6) }}>
                {gift.physical.recipient}
              </p>
            )}
            <p style={{ ...small(), whiteSpace: "pre-line" }}>{gift.physical.address}</p>
            {gift.physical.phone && <p style={small()}>{gift.physical.phone}</p>}
            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                className="pk-btn"
                style={btnStyle}
                onClick={() => copy(gift.physical!.address, "Alamat disalin")}
              >
                Salin alamat
              </button>
            </div>
          </Note>
        )}
        {gift && gift.confirmContacts.length > 0 && (
          <div data-a="fade" style={{ ["--d" as string]: "0.6s" }}>
            <p style={small()}>Konfirmasi pengiriman kado:</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: u(10),
                marginTop: u(8),
              }}
            >
              {gift.confirmContacts.map((c) => (
                <a
                  key={c.phone}
                  href={whatsappLink(c.phone)}
                  target="_blank"
                  rel="noopener"
                  className="pk-btn"
                  style={{ ...btnStyle, marginTop: 0 }}
                >
                  WhatsApp {c.name}
                </a>
              ))}
            </div>
          </div>
        )}
        {wishlist.length > 0 && (
          <Note tilt={1.2} d={0.6}>
            <p style={small({ weight: 700, ls: 1.5, upper: true, color: "var(--inv-deep)" })}>
              {t.wishlist}
            </p>
            <ul
              style={{
                marginTop: u(10),
                display: "flex",
                flexDirection: "column",
                gap: u(8),
                textAlign: "left",
              }}
            >
              {wishlist.map((w) => {
                const href = safeHref(w.url, "wishlist");
                return (
                  <li
                    key={w.name}
                    style={{ ...small({ align: "left" }), display: "flex", gap: u(8) }}
                  >
                    <span aria-hidden>✎</span>
                    <span>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener"
                          style={{ fontWeight: 700, textDecoration: "underline" }}
                        >
                          {w.name}
                        </a>
                      ) : (
                        <strong>{w.name}</strong>
                      )}
                      {w.note && <span style={{ display: "block", opacity: 0.75 }}>{w.note}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Note>
        )}
      </div>
    </Section>
  );
}

export function Closing() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const nick = useNick();
  if (inv.eventType !== "BIRTHDAY") return null;
  const text =
    inv.data.greeting?.closingText?.trim() ||
    "Terima kasih sudah jadi bagian dari hari spesial ini. Sampai jumpa di pesta! 🤍";
  const photo = inv.data.closingPhoto;
  return (
    <Section id="penutup" style={{ padding: `${u(34)} ${u(34)} ${u(70)}` }}>
      <Orn
        slot="ribbon-b"
        l={330}
        t={20}
        w={48}
        ratio={1.36}
        rotate={8}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-c"
        l={40}
        t={50}
        w={18}
        ratio={1.03}
        tint={false}
        a="fade"
        d={0.4}
        fallback={<Sparkle />}
      />
      {photo && (
        <div data-a="tilt" style={{ ["--d" as string]: "0.2s" }}>
          <div
            style={{
              width: u(220),
              margin: "0 auto",
              background: "#fff",
              padding: `${u(10)} ${u(10)} ${u(38)}`,
              transform: "rotate(-3deg)",
              boxShadow: `0 ${u(8)} ${u(18)} rgb(0 0 0 / 0.15)`,
            }}
          >
            <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
              <Image
                src={photo.url}
                alt={photo.alt ?? ""}
                fill
                sizes="(max-width: 440px) 50vw, 220px"
                style={{
                  objectFit: "cover",
                  objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 50}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
      <h2
        style={{
          ...txt(40, 1.1, { color: "var(--inv-red)", weight: 700, ls: 3 }),
          marginTop: u(photo ? 30 : 10),
        }}
      >
        <Typewriter text={t.thanks} delay={0.2} />
      </h2>
      <p
        data-a="fade"
        style={{ ...small(), marginTop: u(14), whiteSpace: "pre-line", ["--d" as string]: "0.5s" }}
      >
        {text}
      </p>
      <p
        data-a="up"
        style={{
          ...txt(30, 1.2, { color: "var(--inv-deep)", weight: 700 }),
          marginTop: u(22),
          ["--d" as string]: "0.7s",
        }}
      >
        {nick} ♡
      </p>
      <p
        data-a="fade"
        style={{
          ...small({ color: "var(--inv-text-muted)" }),
          marginTop: u(4),
          ["--d" as string]: "0.8s",
        }}
      >
        {t.seeThere}
      </p>
    </Section>
  );
}
