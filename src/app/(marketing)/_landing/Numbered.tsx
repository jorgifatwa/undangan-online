import { CalendarCheck, Check, LayoutDashboard, MessageCircle, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { THEME_MANIFESTS } from "@/themes/registry";

import { PhoneThumb } from "./PhoneThumb";

/** Ilustrasi kecil (JSX, tanpa gambar) untuk tiap fitur bernomor. */
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
      icon: Palette,
      title: "Tema beranimasi",
      body: "Cover yang terbuka seperti amplop, ornamen yang bergerak halus, dan pilihan warna. Ganti tema berharga sama selama belum tayang.",
      art: <PhoneThumb theme={THEME_MANIFESTS[0]} sizes="140px" className="w-[130px] rotate-3" />,
    },
    {
      icon: CalendarCheck,
      title: "Tamu, RSVP & ucapan",
      body: "Tempel daftar tamu sekaligus, pantau siapa yang hadir dan jumlah orangnya, sembunyikan ucapan yang tidak pantas.",
      art: <RsvpMock />,
    },
    {
      icon: MessageCircle,
      title: "Kirim lewat WhatsApp",
      body: "Template pesan sopan yang bisa diubah, link personal untuk setiap tamu, dan tanda terkirim otomatis.",
      art: <WaMock />,
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard milik Anda",
      body: "Ubah isi undangan selama masa aktif, unduh daftar tamu & RSVP ke CSV — tanpa menunggu admin.",
      art: <DashMock />,
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
          <span className="font-heading text-gold text-xl tabular-nums">
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
