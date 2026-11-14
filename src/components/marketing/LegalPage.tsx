import { AlertTriangle } from "lucide-react";

import { business } from "@/config/business";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/**
 * Kerangka halaman legal (syarat, privasi). `draft` → kotak peringatan jelas
 * bahwa isi belum ditinjau ahli hukum.
 */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
  draft = true,
}: {
  title: string;
  intro: React.ReactNode;
  updated: string;
  sections: LegalSection[];
  draft?: boolean;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      {draft && (
        <div
          role="note"
          aria-label="Draf"
          data-legal-draft
          className="mb-10 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            <strong>DRAF — belum berlaku.</strong> Isi halaman ini masih rancangan dan{" "}
            <strong>perlu ditinjau ahli hukum</strong> sebelum {business.name} menerima pengguna dan
            pembayaran sungguhan.
          </p>
        </div>
      )}
      <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
        {business.name}
      </p>
      <h1 className="font-heading mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">Terakhir diperbarui: {updated}</p>
      <div className="text-muted-foreground mt-6 leading-relaxed">{intro}</div>

      <nav aria-label="Daftar isi" className="bg-sand mt-8 rounded-2xl border p-5">
        <p className="text-sm font-semibold">Daftar isi</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="hover:text-primary underline-offset-4 hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="font-heading text-2xl">
              {i + 1}. {s.title}
            </h2>
            <div className="legal-body text-foreground/85 mt-3 space-y-3 leading-relaxed">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

/** Blok kontak untuk halaman legal (hanya kontak yang sudah diisi). */
export function LegalContact() {
  const items = [
    business.email && (
      <li key="e">
        Email:{" "}
        <a className="underline" href={`mailto:${business.email}`}>
          {business.email}
        </a>
      </li>
    ),
    business.whatsapp && (
      <li key="w">
        WhatsApp:{" "}
        <a
          className="underline"
          href={`https://wa.me/${business.whatsapp}`}
          target="_blank"
          rel="noopener"
        >
          +{business.whatsapp}
        </a>
      </li>
    ),
    business.city && <li key="c">Kota: {business.city}</li>,
  ].filter(Boolean);
  if (!items.length)
    return (
      <p className="rounded-xl border border-dashed p-3 text-sm">
        Alamat kontak resmi akan dicantumkan di sini sebelum peluncuran.
      </p>
    );
  return <ul className="list-disc space-y-1 pl-5">{items}</ul>;
}
