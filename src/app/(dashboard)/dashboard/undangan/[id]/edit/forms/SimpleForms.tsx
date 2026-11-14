"use client";

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
