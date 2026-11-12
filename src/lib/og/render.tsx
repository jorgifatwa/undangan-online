import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type { ShareInfo } from "@/lib/invitations/share";
import { siteConfig } from "@/lib/site";

/**
 * Gambar pratinjau link 1200×630 (WhatsApp, Telegram, Facebook) dirender
 * satori (next/og). Desain tipografis memakai gradien & font tema — tanpa foto
 * agar ringan (< 300 KB, batas aman WhatsApp) dan tidak membocorkan foto
 * pribadi lebih jauh dari isi undangan.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

type FontFile =
  | "pinyon-script.ttf"
  | "great-vibes.ttf"
  | "cormorant-600.ttf"
  | "lora-500.ttf"
  | "fredoka-600.ttf"
  | "nunito-700.ttf"
  | "jakarta-600.ttf";

interface OgStyle {
  names: { file: FontFile; family: string; size: number };
  text: { file: FontFile; family: string };
}
const STYLES: Record<string, OgStyle> = {
  "tirai-beludru": {
    names: { file: "pinyon-script.ttf", family: "Pinyon Script", size: 118 },
    text: { file: "cormorant-600.ttf", family: "Cormorant" },
  },
  "renda-rimba": {
    names: { file: "great-vibes.ttf", family: "Great Vibes", size: 124 },
    text: { file: "lora-500.ttf", family: "Lora" },
  },
  "confetti-party": {
    names: { file: "fredoka-600.ttf", family: "Fredoka", size: 112 },
    text: { file: "nunito-700.ttf", family: "Nunito" },
  },
};
const DEFAULT_STYLE: OgStyle = {
  names: { file: "cormorant-600.ttf", family: "Cormorant", size: 104 },
  text: { file: "jakarta-600.ttf", family: "Jakarta" },
};
const BRAND_BG = "linear-gradient(135deg, #3b2a5c 0%, #7a3e6b 55%, #d9895b 100%)";

const fontCache = new Map<FontFile, Promise<Buffer>>();
function font(file: FontFile) {
  let p = fontCache.get(file);
  if (!p) {
    p = fs.readFile(path.join(process.cwd(), "src/lib/og/fonts", file));
    fontCache.set(file, p);
  }
  return p;
}

async function fonts(style: OgStyle) {
  const files = [style.names, style.text, { file: "jakarta-600.ttf" as const, family: "Jakarta" }];
  const seen = new Set<string>();
  const out = [];
  for (const f of files) {
    if (seen.has(f.family)) continue;
    seen.add(f.family);
    out.push({
      name: f.family,
      data: await font(f.file),
      weight: 400 as const,
      style: "normal" as const,
    });
  }
  return out;
}

/** Ukuran nama menyesuaikan panjangnya agar tetap satu–dua baris. */
function nameSize(base: number, names: string) {
  const n = names.length;
  return n <= 16
    ? base
    : n <= 24
      ? Math.round(base * 0.8)
      : n <= 34
        ? Math.round(base * 0.64)
        : Math.round(base * 0.5);
}

export async function invitationOg(
  info: ShareInfo,
  theme: { id: string; background: string; foreground: string },
) {
  const s = STYLES[theme.id] ?? DEFAULT_STYLE;
  const fg = theme.foreground;
  const node = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundImage: theme.background,
        backgroundColor: "#222",
        color: fg,
        padding: 32,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${fg}55`,
          borderRadius: 28,
          padding: "40px 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: s.text.family,
            fontSize: 30,
            letterSpacing: 8,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {info.heading}
        </div>
        <div
          style={{
            fontFamily: s.names.family,
            fontSize: nameSize(s.names.size, info.names),
            lineHeight: 1.15,
            marginTop: 18,
            marginBottom: 18,
            maxWidth: 1000,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {info.names}
        </div>
        <div style={{ width: 220, height: 2, backgroundColor: `${fg}88`, marginBottom: 26 }} />
        <div style={{ fontFamily: s.text.family, fontSize: 40 }}>{info.dateLabel}</div>
        {info.city && (
          <div style={{ fontFamily: s.text.family, fontSize: 30, opacity: 0.8, marginTop: 8 }}>
            {info.city}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 44,
          right: 64,
          fontFamily: "Jakarta",
          fontSize: 20,
          opacity: 0.6,
        }}
      >
        {siteConfig.name}
      </div>
    </div>
  );
  return { node, fonts: await fonts(s) };
}

/** Gambar umum tanpa data pribadi (undangan kedaluwarsa / tidak ditemukan). */
export async function genericOg() {
  const node = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: BRAND_BG,
        color: "#fff",
        fontFamily: "Jakarta",
      }}
    >
      <div style={{ fontSize: 34, letterSpacing: 8, textTransform: "uppercase", opacity: 0.85 }}>
        Undangan Digital
      </div>
      <div style={{ fontFamily: "Cormorant", fontSize: 110, marginTop: 12 }}>{siteConfig.name}</div>
    </div>
  );
  return { node, fonts: await fonts(DEFAULT_STYLE) };
}
