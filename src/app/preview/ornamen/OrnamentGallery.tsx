"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { PetalBurst, PetalRain, type PetalBurstHandle } from "@/themes/_shared/effects/Petals";
import { Reveal } from "@/themes/_shared/motion/Reveal";
import {
  AnimatedEnvelope,
  Anthurium,
  Basmalah,
  Butterfly,
  CallaLily,
  CapsuleFrame,
  CarvedCorner,
  DriedBouquet,
  EnvelopeClosed,
  GiftBox,
  Heart,
  LaceBorder,
  LaceDoily,
  Lily,
  OvalBaroqueFrame,
  PearlStrands,
  Petal,
  Polaroid,
  ScallopFrame,
  SealArt,
  Skyline,
  Sparkles,
  StampCard,
  Street,
  StreetTree,
  Tassel,
  Tower,
  Vinyl,
  WaxSealBreak,
  type EnvelopeStage,
} from "@/themes/_shared/ornaments";
import { ThemeAssetsProvider, type ThemeAssets } from "@/themes/_shared/assets";
import { InvitationContext } from "@/themes/_shared/runtime/context";
import { THEME_ASSETS as RENDA_ASSETS } from "@/themes/renda-rimba/assets/index.generated";
import { THEME_ASSETS as TIRAI_ASSETS } from "@/themes/tirai-beludru/assets/index.generated";
import "@/themes/_shared/runtime/runtime.css";
import {
  DamaskCarpet,
  LeafPattern,
  LeatherTexture,
  PaperTexture,
  SuedeTexture,
  VelvetDrape,
  VelvetTexture,
} from "@/themes/_shared/textures";
import { TIRAI_VARIANTS } from "@/themes/tirai-beludru/tokens";

const FONT_VARS = {
  "--inv-font-arabic": "var(--font-amiri), serif",
  "--inv-font-script": "'Pinyon Script', cursive",
} as React.CSSProperties;

const photo = (src: string) => (
  <Image src={src} alt="" fill sizes="200px" className="object-cover" />
);

/* ----------------------------- daftar ornamen ------------------------------ */

interface Item {
  name: string;
  note?: string;
  render: () => React.ReactNode;
  /** Tekstur mengisi sel penuh (tanpa padding). */
  fill?: boolean;
}

const ITEMS: { group: string; items: Item[] }[] = [
  {
    group: "Segel & amplop",
    items: [
      {
        name: '<SealArt emblem="floral" />',
        render: () => (
          <div className="w-24">
            <SealArt />
          </div>
        ),
      },
      {
        name: '<SealArt tone="gold" emblem="butterfly" />',
        render: () => (
          <div className="w-24">
            <SealArt tone="gold" emblem="butterfly" />
          </div>
        ),
      },
      {
        name: "<EnvelopeClosed /> + segel",
        render: () => (
          <div className="relative w-48">
            <EnvelopeClosed />
            <div className="absolute top-[52%] left-[42%] w-[16%]">
              <SealArt />
            </div>
          </div>
        ),
      },
      { name: "<LaceDoily />", render: () => <LaceDoily className="h-40" /> },
    ],
  },
  {
    group: "Bingkai & kartu",
    items: [
      {
        name: "<CapsuleFrame />",
        render: () => (
          <CapsuleFrame className="w-28">
            {photo("/placeholders/photos/wedding-bride.webp")}
          </CapsuleFrame>
        ),
      },
      {
        name: "<OvalBaroqueFrame />",
        render: () => (
          <OvalBaroqueFrame className="w-32">
            {photo("/placeholders/photos/wedding-cover.webp")}
          </OvalBaroqueFrame>
        ),
      },
      {
        name: "<ScallopFrame />",
        render: () => (
          <ScallopFrame className="w-28">
            <Basmalah className="text-sm" style={{ color: "var(--inv-ink)" }} />
          </ScallopFrame>
        ),
      },
      {
        name: "<LaceBorder />",
        render: () => (
          <LaceBorder className="w-40">
            <p className="py-4 text-center text-xs" style={{ color: "var(--inv-ink)" }}>
              Isi kartu renda
            </p>
          </LaceBorder>
        ),
      },
      {
        name: "<StampCard />",
        render: () => (
          <StampCard className="w-40">
            <p className="py-3 text-center text-xs" style={{ color: "var(--inv-ink)" }}>
              Kartu perangko
            </p>
          </StampCard>
        ),
      },
      {
        name: "<Polaroid />",
        render: () => (
          <Polaroid className="w-28">{photo("/placeholders/photos/wedding-closing.webp")}</Polaroid>
        ),
      },
    ],
  },
  {
    group: "Ornamen kecil",
    items: [
      {
        name: "<Butterfly flapping={false} />",
        render: () => (
          <Butterfly
            flapping={false}
            className="w-20"
            style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / .35))" }}
          />
        ),
      },
      { name: "<Petal />", render: () => <Petal className="w-8" /> },
      { name: "<Vinyl playing />", render: () => <Vinyl playing className="w-24" /> },
      { name: "<GiftBox />", render: () => <GiftBox className="w-24" color="var(--inv-gold)" /> },
      { name: "<Tassel />", render: () => <Tassel className="h-40" /> },
      { name: "<PearlStrands />", render: () => <PearlStrands className="h-40" /> },
      { name: "<Sparkles />", render: () => <Sparkles className="w-16" /> },
      { name: "<CarvedCorner />", render: () => <CarvedCorner className="w-24" /> },
      { name: "<Heart />", render: () => <Heart className="w-8" /> },
      {
        name: "<Basmalah /> (teks Amiri)",
        render: () => (
          <Basmalah
            className="w-44 text-xl whitespace-nowrap"
            style={{ color: "var(--inv-gold)", filter: "drop-shadow(0 0 1px rgb(0 0 0 / .6))" }}
          />
        ),
      },
    ],
  },
  {
    group: "Bunga (kandidat ilustrasi tangan)",
    items: [
      {
        name: '<DriedBouquet variant="hanging" />',
        render: () => <DriedBouquet variant="hanging" className="h-44" />,
      },
      {
        name: '<DriedBouquet variant="floor" />',
        render: () => <DriedBouquet variant="floor" className="h-44" />,
      },
      {
        name: '<DriedBouquet variant="accent" />',
        render: () => <DriedBouquet variant="accent" seed={9} className="h-32" />,
      },
      { name: "<CallaLily />", render: () => <CallaLily className="h-44" /> },
      { name: "<Anthurium />", render: () => <Anthurium className="h-40" /> },
      { name: "<Lily />", render: () => <Lily className="w-28" /> },
    ],
  },
  {
    group: "Kota pop-up (kandidat ilustrasi tangan)",
    items: [
      { name: "<Tower />", render: () => <Tower className="w-40" /> },
      { name: '<Skyline side="left" />', render: () => <Skyline side="left" className="w-32" /> },
      { name: '<Skyline side="right" />', render: () => <Skyline side="right" className="w-32" /> },
      { name: "<StreetTree />", render: () => <StreetTree className="w-28" /> },
      { name: "<Street />", render: () => <Street className="w-48" /> },
    ],
  },
  {
    group: "Tekstur (CSS + noise; noise mati di mode ringan)",
    items: [
      { name: "<VelvetDrape />", render: () => <VelvetDrape />, fill: true },
      { name: "<VelvetTexture />", render: () => <VelvetTexture />, fill: true },
      { name: "<SuedeTexture />", render: () => <SuedeTexture />, fill: true },
      { name: "<DamaskCarpet />", render: () => <DamaskCarpet />, fill: true },
      { name: "<PaperTexture />", render: () => <PaperTexture />, fill: true },
      { name: "<LeatherTexture />", render: () => <LeatherTexture />, fill: true },
      { name: "<LeafPattern />", render: () => <LeafPattern />, fill: true },
    ],
  },
];

/* ------------------------------- komponen ---------------------------------- */

function Cell({
  dark,
  fillCell,
  children,
}: {
  dark: boolean;
  fillCell?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex h-48 items-center justify-center overflow-hidden ${fillCell ? "" : "p-3"}`}
      style={{ background: dark ? "#141414" : "#f6f1e8" }}
    >
      {children}
    </div>
  );
}

function Swatches({ variant }: { variant: (typeof TIRAI_VARIANTS)[number] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span className="flex -space-x-1">
        {variant.swatch.map((c) => (
          <span
            key={c}
            className="size-3.5 rounded-full border border-white"
            style={{ background: c }}
          />
        ))}
      </span>
      {variant.name}
    </span>
  );
}

/** Demo animasi: amplop lengkap (segel → tutup 3D → kartu naik → kelopak). */
function EnvelopeDemo({ lite }: { lite: boolean }) {
  const [stage, setStage] = useState<EnvelopeStage>("closed");
  const [run, setRun] = useState(0);
  const burst = useRef<PetalBurstHandle | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[300px] pt-[150px]">
        <AnimatedEnvelope
          key={run}
          stage={stage}
          lite={lite}
          onPetals={(x, y) => !lite && burst.current?.burst(x, y)}
          card={
            <div className="relative">
              <LaceDoily className="w-full" />
              <p
                className="absolute inset-x-[16%] top-[30%] text-center text-[9px] leading-snug"
                style={{ fontFamily: "var(--font-noto-serif)", color: "var(--inv-ink)" }}
              >
                &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan
                pasangan-pasangan untukmu dari jenismu sendiri…&rdquo;
                <br />
                <br />
                QS Ar-Rum 21
              </p>
            </div>
          }
        />
      </div>
      <PetalBurst ref={burst} />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full border bg-white px-3 py-1 text-sm text-neutral-900 disabled:opacity-50"
          onClick={() => setStage("opening")}
          disabled={stage !== "closed"}
        >
          Buka
        </button>
        <button
          type="button"
          className="rounded-full border bg-white px-3 py-1 text-sm text-neutral-900 disabled:opacity-50"
          onClick={() => setStage("open")}
        >
          Lewati
        </button>
        <button
          type="button"
          className="rounded-full border bg-white px-3 py-1 text-sm text-neutral-900 disabled:opacity-50"
          onClick={() => {
            setStage("closed");
            setRun((r) => r + 1);
          }}
        >
          ↺ Ulangi
        </button>
      </div>
    </div>
  );
}

function Replay({ label, children }: { label: string; children: (k: number) => React.ReactNode }) {
  const [k, setK] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-white/60 p-4">
      <p className="font-mono text-xs">{label}</p>
      <div className="flex min-h-40 items-center justify-center">{children(k)}</div>
      <button
        type="button"
        className="rounded-full border bg-white px-3 py-1 text-sm text-neutral-900 disabled:opacity-50"
        onClick={() => setK((x) => x + 1)}
      >
        ↺ Putar ulang
      </button>
    </div>
  );
}

function SealDemo({ lite, k }: { lite: boolean; k: number }) {
  const [state, setState] = useState<"whole" | "broken">("whole");
  const [prevK, setPrevK] = useState(k);
  if (k !== prevK) {
    setPrevK(k);
    setState("whole");
  }
  return (
    <button
      type="button"
      aria-label="Pecahkan segel"
      onClick={() => setState("broken")}
      className="w-28"
    >
      <WaxSealBreak key={k} state={state} lite={lite} spin className="aspect-square w-full" />
      <span className="mt-2 block text-xs opacity-60">
        {state === "whole" ? "ketuk segel" : "pecah"}
      </span>
    </button>
  );
}

function GiftDemo({ lite, k }: { lite: boolean; k: number }) {
  const [open, setOpen] = useState(false);
  const [prevK, setPrevK] = useState(k);
  if (k !== prevK) {
    setPrevK(k);
    setOpen(false);
  }
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} className="w-28">
      <GiftBox open={open} lite={lite} color="var(--inv-gold-dark)" />
      <span className="mt-2 block text-xs opacity-60">ketuk: {open ? "tutup" : "buka"}</span>
    </button>
  );
}

function PetalDemo({ lite }: { lite: boolean }) {
  const ref = useRef<PetalBurstHandle | null>(null);
  return (
    <div
      className="relative h-40 w-56 overflow-hidden rounded-lg"
      style={{ background: "var(--inv-drape)" }}
    >
      <PetalRain count={14} lite={lite} />
      <PetalBurst ref={ref} />
      <button
        type="button"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (!lite) ref.current?.burst(r.left + r.width / 2, r.top);
        }}
      >
        {lite ? "semburan mati (mode ringan)" : "Semburkan kelopak"}
      </button>
    </div>
  );
}

function CityDemo({ k }: { k: number }) {
  return (
    <div key={k} className="relative h-44 w-[300px]">
      <Reveal variant="popup-ground" className="absolute bottom-0 left-[5%] w-[90%]">
        <Street className="w-full" />
      </Reveal>
      <Reveal variant="popup-left" delay={0.8} className="absolute bottom-[14px] left-[6%] w-[30%]">
        <Skyline side="left" className="w-full" />
      </Reveal>
      <Reveal
        variant="popup-right"
        delay={0.8}
        className="absolute right-[6%] bottom-[14px] w-[28%]"
      >
        <Skyline side="right" className="w-full" />
      </Reveal>
      <Reveal variant="popup-up" delay={0.35} className="absolute bottom-[14px] left-[30%] w-[44%]">
        <Tower className="w-full" />
      </Reveal>
      <Reveal variant="popup-up" delay={1.5} className="absolute bottom-[10px] left-[22%] w-[18%]">
        <StreetTree className="w-full" />
      </Reveal>
      <Reveal
        variant="popup-up"
        delay={1.65}
        className="absolute right-[18%] bottom-[10px] w-[20%]"
      >
        <StreetTree lamp="right" className="w-full" />
      </Reveal>
    </div>
  );
}

export function OrnamentGallery() {
  const [lite, setLite] = useState(false);
  // Sumber aset: SVG orisinal, atau file asli hasil `pnpm assets:sync` per tema.
  const [source, setSource] = useState<"svg" | "tirai" | "renda">("svg");
  const assets: ThemeAssets =
    source === "tirai" ? TIRAI_ASSETS : source === "renda" ? RENDA_ASSETS : {};
  const count = (a: ThemeAssets) => Object.keys(a).length;
  const [variantIdx, setVariantIdx] = useState(0);
  const demoVariant = TIRAI_VARIANTS[variantIdx];

  // Context minimal agar <Reveal> bisa membaca mode ringan.
  const ctx = { lite } as unknown as React.ContextType<typeof InvitationContext>;

  return (
    <InvitationContext.Provider value={ctx}>
      <ThemeAssetsProvider assets={assets}>
        <div
          data-inv-root
          data-lite={lite ? "" : undefined}
          className="min-h-dvh bg-neutral-100 pb-24 font-sans text-neutral-900"
          style={FONT_VARS}
        >
          <header className="sticky top-0 z-20 border-b bg-white/90 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2">
              <h1 className="font-serif text-xl">Pratinjau Ornamen</h1>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={lite} onChange={(e) => setLite(e.target.checked)} />
                Mode ringan
              </label>
              <label className="flex items-center gap-2 text-sm">
                Aset:
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as typeof source)}
                  className="rounded border px-2 py-1"
                >
                  <option value="svg">SVG orisinal</option>
                  <option value="tirai">
                    File asli Tirai Beludru ({count(TIRAI_ASSETS)} slot)
                  </option>
                  <option value="renda">File asli Renda Rimba ({count(RENDA_ASSETS)} slot)</option>
                </select>
              </label>
              <span className="text-xs text-neutral-500">
                Slot tanpa file asli tetap SVG · warna SVG dari token --inv-*
              </span>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4">
            {/* ------------------------- animasi ------------------------- */}
            <section className="mt-8">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">Animasi per bagian</h2>
                <div className="flex gap-1.5">
                  {TIRAI_VARIANTS.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      className={`rounded-full border px-3 py-1 ${i === variantIdx ? "border-neutral-900 bg-white" : "opacity-70"}`}
                    >
                      <Swatches variant={v} />
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={demoVariant.tokens as React.CSSProperties}
                className="grid gap-4 md:grid-cols-[1.4fr_1fr]"
              >
                <div
                  className="relative overflow-hidden rounded-xl p-6"
                  style={{ background: "var(--inv-drape)" }}
                >
                  <VelvetDrape />
                  <p className="relative mb-2 text-center font-mono text-xs text-white/80">
                    &lt;AnimatedEnvelope /&gt; {lite && "(mode ringan: tanpa 3D & kelopak)"}
                  </p>
                  <div className="relative">
                    <EnvelopeDemo lite={lite} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Replay label="<WaxSealBreak />">{(k) => <SealDemo lite={lite} k={k} />}</Replay>
                  <Replay label="<GiftBox open />">{(k) => <GiftDemo lite={lite} k={k} />}</Replay>
                  <Replay label="<Butterfly flapping />">
                    {(k) => (
                      <Butterfly
                        key={k}
                        className="w-24"
                        color="var(--inv-ornament-white)"
                        style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / .3))" }}
                      />
                    )}
                  </Replay>
                  <Replay label="<PetalRain /> + <PetalBurst />">
                    {(k) => <PetalDemo key={k} lite={lite} />}
                  </Replay>
                </div>
                <div className="md:col-span-2">
                  <Replay label="Kota pop-up (Reveal popup-*)">{(k) => <CityDemo k={k} />}</Replay>
                </div>
              </div>
            </section>

            {/* ------------------------- grid statis ------------------------- */}
            {ITEMS.map(({ group, items }) => (
              <section key={group} className="mt-12">
                <h2 className="mb-3 text-lg font-semibold">{group}</h2>
                <div className="flex flex-col gap-5">
                  {items.map((item) => (
                    <div
                      key={item.name}
                      className="overflow-hidden rounded-xl border bg-white"
                      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 260px" }}
                    >
                      <p className="border-b px-4 py-2 font-mono text-xs">{item.name}</p>
                      <div className="grid grid-cols-3 gap-px bg-neutral-200">
                        {TIRAI_VARIANTS.map((v) => (
                          <div key={v.id} style={v.tokens as React.CSSProperties}>
                            <div className="bg-white px-3 py-1.5">
                              <Swatches variant={v} />
                            </div>
                            <div className="grid grid-cols-2 gap-px">
                              <Cell dark={false} fillCell={item.fill}>
                                {item.render()}
                              </Cell>
                              <Cell dark fillCell={item.fill}>
                                {item.render()}
                              </Cell>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </ThemeAssetsProvider>
    </InvitationContext.Provider>
  );
}
