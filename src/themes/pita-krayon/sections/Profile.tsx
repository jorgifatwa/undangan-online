"use client";

import Image from "next/image";

import { useInvitation } from "../../_shared/runtime/context";
import { box, fitSize, Orn, Section, txt, u, useDecor, useFit } from "../canvas";
import { Sparkle, WavyFrame } from "../ornaments";

/**
 * Salam + profil: paragraf terima kasih (teks pembuka pengguna, atau bawaan
 * sesuai bahasa hiasan), nama lengkap merah berjarak, foto dalam bingkai
 * bergelombang berpita + kilau. Nama orang tua (bila diisi) sebagai baris kecil.
 */
const DEFAULT_TEXT = {
  en: "With heartfelt gratitude,\nI would be truly honored to have you join me in celebrating my birthday. Your presence would mean so much to me and make this special day even more memorable.\n\nThank you for your time and kind attention ✨",
  id: "Dengan penuh rasa syukur,\naku akan sangat senang kalau kamu bisa ikut merayakan ulang tahunku. Kehadiranmu berarti banyak dan akan membuat hari spesial ini makin berkesan.\n\nTerima kasih atas waktu dan perhatianmu ✨",
} as const;

export function Profile() {
  const { inv } = useInvitation();
  const { lang } = useDecor();
  const fit = useFit<HTMLHeadingElement>(
    inv.eventType === "BIRTHDAY" ? inv.data.celebrant.name : "",
    0.92,
  );
  if (inv.eventType !== "BIRTHDAY") return null;
  const c = inv.data.celebrant;
  const text = inv.data.greeting?.openingText?.trim() || DEFAULT_TEXT[lang];
  const parents = [
    c.father?.name && `Bapak ${c.father.name}`,
    c.mother?.name && `Ibu ${c.mother.name}`,
  ]
    .filter(Boolean)
    .join(" & ");

  return (
    <Section id="profil" style={{ paddingTop: u(30), paddingBottom: u(40) }}>
      <p
        data-a="fade"
        style={{ ...txt(16.5, 1.38), whiteSpace: "pre-line", padding: `0 ${u(44)}` }}
      >
        {text}
      </p>
      <h2
        ref={fit}
        data-a="up"
        style={{
          ...txt(30, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3.5 }),
          fontSize: fitSize(30),
          whiteSpace: "nowrap",
          margin: `${u(40)} ${u(24)} 0`,
          ["--d" as string]: "0.2s",
        }}
      >
        {c.name}
      </h2>
      {parents && (
        <p
          data-a="fade"
          style={{
            ...txt(15, 1.3, { color: "var(--inv-text-muted)" }),
            marginTop: u(4),
            padding: `0 ${u(40)}`,
            ["--d" as string]: "0.3s",
          }}
        >
          Buah hati {parents}
        </p>
      )}

      {c.photo && (
        <div style={{ position: "relative", height: u(370), marginTop: u(18) }}>
          <div
            data-a="tilt"
            style={{
              ...box(111, 30, 208, 300),
              borderRadius: u(42),
              overflow: "hidden",
              background: "var(--inv-bg-alt)",
              ["--d" as string]: "0.35s",
            }}
          >
            <Image
              src={c.photo.url}
              alt={c.photo.alt ?? c.name}
              fill
              sizes="(max-width: 440px) 48vw, 208px"
              style={{
                objectFit: "cover",
                objectPosition: `${c.photo.focusX ?? 50}% ${c.photo.focusY ?? 35}%`,
              }}
            />
          </div>
          {/* bingkai bergelombang berpita menutupi tepi foto */}
          <Orn
            slot="wavy-frame"
            l={96}
            t={0}
            w={238}
            ratio={1.466}
            tint
            a="fade"
            d={0.55}
            fallback={<WavyFrame />}
          />
          <Orn
            slot="sparkle-pair"
            l={320}
            t={36}
            w={26}
            ratio={1.22}
            tint={false}
            a="fade"
            d={0.7}
            fallback={<Sparkle />}
          />
          <Orn
            slot="sparkle-b"
            l={80}
            t={150}
            w={18}
            ratio={1.03}
            tint={false}
            a="fade"
            d={0.75}
            fallback={<Sparkle />}
          />
          <Orn
            slot="sparkle-a"
            l={336}
            t={208}
            w={18}
            ratio={1.37}
            tint={false}
            a="fade"
            d={0.8}
            fallback={<Sparkle />}
          />
          <Orn
            slot="sparkle-pair"
            l={72}
            t={278}
            w={26}
            ratio={1.22}
            tint={false}
            a="fade"
            d={0.85}
            fallback={<Sparkle />}
          />
        </div>
      )}
    </Section>
  );
}
