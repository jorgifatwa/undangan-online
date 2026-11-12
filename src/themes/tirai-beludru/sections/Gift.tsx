"use client";

import Image from "next/image";
import { useState } from "react";

import { useCopy, whatsappLink } from "../../_shared/hooks";
import { Reveal } from "../../_shared/motion/Reveal";
import { GiftBox, Sparkles } from "../../_shared/ornaments";
import { useSlotAsset, AssetImg } from "../../_shared/assets";
import { useInvitation } from "../../_shared/runtime/context";
import { SectionShell } from "../../_shared/runtime/SectionShell";
import { VelvetTexture } from "../../_shared/textures";
import { Art } from "../art";
import { CText, F, Placed, canvasText, u } from "../canvas";
import { AccentBouquet, HangingBouquet } from "../scene";

/** Section 4 desain (440 × 760 untuk 2 rekening). Rekening & info lain mengalir. */
const MIN_H = 760;
const DEFAULT_INTRO = [
  "Doa restu dan kehadiran Anda merupakan",
  "karunia yang sangat berarti bagi kami.",
  "",
  "Namun, jika memberi adalah ungkapan tanda kasih,",
  "Anda dapat memberi melalui dibawah ini.",
];
const LID_CLIP =
  "polygon(0 0, 100% 0, 100% 38.2%, 91.6% 38.8%, 82% 43.3%, 71.9% 49%, 42% 46.4%, 24.2% 44.3%, 0 44.5%)";
const BOX_CLIP =
  "polygon(0 44.5%, 24.2% 44.3%, 42% 46.4%, 71.9% 49%, 82% 43.3%, 91.6% 38.8%, 100% 38.2%, 100% 100%, 0 100%)";

const line = (size: number, lh: number, bold = false): React.CSSProperties => ({
  margin: 0,
  fontFamily: F.cormorant,
  fontSize: u(size),
  lineHeight: u(lh),
  fontWeight: bold ? 700 : 400,
  color: "var(--inv-cream)",
  textAlign: "center",
  overflowWrap: "anywhere",
});

/** Kotak kado dua lapis (dipotong di garis bawah tutup) — tutup terangkat sekali saat terlihat. */
function TiraiGiftBox() {
  const img = useSlotAsset(undefined, "gift-box");
  return (
    <Reveal
      variant="pop"
      style={{
        position: "absolute",
        left: u(179.2),
        top: u(154.84),
        width: u(74.8),
        height: u(74.8),
        pointerEvents: "none",
      }}
    >
      {img ? (
        <>
          <div style={{ position: "absolute", inset: 0, clipPath: BOX_CLIP }}>
            <AssetImg image={img} mode="fill" />
          </div>
          <div
            className="tb-gift-lid"
            style={{ position: "absolute", inset: 0, clipPath: LID_CLIP }}
          >
            <AssetImg image={img} mode="fill" />
          </div>
        </>
      ) : (
        <GiftBox slot={false} color="var(--inv-cream)" className="h-full w-full" />
      )}
    </Reveal>
  );
}

function CopyButton({
  onClick,
  done,
  label,
}: {
  onClick: () => void;
  done: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: u(5),
        width: u(62.25),
        height: u(24.75),
        padding: 0,
        border: "none",
        borderRadius: u(3.75),
        background: done ? "#5a6200" : "var(--inv-button-alt, #6f7900)",
        color: "#f6f4e6",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: u(7),
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: u(9.4), height: u(9.4) }}
        aria-hidden
      >
        <rect x="8" y="8" width="13" height="13" rx="3" />
        <path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" />
      </svg>
      <span>{done ? "Tersalin" : "Salin"}</span>
    </button>
  );
}

export function TiraiGift() {
  const { inv } = useInvitation();
  const copy = useCopy();
  const [copied, setCopied] = useState<number | null>(null);
  const gift = inv.data.gift;
  if (!gift) return null;
  const intro = gift.intro ? null : DEFAULT_INTRO;

  const doCopy = (i: number, text: string, label: string) => {
    copy(text.replace(/\s/g, ""), label);
    setCopied(i);
    window.setTimeout(() => setCopied((c) => (c === i ? null : c)), 2000);
  };

  return (
    <SectionShell
      id="amplop"
      className="tb-canvas"
      style={{
        position: "relative",
        width: "100%",
        minHeight: `calc(${u(MIN_H)})`,
        overflow: "hidden",
        containerType: "inline-size",
        background: "#4a0d18",
        contentVisibility: "visible",
        perspective: 900,
      }}
    >
      <Placed img={[-109.77, -26.78, 659.53, 1172.52]} clip={[0, 0, 440, 3000]}>
        <Art
          slot="velvet-bg"
          w={660}
          filter="var(--inv-filter-velvet)"
          fallback={<VelvetTexture slot={false} />}
        />
      </Placed>
      <Placed
        img={[-34.35, -23.84, 145.03, 181.3]}
        clip={[0, 0, 110.68, 157.46]}
        reveal="sway"
        parallax="hanging"
      >
        <HangingBouquet w={145} />
      </Placed>
      <Placed
        img={[302.3, -23.84, 180.94, 226.17]}
        clip={[302.3, 0, 137.7, 202.34]}
        flipX
        reveal="sway-right"
        parallax="hanging"
      >
        <HangingBouquet w={181} />
      </Placed>

      <div style={{ position: "relative", height: u(255.88) }}>
        <CText reveal="blur" style={canvasText([52.09, 52.56, 300.63], F.script, 51.574, 72.176)}>
          {inv.eventType === "WEDDING" ? "Wedding Gift" : "Kado"}
        </CText>
        <TiraiGiftBox />
        <Sparkles
          style={{
            position: "absolute",
            left: u(232.96),
            top: u(148.88),
            width: u(37.95),
            height: u(53.45),
          }}
        />
        <Sparkles
          style={{
            position: "absolute",
            left: u(161.64),
            top: u(192.24),
            width: u(27.64),
            height: u(38.92),
          }}
        />
      </div>

      <div style={{ position: "relative", padding: `0 ${u(47.13)}` }}>
        {intro ? (
          intro.map((t, i) =>
            t ? (
              <p key={i} style={line(16.341, 24.238)}>
                {t}
              </p>
            ) : (
              <div key={i} style={{ height: u(24.238) }} />
            ),
          )
        ) : (
          <p style={line(16.341, 24.238)}>{gift.intro}</p>
        )}
      </div>

      <div
        style={{
          position: "relative",
          marginTop: u(398.56 - 255.88 - 5 * 24.23),
          padding: `0 ${u(44)}`,
        }}
      >
        {gift.accounts.map((a, i) => (
          <Reveal
            key={a.number + i}
            variant="flip"
            style={{
              marginBottom: u(i < gift.accounts.length - 1 ? 147.99 - 121.56 : 0),
              textAlign: "center",
            }}
          >
            <p style={line(21.237, 31.582, true)}>{a.number}</p>
            <p style={{ ...line(16.341, 24.238), marginTop: u(2.72) }}>{a.bank}</p>
            <p style={line(16.341, 24.238)}>a.n {a.holder}</p>
            <div style={{ marginTop: u(14.04) }}>
              <CopyButton
                onClick={() => doCopy(i, a.number, `Nomor rekening ${a.bank} disalin`)}
                done={copied === i}
                label={`Salin nomor rekening ${a.bank}`}
              />
            </div>
          </Reveal>
        ))}

        {gift.qris && (
          <Reveal variant="zoom" style={{ marginTop: u(36), textAlign: "center" }}>
            <p style={line(16.341, 24.238, true)}>QRIS</p>
            <div
              style={{
                position: "relative",
                width: u(180),
                aspectRatio: "1",
                margin: `${u(8)} auto 0`,
                background: "#fff",
                borderRadius: u(6),
                overflow: "hidden",
              }}
            >
              <Image
                src={gift.qris.url}
                alt="Kode QRIS"
                fill
                sizes="180px"
                style={{ objectFit: "contain" }}
              />
            </div>
          </Reveal>
        )}

        {gift.physical && (
          <Reveal variant="rise" style={{ marginTop: u(36), textAlign: "center" }}>
            <p style={line(16.341, 24.238, true)}>Kirim Kado</p>
            {gift.physical.recipient && (
              <p style={line(16.341, 24.238)}>{gift.physical.recipient}</p>
            )}
            <p style={{ ...line(16.341, 24.238), whiteSpace: "pre-line" }}>
              {gift.physical.address}
            </p>
            {gift.physical.phone && <p style={line(16.341, 24.238)}>{gift.physical.phone}</p>}
            <div style={{ marginTop: u(10) }}>
              <CopyButton
                onClick={() => doCopy(100, gift.physical!.address, "Alamat disalin")}
                done={copied === 100}
                label="Salin alamat"
              />
            </div>
          </Reveal>
        )}

        {gift.confirmContacts.length > 0 && (
          <Reveal variant="fade" style={{ marginTop: u(30), textAlign: "center" }}>
            <p style={line(14, 21)}>Konfirmasi kiriman hadiah:</p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: u(10),
                marginTop: u(8),
                flexWrap: "wrap",
              }}
            >
              {gift.confirmContacts.map((c) => (
                <a
                  key={c.phone}
                  href={whatsappLink(c.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...line(14, 28),
                    padding: `0 ${u(12)}`,
                    border: "1px solid rgb(250 243 237 / 0.6)",
                    borderRadius: u(4),
                    textDecoration: "none",
                  }}
                >
                  {c.name} · {c.phone}
                </a>
              ))}
            </div>
          </Reveal>
        )}
        <div style={{ height: u(94.8 + 24) }} />
      </div>

      <Placed
        img={[-124.47, 457.44, 235.16, 293.94]}
        clip={[0, 562.34, 110.69, 189.06]}
        reveal="rise"
        parallax="floor"
      >
        <AccentBouquet w={235} />
      </Placed>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: u(260),
          pointerEvents: "none",
        }}
      >
        <Placed
          img={[280.36, 260 - 215.04, 202.88, 253.59]}
          clip={[352.72, 260 - 124.54, 87.28, 124.54]}
          reveal="rise"
          parallax="floor"
        >
          <AccentBouquet w={203} />
        </Placed>
      </div>
    </SectionShell>
  );
}
