"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { cn } from "@/lib/utils";

import { SelectField, StringList, TextField } from "./fields";

export function SalamForm({ eventType }: { eventType: "WEDDING" | "BIRTHDAY" }) {
  return (
    <div className="space-y-3">
      {eventType === "WEDDING" && (
        <SelectField
          name="greeting.style"
          label="Gaya salam"
          options={[
            ["islami", "Islami — basmalah & salam"],
            ["umum", "Umum"],
          ]}
        />
      )}
      <TextField
        name="greeting.openingText"
        label="Teks pembuka"
        rows={3}
        maxLength={800}
        hint="Kosongkan untuk memakai teks bawaan tema."
      />
    </div>
  );
}

export function DressCodeForm() {
  return (
    <div className="space-y-3">
      <TextField name="dressCode.text" label="Keterangan" rows={2} maxLength={300} />
      <StringList name="dressCode.colors" label="Warna" max={8} addLabel="Tambah warna" color />
    </div>
  );
}

export function LiveStreamForm() {
  return (
    <div className="space-y-3">
      <TextField
        name="liveStream.url"
        label="Link siaran"
        type="url"
        placeholder="https://youtube.com/…"
        hint="YouTube, Zoom, Google Meet, atau Instagram."
      />
      <TextField name="liveStream.platform" label="Platform" placeholder="YouTube" maxLength={40} />
      <TextField name="liveStream.note" label="Catatan" rows={2} maxLength={200} />
    </div>
  );
}

export function ClosingForm({ eventType }: { eventType: "WEDDING" | "BIRTHDAY" }) {
  return (
    <div className="space-y-3">
      <TextField
        name="greeting.closingText"
        label="Teks penutup"
        rows={3}
        maxLength={800}
        hint="Kosongkan untuk memakai teks bawaan tema."
      />
      {eventType === "WEDDING" && (
        <>
          <TextField
            name="signature.text"
            label="Salam penutup"
            placeholder="Kami yang berbahagia"
            maxLength={80}
          />
          <StringList
            name="signature.families"
            label="Nama keluarga"
            max={4}
            addLabel="Tambah keluarga"
            placeholder="Keluarga Bapak … & Ibu …"
          />
        </>
      )}
    </div>
  );
}

/** Cerita ulang tahun (section "cerita"). Teks polos; baris kosong = paragraf baru. */
export function CeritaForm() {
  return (
    <div className="space-y-3">
      <TextField
        name="story.title"
        label="Judul"
        placeholder="Birthday Story"
        maxLength={60}
        hint="Kosongkan untuk memakai judul bawaan tema."
      />
      <TextField
        name="story.text"
        label="Cerita"
        rows={8}
        maxLength={3000}
        hint="Pisahkan paragraf dengan baris kosong. Tautan tidak akan dijadikan link."
      />
    </div>
  );
}

/** Bahasa teks dekoratif tema (hanya tema dengan editorFields "decorLanguage"). */
export function DecorLangField() {
  return (
    <SelectField
      name="decorLang"
      label="Bahasa teks dekoratif tema"
      options={[
        ["en", "Inggris — mis. “AYA IS TURNING 19”, “SAVE THE DATE!”"],
        ["id", "Indonesia — mis. “AYA GENAP 19”, “CATAT TANGGALNYA!”"],
      ]}
      hint="Hanya judul hiasan. Form ucapan, tombol, dan pesan untuk tamu tetap berbahasa Indonesia."
    />
  );
}

/** Ikon sederhana untuk kartu pilihan (bukan aset tema). */
const VENUE_ICONS = {
  kota: (
    <svg viewBox="0 0 64 40" className="h-10 w-16" aria-hidden>
      <path d="M4 36h56" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 36V22h8v14M26 36V6h12v30M42 36V16h8v20M50 36V24h6v12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  rumah: (
    <svg viewBox="0 0 64 40" className="h-10 w-16" aria-hidden>
      <path d="M4 36h56" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 36V18L13 10l9 8v18M42 36V18l9-8 9 8v18M22 36V16l5-6 5 4 5-4 5 6v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M28 36v-7a4 4 0 0 1 8 0v7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
} as const;

/** Pilihan ilustrasi bangunan di section acara (tema dengan editorFields "venueArt"). */
export function VenueArtField() {
  const { control, setValue } = useFormContext();
  const value = (useWatch({ control, name: "venueArt" }) as "kota" | "rumah" | undefined) ?? "kota";
  const options = [
    ["kota", "Gedung kota", "Menara & gedung bertingkat"],
    ["rumah", "Rumah", "Rumah besar dengan taman & air mancur"],
  ] as const;
  return (
    <fieldset className="space-y-2" data-testid="venue-art">
      <legend className="text-sm font-medium">Ilustrasi bangunan</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([id, label, sub]) => (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center text-sm transition-colors",
              value === id ? "border-primary bg-primary/5 ring-primary ring-1" : "hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="venueArt"
              value={id}
              className="sr-only"
              checked={value === id}
              onChange={() => setValue("venueArt", id, { shouldDirty: true })}
            />
            <span className="text-muted-foreground">{VENUE_ICONS[id]}</span>
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground text-xs">{sub}</span>
          </label>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Tampil di bawah tanggal pada bagian acara, dengan animasi muncul yang sama.
      </p>
    </fieldset>
  );
}
