import { CalendarCheck, Check, MessageCircle, PenLine, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";

/** Ilustrasi kecil (JSX, tanpa gambar) untuk tiap fitur bernomor. */
function StepperMock() {
  const steps = ["Tema & warna", "Mempelai", "Acara", "Kata-kata", "Pelengkap"];
  return (
    <div className="bg-card w-full max-w-[260px] rounded-2xl border p-4 shadow-lg">
      <ol className="space-y-1.5 text-xs">
        {steps.map((t, i) => (
          <li
            key={t}
            className={
              i === 1
                ? "bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium"
                : "text-muted-foreground flex items-center gap-2 px-2 py-1"
            }
          >
            <span className="w-3 tabular-nums">{i + 1}</span>
            <span className="flex-1">{t}</span>
            {i === 0 && <Check className="text-primary size-3.5" />}
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground mt-3 text-[11px]">Tersimpan ✓</p>
    </div>
  );
}

function RsvpMock() {
  return (
    <div className="bg-card w-full max-w-[260px] rounded-2xl border p-4 shadow-lg">
      <p className="text-muted-foreground text-xs">Rekap kehadiran</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["86", "Hadir"],
          ["12", "Ragu"],
          ["9", "Tidak"],
        ].map(([n, l]) => (
          <div key={l} className="bg-sand rounded-xl py-2">
            <p className="font-heading text-xl">{n}</p>
            <p className="text-muted-foreground text-[10px]">{l}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-[11px]">Contoh tampilan · angka ilustrasi</p>
    </div>
  );
}
function WaMock() {
  return (
    <div className="w-full max-w-[260px] space-y-2">
      <div className="ml-auto max-w-[220px] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-3 text-xs leading-relaxed shadow-md">
        Kepada Yth. <strong>Bapak Hadi & Keluarga</strong>, dengan hormat kami mengundang…
        <span className="mt-1 block text-[#1f7a4a] underline">
          {siteConfig.appUrl.replace(/^https?:\/\//, "")}/sekar-raka?to=Hadi
        </span>
      </div>
      <p className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
        <Check className="size-3" /> Ditandai terkirim
      </p>
    </div>
  );
}
function DashMock() {
  return (
    <div className="bg-card w-full max-w-[260px] rounded-2xl border p-4 shadow-lg">
      {["Budi Santoso", "Keluarga Pak RT", "Siti Rahma"].map((n, i) => (
        <div
          key={n}
          className="flex items-center justify-between border-b py-2 text-xs last:border-0"
        >
          <span>{n}</span>
          <Badge variant="secondary" className={i < 2 ? "bg-emerald-100 text-emerald-900" : ""}>
            {i < 2 ? "terkirim" : "belum"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

/** Fitur utama bernomor [01]–[04] (gaya editorial). */
export function Numbered() {
  const ITEMS = [
    {
      icon: PenLine,
      title: "Isi sendiri, lihat langsung",
      body: "Form bertahap dengan pratinjau HP di sampingnya. Tersimpan setiap pindah langkah — bisa dilanjutkan kapan saja.",
      art: <StepperMock />,
    },
    {
      icon: Users,
      title: "Daftar tamu & link personal",
      body: "Tempel daftar tamu sekaligus, kelompokkan per grup. Setiap tamu mendapat link dengan namanya sendiri.",
      art: <DashMock />,
    },
    {
      icon: MessageCircle,
      title: "Kirim lewat WhatsApp",
      body: "Template pesan sopan yang bisa diubah, kirim per tamu atau ke grup, dan tanda terkirim otomatis.",
      art: <WaMock />,
    },
    {
      icon: CalendarCheck,
      title: "Pantau kehadiran & ucapan",
      body: "Rekap hadir, ragu, dan jumlah orang; sembunyikan ucapan yang tidak pantas; unduh semuanya ke CSV.",
      art: <RsvpMock />,
    },
  ];
  return (
    <ol className="mt-12 divide-y border-y">
      {ITEMS.map((it, i) => (
        <li
          key={it.title}
          className="group grid items-center gap-6 py-10 md:grid-cols-[90px_1fr_300px]"
          data-reveal
        >
          <span className="font-heading text-gold-ink text-xl tabular-nums">
            [{String(i + 1).padStart(2, "0")}]
          </span>
          <div>
            <h3 className="font-heading flex items-center gap-3 text-3xl tracking-tight sm:text-4xl">
              {it.title}
              <it.icon className="text-primary size-6 opacity-0 transition-opacity group-hover:opacity-100" />
            </h3>
            <p className="text-muted-foreground mt-3 max-w-xl leading-relaxed">{it.body}</p>
          </div>
          <div className="flex justify-start md:justify-end">{it.art}</div>
        </li>
      ))}
    </ol>
  );
}
