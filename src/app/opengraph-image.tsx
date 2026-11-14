import fs from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";
import sharp from "sharp";

import { business } from "@/config/business";

/**
 * Gambar pratinjau link halaman website (landing, harga, tema, …) — dibuat
 * sekali saat build. Identitas website: ivory, terracotta, emas, Fraunces.
 * Mockup HP memakai gambar cover dari `pnpm landing:record`.
 */
export const alt = `${business.name} — ${business.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const IVORY = "#faf5ec";
const INK = "#3a2a22";
const TERRA = "#9a4a30";
const GOLD = "#b8924a";

export default async function Image() {
  const root = process.cwd();
  const [fraunces, jakarta, cover] = await Promise.all([
    fs.readFile(path.join(root, "src/lib/og/fonts/fraunces-500.ttf")),
    fs.readFile(path.join(root, "src/lib/og/fonts/jakarta-600.ttf")),
    fs
      .readFile(path.join(root, "public/landing/hero.webp"))
      .then((b) => sharp(b).resize(300, 649).jpeg({ quality: 82 }).toBuffer())
      .catch(() => null),
  ]);
  const words = business.tagline.split(" ");
  const png = await new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: IVORY, color: INK }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 0 0 84px",
          width: 760,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "Jakarta",
            fontSize: 22,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: GOLD,
          }}
        >
          <div style={{ width: 48, height: 2, background: GOLD }} />
          Undangan digital
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontFamily: "Fraunces",
            fontSize: 76,
            lineHeight: 1.05,
            marginTop: 26,
          }}
        >
          <span>{words.slice(0, -2).join(" ")}&nbsp;</span>
          <span style={{ color: TERRA }}>{words.slice(-2).join(" ")}</span>
        </div>
        <div style={{ fontFamily: "Jakarta", fontSize: 26, marginTop: 28, color: "#7a6556" }}>
          Pernikahan & ulang tahun · RSVP & ucapan · kirim lewat WhatsApp
        </div>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 40, marginTop: 44 }}>
          {business.name}
          <span style={{ color: GOLD }}>.</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 40,
            width: 360,
            height: 600,
            borderRadius: 999,
            background: "#f1e7d6",
          }}
        />
        {cover && (
          <div
            style={{
              display: "flex",
              padding: 10,
              borderRadius: 44,
              background: "#1d1715",
              transform: "rotate(-3deg)",
              marginTop: 60,
            }}
          >
            {}
            <img
              src={`data:image/jpeg;base64,${cover.toString("base64")}`}
              width={270}
              height={584}
              style={{ borderRadius: 36 }}
              alt=""
            />
          </div>
        )}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "Jakarta", data: jakarta, weight: 400, style: "normal" },
      ],
    },
  ).arrayBuffer();
  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } });
}
