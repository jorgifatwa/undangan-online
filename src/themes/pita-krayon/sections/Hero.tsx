"use client";

import { useInvitation } from "../../_shared/runtime/context";
import { CrayonNumber } from "../CrayonNumber";
import { box, Orn, Section, txt, Typewriter, u, useDecor, useNick } from "../canvas";
import { HeroPhoto, usePhotoDecor } from "../PhotoDecor";
import { Cake, PartyHat, Ribbon, Sparkle } from "../ornaments";

/**
 * Pembuka (section "salam", dikunci tepat setelah cover): "{NAMA} IS TURNING"
 * diketik, angka umur krayon raksasa "digoreskan", foto masa kecil bergaya
 * stiker (PNG tanpa latar → garis mengikuti siluet) bertopi glitter, kue
 * coretan di depan, pita & kilau. Kanvas 430×610 seperti desain.
 */
export function Hero() {
  const { inv } = useInvitation();
  const nick = useNick();
  const { lang } = useDecor();
  const { cake } = usePhotoDecor();
  if (inv.eventType !== "BIRTHDAY") return null;
  const c = inv.data.celebrant;
  const age = c.age;
  const photo = c.childPhoto ?? c.photo;
  const line1 = age !== undefined ? nick : lang === "id" ? nick : `${nick}'S`;
  const line2 =
    age !== undefined
      ? lang === "id"
        ? "GENAP"
        : "IS TURNING"
      : lang === "id"
        ? "ULANG TAHUN!"
        : "BIRTHDAY!";
  const digits = age !== undefined ? String(age).length : 0;
  // tinggi kotak angka (glyph ±0,7×): "17" ≈ 270×223 px seperti desain; 3 digit lebih kecil
  const numH = digits >= 3 ? 240 : 300;

  return (
    <Section id="salam" minHeight={620} threshold={0.12}>
      <h2
        style={{
          ...txt(37, 1.02, { color: "var(--inv-red)", weight: 700, ls: 4, upper: true }),
          position: "relative",
          paddingTop: u(36),
          zIndex: 3,
        }}
      >
        <span style={{ display: "block", whiteSpace: "nowrap" }}>
          <Typewriter text={line1} delay={0.1} />
        </span>
        <span style={{ display: "block", whiteSpace: "nowrap" }}>
          <Typewriter text={line2} delay={0.1 + line1.length * 0.055 + 0.15} />
        </span>
      </h2>

      {/* angka umur krayon (di belakang foto) */}
      {age !== undefined && (
        <div
          style={{
            ...box(0, 92, 430, numH),
            display: "flex",
            // satu digit: di kiri siluet (seperti "1" pada "17" di desain) agar tetap terlihat
            justifyContent: digits === 1 && photo ? "flex-start" : "center",
            paddingLeft: digits === 1 && photo ? u(10) : undefined,
            zIndex: 1,
          }}
        >
          <div className="pk-crayon-reveal" style={{ ["--d" as string]: "0.35s" }}>
            <CrayonNumber value={age} height={u(numH)} />
          </div>
        </div>
      )}

      {/* foto: bingkai stiker (foto biasa) atau siluet (tanpa latar) + topi pesta */}
      {photo && <HeroPhoto photo={photo} alt={photo.alt ?? c.name} />}
      {!photo && (
        <Orn
          slot="party-hat-glitter"
          l={250}
          t={120}
          w={64}
          ratio={1.36}
          rotate={12}
          a="drop"
          d={0.9}
          z={3}
          fallback={<PartyHat glitter />}
        />
      )}

      {/* ilustrasi kue di depan foto (sakelar editor "Tampilkan ilustrasi kue") */}
      {(cake || !photo) && (
        <Orn
          slot="cake"
          l={photo ? 120 : 95}
          t={photo ? (photo.alpha ? 312 : 356) : 300}
          w={photo ? 190 : 240}
          ratio={1.53}
          tint
          a="up"
          d={0.8}
          z={4}
          fallback={<Cake />}
        />
      )}

      <Orn
        slot="ribbon-c"
        l={38}
        t={104}
        w={62}
        ratio={1.32}
        rotate={-12}
        a="fade"
        d={0.5}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="ribbon-a"
        l={334}
        t={44}
        w={50}
        ratio={1.02}
        rotate={8}
        a="fade"
        d={0.55}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="ribbon-b"
        l={342}
        t={258}
        w={54}
        ratio={1.36}
        rotate={-6}
        a="fade"
        d={0.6}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="ribbon-c"
        l={44}
        t={352}
        w={52}
        ratio={1.32}
        rotate={10}
        a="fade"
        d={0.65}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-pair"
        l={56}
        t={286}
        w={28}
        ratio={1.22}
        tint={false}
        a="fade"
        d={0.7}
        fallback={<Sparkle />}
      />
      <Orn
        slot="sparkle-b"
        l={322}
        t={296}
        w={16}
        ratio={1.03}
        tint={false}
        a="fade"
        d={0.75}
        fallback={<Sparkle />}
      />
      <Orn
        slot="sparkle-c"
        l={312}
        t={402}
        w={20}
        ratio={1.03}
        tint={false}
        a="fade"
        d={0.8}
        fallback={<Sparkle />}
      />
      <Orn
        slot="sparkle-a"
        l={348}
        t={96}
        w={14}
        ratio={1.37}
        tint={false}
        a="fade"
        d={0.85}
        fallback={<Sparkle />}
      />
    </Section>
  );
}
