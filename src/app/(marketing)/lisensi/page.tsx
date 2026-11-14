import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "Lisensi Pihak Ketiga",
  description: `Daftar komponen pihak ketiga (model, runtime, font, library) yang dipakai ${business.name}, beserta lisensinya.`,
  alternates: { canonical: "/lisensi" },
};

/** Satu baris komponen: nama · lisensi · sumber · teks lisensi. */
interface Item {
  name: string;
  license: string;
  source: string;
  text: string;
  note?: string;
}

const ML: Item[] = [
  {
    name: "MediaPipe Tasks Vision (runtime)",
    license: "Apache-2.0",
    source: "https://github.com/google-ai-edge/mediapipe",
    text: "/licenses/mediapipe.txt",
    note: "Editor saja — deteksi wajah untuk topi pesta",
  },
  {
    name: "BlazeFace short range (model deteksi wajah, Google)",
    license: "Apache-2.0",
    source: "https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector",
    text: "/licenses/apache-2.0.txt",
    note: "Editor saja",
  },
  {
    name: "Selfie Segmenter (model hapus latar mode ringan, Google)",
    license: "Apache-2.0",
    source: "https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter",
    text: "/licenses/apache-2.0.txt",
    note: "Editor saja",
  },
  {
    name: "MODNet (model hapus latar, ZHKKKe; bobot ONNX Xenova/modnet)",
    license: "Apache-2.0",
    source: "https://github.com/ZHKKKe/MODNet",
    text: "/licenses/modnet.txt",
    note: "Editor saja",
  },
  {
    name: "ONNX Runtime Web",
    license: "MIT",
    source: "https://github.com/microsoft/onnxruntime",
    text: "/licenses/onnxruntime.txt",
    note: "Editor saja · pemberitahuan pihak ketiga: /licenses/onnxruntime-third-party-notices.txt",
  },
];

const FONTS: [name: string, dir: string, file: string][] = [
  ["Gaegu", "gaegu", "gaegu"],
  ["Arimo", "arimo", "arimo"],
  ["Jost", "jost", "jost"],
  ["Caveat & Caveat Brush", "caveat", "caveat"],
  ["Great Vibes", "greatvibes", "greatvibes"],
  ["Parisienne", "parisienne", "parisienne"],
  ["Kaushan Script", "kaushanscript", "kaushanscript"],
  ["Lora", "lora", "lora"],
  ["Cormorant Garamond", "cormorantgaramond", "cormorantgaramond"],
  ["Amiri", "amiri", "amiri"],
  ["Pinyon Script", "pinyonscript", "pinyonscript"],
  ["Herr Von Muellerhoff", "herrvonmuellerhoff", "herrvonmuellerhoff"],
  ["Noto Serif", "notoserif", "notoserif"],
  ["Quattrocento", "quattrocento", "quattrocento"],
  ["Fredoka", "fredoka", "fredoka"],
  ["Nunito", "nunito", "nunito"],
  ["Plus Jakarta Sans", "plusjakartasans", "plusjakartasans"],
  ["Fraunces", "fraunces", "fraunces"],
];

const LIBS: [name: string, license: string, source: string][] = [
  ["Next.js", "MIT", "https://github.com/vercel/next.js"],
  ["React & React DOM", "MIT", "https://github.com/facebook/react"],
  ["Motion (framer-motion)", "MIT", "https://github.com/motiondivision/motion"],
  ["Lucide", "ISC", "https://github.com/lucide-icons/lucide"],
  ["Sonner", "MIT", "https://github.com/emilkowalski/sonner"],
  ["Zod", "MIT", "https://github.com/colinhacks/zod"],
  ["React Hook Form & resolvers", "MIT", "https://github.com/react-hook-form/react-hook-form"],
  ["react-easy-crop", "MIT", "https://github.com/ValentinH/react-easy-crop"],
  ["heic2any", "MIT", "https://github.com/alexcorvi/heic2any"],
  ["dnd kit", "MIT", "https://github.com/clauderic/dnd-kit"],
  ["Radix UI", "MIT", "https://github.com/radix-ui/primitives"],
  ["Auth.js (next-auth)", "ISC", "https://github.com/nextauthjs/next-auth"],
  ["date-fns", "MIT", "https://github.com/date-fns/date-fns"],
];
const LIB_FILE: Record<string, string> = {
  "Next.js": "next",
  "React & React DOM": "react",
  "Motion (framer-motion)": "framer-motion",
  Lucide: "lucide-react",
  Sonner: "sonner",
  Zod: "zod",
  "React Hook Form & resolvers": "react-hook-form",
  "react-easy-crop": "react-easy-crop",
  heic2any: "heic2any",
  "dnd kit": "@dnd-kit__core",
  "Radix UI": "radix-ui",
  "Auth.js (next-auth)": "next-auth",
  "date-fns": "date-fns",
};

function Table({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.name} className="rounded-xl border p-3 text-sm">
          <p className="font-medium">{i.name}</p>
          <p className="text-muted-foreground">
            Lisensi: {i.license} ·{" "}
            <a className="underline" href={i.source} target="_blank" rel="noopener">
              sumber
            </a>{" "}
            ·{" "}
            <a className="underline" href={i.text}>
              teks lisensi
            </a>
            {i.note && <> · {i.note}</>}
          </p>
        </li>
      ))}
    </ul>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "ml",
    title: "Model & runtime pengolah foto (editor)",
    body: (
      <>
        <p>
          Dipakai di editor untuk menaruh topi pesta di kepala dan &ldquo;Hapus latar
          otomatis&rdquo;. Semua berjalan di perangkat pengguna dan di-host di server{" "}
          {business.name} sendiri — foto tidak dikirim ke layanan pihak ketiga. Halaman undangan
          tamu tidak memuat komponen ini. Atribusi lengkap:{" "}
          <a className="underline" href="/licenses/NOTICE.txt">
            NOTICE.txt
          </a>
          .
        </p>
        <Table items={ML} />
      </>
    ),
  },
  {
    id: "font",
    title: "Font",
    body: (
      <>
        <p>
          Semua font berlisensi SIL Open Font License 1.1, diambil dari repositori resmi Google
          Fonts lalu dipangkas (subset) agar ringan.
        </p>
        <Table
          items={FONTS.map(([name, dir, file]) => ({
            name,
            license: "OFL-1.1",
            source: `https://github.com/google/fonts/tree/main/ofl/${dir}`,
            text: `/licenses/fonts/${file}-OFL.txt`,
          }))}
        />
      </>
    ),
  },
  {
    id: "library",
    title: "Library di browser",
    body: (
      <Table
        items={LIBS.map(([name, license, source]) => ({
          name,
          license,
          source,
          text: `/licenses/npm/${LIB_FILE[name]}.txt`,
        }))}
      />
    ),
  },
  {
    id: "server",
    title: "Hanya di server",
    body: (
      <p>
        Komponen berikut berjalan di server dan tidak dikirim ke perangkat pengguna: Prisma
        (Apache-2.0), AWS SDK untuk JavaScript (Apache-2.0), sharp (Apache-2.0), dan FFmpeg lewat
        ffmpeg-static (GPL-3.0-or-later; dipakai sebagai program terpisah untuk mengompres musik).
      </p>
    ),
  },
];

/** Atribusi komponen pihak ketiga (dari footer). */
export default function LisensiPage() {
  return (
    <LegalPage
      title="Lisensi Pihak Ketiga"
      intro={`${business.name} dibangun dengan komponen sumber terbuka berikut. Terima kasih kepada para pembuatnya.`}
      updated="15 November 2026"
      sections={SECTIONS}
      draft={false}
    />
  );
}
