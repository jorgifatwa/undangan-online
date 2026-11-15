"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type FieldValues, type Resolver } from "react-hook-form";

import { prune } from "@/lib/editor/prune";
import { shareInfo } from "@/lib/invitations/share";
import { fromPreviewSchema, parseMessage, type ToPreview } from "@/lib/editor/protocol";
import type { Entitlements } from "@/lib/pricing";
import { SuspendedNotice } from "@/components/dashboard/SuspendedNotice";
import { cn } from "@/lib/utils";
import {
  birthdayDataSchema,
  isSectionEmpty,
  weddingDataSchema,
  type AnyInvitationData,
  type SectionId,
} from "@/schemas";
import type { ThemeManifest } from "@/themes/types";

import { saveInvitation } from "./actions";
import { deleteMediaAction } from "./media-actions";
import { GalleryField } from "./media/GalleryField";
import { MediaContext, type MediaCtx } from "./media/MediaContext";
import { MusicPicker, type LibraryTrack, type UploadedAudio } from "./media/MusicPicker";
import { PhotoDecorPanel } from "./media/PhotoDecorPanel";
import { PhotoField } from "./media/PhotoField";
import { EventsForm } from "./forms/EventsForm";
import { GiftForm, LoveStoryForm, WishlistForm } from "./forms/ListForms";
import { CelebrantForm, CoupleForm } from "./forms/PersonForms";
import { QuoteForm } from "./forms/QuoteForm";
import {
  CeritaForm,
  ClosingForm,
  DecorLangField,
  DressCodeForm,
  LiveStreamForm,
  SalamForm,
} from "./forms/SimpleForms";
import { PreviewFrame } from "./PreviewFrame";
import { SectionManager } from "./SectionManager";
import { GuestbookPanel } from "./GuestbookPanel";
import { PreviewLinkDialog } from "./PreviewLinkDialog";
import { PublishDialog } from "./PublishDialog";
import { ShareDialog } from "./ShareDialog";
import type { PublishState } from "./publish-actions";
import { SlugField, ThemePicker } from "./ThemePicker";

type EventType = "WEDDING" | "BIRTHDAY";

export interface EditorProps {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  /** Ditangguhkan admin (null = tidak). */
  suspended: { reason: string | null } | null;
  /** ISO — terbit pertama. */
  publishedAt: string | null;
  /** ISO — kedaluwarsa link pratinjau yang aktif (null = tidak ada). */
  previewLinkExpiresAt: string | null;
  eventType: EventType;
  /** Status pembelian tema undangan ini (harga per tema, per undangan). */
  purchase: { purchased: boolean; themeCredit: number; ownedThemeIds: string[] };
  /** Hak pakai dari server (termasuk add-on). */
  entitlements: Entitlements;
  themeId: string;
  variantId: string | null;
  /** ISO — dasar konkurensi optimis. */
  updatedAt: string;
  data: Record<string, unknown>;
  title: string;
  /** Template pesan WhatsApp tersimpan (null = bawaan). */
  shareTemplate: string | null;
  themes: ThemeManifest[];
  /** Koleksi musik bawaan (tabel MusicTrack aktif). */
  library: LibraryTrack[];
  /** Musik yang pernah diunggah untuk undangan ini (termasuk yang masih diproses). */
  uploadedAudio: UploadedAudio[];
}

type SaveState =
  | { kind: "saved" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "invalid"; count: number }
  | { kind: "error"; message: string }
  | { kind: "conflict" };

/** Cadangan lokal: isi form (termasuk yang belum valid) + tema, per undangan. */
interface LocalDraft {
  v: 1;
  savedAt: number;
  themeId: string;
  variantId: string | null;
  values: FieldValues;
}
const draftKey = (id: string) => `undangku:draf:${id}`;
function readDraft(id: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    const d = raw ? (JSON.parse(raw) as LocalDraft) : null;
    return d && d.v === 1 && typeof d.savedAt === "number" && d.values ? d : null;
  } catch {
    return null;
  }
}
function writeDraft(id: string, d: LocalDraft) {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(d));
  } catch {
    /* penyimpanan penuh / mode privat: abaikan */
  }
}
function removeDraft(id: string) {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* abaikan */
  }
}

const SAVE_DELAY = 2000;
const PREVIEW_DELAY = 250;

function StatusPill({ state }: { state: SaveState }) {
  const map = {
    saved: ["Tersimpan ✓", "text-emerald-700"],
    dirty: ["Perubahan belum disimpan…", "text-muted-foreground"],
    saving: ["Menyimpan…", "text-muted-foreground"],
    invalid: ["Belum disimpan — periksa isian bertanda merah", "text-destructive"],
    error: ["Gagal menyimpan", "text-destructive"],
    conflict: ["Diubah di tempat lain", "text-destructive"],
  } as const;
  const [text, cls] = map[state.kind];
  return (
    <span role="status" aria-live="polite" className={cn("text-xs sm:text-sm", cls)}>
      {state.kind === "error" ? state.message : text}
    </span>
  );
}

function Group({
  title,
  open,
  onToggle,
  chips,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  chips: { text: string; tone: "amber" | "neutral" }[];
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-1.5">
          {chips.map((c) => (
            <span
              key={c.text}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                c.tone === "amber"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-neutral-200 text-neutral-700",
              )}
            >
              {c.text}
            </span>
          ))}
          <span aria-hidden className={cn("transition-transform", open && "rotate-180")}>
            ⌄
          </span>
        </span>
      </button>
      {open && <div className="border-t px-4 py-4">{children}</div>}
    </section>
  );
}

export function Editor(p: EditorProps) {
  const schema = p.eventType === "WEDDING" ? weddingDataSchema : birthdayDataSchema;
  // Validasi = schema yang sama dengan server, atas nilai yang sudah dibersihkan.
  const resolver = useMemo<Resolver<FieldValues>>(() => {
    const zr = zodResolver(schema as never) as unknown as Resolver<FieldValues>;
    return (values, ctx, opts) => zr((prune(values) ?? {}) as FieldValues, ctx, opts);
  }, [schema]);
  const form = useForm<FieldValues>({
    defaultValues: p.data,
    resolver,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const [themeId, setThemeId] = useState(p.themeId);
  const [variantId, setVariantId] = useState<string | null>(p.variantId);
  const [slug, setSlug] = useState(p.slug);
  const [state, setState] = useState<SaveState>({ kind: "saved" });
  const [lastValid, setLastValid] = useState<AnyInvitationData>({
    eventType: p.eventType,
    data: p.data,
  } as AnyInvitationData);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [openGroup, setOpenGroup] = useState<string | null>("tema");
  const [restore, setRestore] = useState<LocalDraft | null>(null);
  const [showCover, setShowCover] = useState(false);
  const [publish, setPublish] = useState<PublishState>({
    status: p.status,
    purchased: p.purchase.purchased,
    suspended: !!p.suspended,
    slug: p.slug,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
  });
  const [publishOpen, setPublishOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** Template terakhir disimpan dialog Bagikan (dialog dibuka ulang memakai ini). */
  const [shareTemplate, setShareTemplate] = useState(p.shareTemplate);
  const [previewOpen, setPreviewOpen] = useState(false);
  const live = publish.status === "PUBLISHED" && !publish.suspended;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const base = useRef(p.updatedAt);
  const themeRef = useRef(themeId);
  /** Tema lebih mahal yang sedang dipratinjau (belum dibayar) — tidak disimpan. */
  const previewThemeRef = useRef<string | null>(null);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const variantRef = useRef(variantId);
  const version = useRef(0);
  const saving = useRef(false);
  const timers = useRef<{ save?: number; preview?: number; draft?: number }>({});
  /** File lama (foto diganti/dihapus) yang dihapus dari penyimpanan SETELAH data baru tersimpan. */
  const pendingDeletes = useRef<Set<string>>(new Set());

  const manifest = p.themes.find((t) => t.id === themeId) ?? p.themes[0];
  const features = p.entitlements;
  const sectionsCfg = (useWatch({ control: form.control, name: "sections" }) ?? []) as {
    id: string;
    visible: boolean;
  }[];

  const post = useCallback((msg: ToPreview) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, []);

  /** Kirim data valid terakhir ke iframe (tanpa reload). */
  const pushPreview = useCallback(() => {
    const r = schema.safeParse(prune(form.getValues()));
    if (!r.success) return;
    setLastValid({ eventType: p.eventType, data: r.data } as AnyInvitationData);
    post({
      ns: "undangku",
      type: "update",
      // tema yang belum dibayar hanya DIPRATINJAU (tidak ikut tersimpan)
      themeId: previewThemeRef.current ?? themeRef.current,
      variantId: variantRef.current,
      data: r.data,
    });
  }, [form, p.eventType, post, schema]);

  const save = useCallback(async (): Promise<boolean> => {
    if (saving.current) {
      timers.current.save = window.setTimeout(() => void save(), 400);
      return false;
    }
    const raw = prune(form.getValues());
    const r = schema.safeParse(raw);
    if (!r.success) {
      setState({ kind: "invalid", count: r.error.issues.length });
      void form.trigger();
      return false;
    }
    const v = version.current;
    saving.current = true;
    setState({ kind: "saving" });
    try {
      const res = await saveInvitation(
        p.id,
        { data: raw, themeId: themeRef.current, colorVariant: variantRef.current },
        base.current,
      );
      if (res.ok) {
        base.current = res.updatedAt;
        // Hapus file lama yang tidak lagi dirujuk data yang BARU SAJA tersimpan.
        const savedJson = JSON.stringify(raw);
        const urls = [...pendingDeletes.current].filter(
          (u) => !savedJson.includes(JSON.stringify(u)),
        );
        if (urls.length) {
          urls.forEach((u) => pendingDeletes.current.delete(u));
          void deleteMediaAction(p.id, urls);
        }
        if (version.current === v) {
          setState({ kind: "saved" });
          removeDraft(p.id);
        }
        return true;
      } else if (res.conflict) {
        setState({ kind: "conflict" });
        return false;
      } else {
        setState({ kind: "error", message: res.error });
        for (const [name, message] of Object.entries(res.fieldErrors ?? {}))
          form.setError(name, { message });
        return false;
      }
    } catch {
      setState({ kind: "error", message: "Koneksi terputus — dicoba lagi saat ada perubahan." });
      return false;
    } finally {
      saving.current = false;
    }
  }, [form, p.id, schema]);

  /** Simpan SEKARANG (dipakai sebelum terbit): tunggu simpanan berjalan, lalu simpan. */
  const flushSave = useCallback(async () => {
    window.clearTimeout(timers.current.save);
    while (saving.current) await new Promise((r) => setTimeout(r, 100));
    return save();
  }, [save]);

  /** Setiap perubahan: cadangan lokal, pratinjau (250 ms), simpan (2 s setelah berhenti). */
  const onChange = useCallback(() => {
    version.current++;
    setState((s) => (s.kind === "conflict" ? s : { kind: "dirty" }));
    window.clearTimeout(timers.current.draft);
    timers.current.draft = window.setTimeout(
      () =>
        writeDraft(p.id, {
          v: 1,
          savedAt: Date.now(),
          themeId: themeRef.current,
          variantId: variantRef.current,
          values: form.getValues(),
        }),
      300,
    );
    window.clearTimeout(timers.current.preview);
    timers.current.preview = window.setTimeout(pushPreview, PREVIEW_DELAY);
    window.clearTimeout(timers.current.save);
    timers.current.save = window.setTimeout(() => void save(), SAVE_DELAY);
  }, [form, p.id, pushPreview, save]);

  useEffect(() => {
    const sub = form.watch(() => onChange());
    return () => sub.unsubscribe();
  }, [form, onChange]);

  // Draf lokal yang lebih baru dari data server → tawarkan pemulihan.
  useEffect(() => {
    const d = readDraft(p.id);
    if (!d) return;
    const differs =
      JSON.stringify(prune(d.values)) !== JSON.stringify(prune(p.data)) ||
      d.themeId !== p.themeId ||
      d.variantId !== p.variantId;
    if (d.savedAt > Date.parse(p.updatedAt) && differs) setRestore(d);
    else removeDraft(p.id);
  }, [p.id, p.data, p.themeId, p.variantId, p.updatedAt]);

  // Iframe siap → kirim keadaan terkini (bisa saja sudah berubah sebelum iframe selesai dimuat).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = parseMessage(fromPreviewSchema, e, iframeRef.current?.contentWindow ?? null);
      if (msg?.type === "ready") pushPreview();
      // topi pesta digeser di pratinjau → simpan sebagai posisi manual (persen relatif foto)
      if (msg?.type === "hat") {
        const key = msg.section === "cover" ? "photoDecor.coverHat" : "photoDecor.heroHat";
        const cur = (form.getValues(key as never) ?? {}) as { show?: boolean };
        form.setValue(
          key as never,
          { show: cur.show ?? true, ...msg.pos, src: "manual" } as never,
          {
            shouldDirty: true,
          },
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushPreview, form]);

  // Peringatan meninggalkan halaman bila ada perubahan belum tersimpan.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.kind !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.kind]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      window.clearTimeout(t.save);
      window.clearTimeout(t.preview);
      window.clearTimeout(t.draft);
    };
  }, []);

  const mediaCtx = useMemo<MediaCtx>(
    () => ({
      invitationId: p.id,
      galleryLimit: features.galleryLimit,
      musicLimit: features.customMusicTracks,
      releaseUrl: (url) => pendingDeletes.current.add(url),
      saveSoon: () => {
        window.clearTimeout(timers.current.save);
        timers.current.save = window.setTimeout(() => void save(), 300);
      },
    }),
    [p.id, features.galleryLimit, features.customMusicTracks, save],
  );

  const previewTheme = (id: string | null) => {
    previewThemeRef.current = id;
    setPreviewThemeId(id);
    pushPreview();
  };

  const changeTheme = (id: string) => {
    previewThemeRef.current = null;
    setPreviewThemeId(null);
    themeRef.current = id;
    setThemeId(id);
    const m = p.themes.find((t) => t.id === id);
    const v = m?.variants.some((x) => x.id === variantRef.current)
      ? variantRef.current
      : (m?.variants[0].id ?? null);
    variantRef.current = v;
    setVariantId(v);
    onChange();
  };
  const changeVariant = (id: string) => {
    variantRef.current = id;
    setVariantId(id);
    onChange();
  };

  const toggleGroup = (key: string, section?: SectionId) => {
    const next = openGroup === key ? null : key;
    setOpenGroup(next);
    if (next && section) post({ ns: "undangku", type: "focus", section });
  };

  const chips = (section?: SectionId) => {
    const out: { text: string; tone: "amber" | "neutral" }[] = [];
    if (!section) return out;
    if (!manifest.sections.includes(section))
      out.push({ text: "tidak tampil di tema ini", tone: "neutral" });
    else if (isSectionEmpty(section, lastValid)) out.push({ text: "belum diisi", tone: "amber" });
    return out;
  };

  const wedding = p.eventType === "WEDDING";
  const groups: {
    key: string;
    title: string;
    /** Section yang diwakili (label "belum diisi"/"tidak tampil") & tujuan gulir pratinjau. */
    section?: SectionId;
    /** Tujuan gulir pratinjau bila berbeda dari section. */
    focus?: SectionId;
    body: React.ReactNode;
  }[] = [
    {
      key: "tema",
      title: "Tema, warna & alamat",
      body: (
        <div className="space-y-6">
          <SlugField
            id={p.id}
            slug={slug}
            onSaved={(s, updatedAt) => {
              setSlug(s);
              setPublish((x) => ({ ...x, slug: s, updatedAt }));
              base.current = updatedAt;
            }}
          />
          <ThemePicker
            themes={p.themes}
            themeId={themeId}
            variantId={variantId}
            purchase={{ ...p.purchase, purchased: publish.purchased }}
            previewThemeId={previewThemeId}
            onPreviewTheme={previewTheme}
            onTheme={changeTheme}
            onVariant={changeVariant}
          />
          {!wedding && manifest.editorFields?.includes("decorLanguage") && <DecorLangField />}
        </div>
      ),
    },
    {
      key: "urutan",
      title: "Urutan & tampilan section",
      body: (
        <SectionManager
          eventType={p.eventType}
          manifest={manifest}
          features={features}
          invitation={lastValid}
          config={sectionsCfg}
          onChange={(next) => form.setValue("sections", next, { shouldDirty: true })}
        />
      ),
    },
    {
      key: "profil",
      section: "profil",
      title: wedding ? "Mempelai" : "Yang berulang tahun",
      body: wedding ? <CoupleForm /> : <CelebrantForm />,
    },
    {
      key: "foto",
      focus: "profil",
      title: wedding ? "Foto sampul, photo strip & penutup" : "Foto",
      body: wedding ? (
        <div className="space-y-5">
          <PhotoField
            name="photos.cover"
            slot="cover"
            label="Foto sampul (cover)"
            aspect={4 / 5}
            hint="Tampil di cover."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <PhotoField
                key={i}
                name={`photos.strip.${i}`}
                slot="strip"
                label={`Photo strip ${i + 1}`}
                aspect={4 / 3}
              />
            ))}
          </div>
          <PhotoField
            name="photos.closing"
            slot="closing"
            label="Foto penutup"
            aspect={1}
            hint="Polaroid di bagian penutup."
          />
        </div>
      ) : (
        <div className="space-y-5">
          <PhotoField
            name="celebrant.photo"
            slot="celebrant"
            label="Foto yang berulang tahun"
            aspect={4 / 5}
          />
          {manifest.editorFields?.includes("childPhoto") && (
            <PhotoField
              name="celebrant.childPhoto"
              slot="child"
              label="Foto masa kecil (cover & pembuka)"
              aspect={4 / 5}
              hint="Unggah foto tanpa latar (PNG) untuk efek stiker."
            />
          )}
          {manifest.editorFields?.includes("photoDecor") && <PhotoDecorPanel invitationId={p.id} />}
        </div>
      ),
    },
    {
      // Teks salam/pembuka juga dipakai di kartu mempelai & cover tema (bukan hanya
      // section "salam"), jadi tidak diberi label "tidak tampil di tema ini".
      key: "salam",
      focus: "profil",
      title: "Salam & pembuka",
      body: <SalamForm eventType={p.eventType} />,
    },
    {
      key: "ayat",
      section: "ayat",
      title: "Ayat / kutipan",
      body: <QuoteForm eventType={p.eventType} />,
    },
    {
      key: "acara",
      section: "acara",
      title: "Acara",
      body: <EventsForm defaultName={wedding ? "Resepsi" : "Pesta Ulang Tahun"} />,
    },
    ...(!wedding
      ? [
          {
            key: "cerita",
            section: "cerita" as const,
            title: "Cerita ulang tahun",
            body: <CeritaForm />,
          },
        ]
      : []),
    ...(wedding
      ? [
          {
            key: "loveStory",
            section: "loveStory" as const,
            title: "Love story",
            body: <LoveStoryForm />,
          },
        ]
      : []),
    ...(manifest.editorFields?.includes("countdownStrip")
      ? [
          {
            key: "stripFoto",
            section: "hitungMundur" as const,
            title: "Strip foto “See you on” (3 foto)",
            body: (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  Tiga foto di strip photobooth miring di samping hitung mundur. Terpisah dari
                  Galeri foto. Kosongkan bila tidak ingin ada strip (di pratinjau tampil penanda
                  &ldquo;Belum ada foto&rdquo;, tamu tidak melihatnya).
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <PhotoField
                      key={i}
                      name={`stripPhotos.${i}`}
                      slot="strip"
                      label={`Foto ${i + 1}`}
                      aspect={3 / 4}
                    />
                  ))}
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "galeri",
      section: "galeri",
      title: manifest.editorFields?.includes("countdownStrip")
        ? "Galeri foto (Photo Booth)"
        : "Galeri foto",
      body: <GalleryField />,
    },
    {
      key: "amplop",
      section: "amplop",
      title: wedding ? "Amplop digital & hadiah" : "Wishlist & hadiah",
      body: (
        <div className="space-y-6">
          {!wedding && <WishlistForm />}
          <GiftForm featureNote="Amplop digital & hadiah tampil di halaman tamu setelah undangan diterbitkan (tema sudah dibeli). Di link pratinjau, bagian ini disembunyikan." />
        </div>
      ),
    },
    { key: "dressCode", section: "dressCode", title: "Dress code", body: <DressCodeForm /> },
    { key: "liveStream", section: "liveStream", title: "Live streaming", body: <LiveStreamForm /> },
    {
      key: "penutup",
      section: "penutup",
      title: "Penutup",
      body: wedding ? (
        <ClosingForm eventType={p.eventType} />
      ) : (
        // foto penutup tampil di bagian penutup → isiannya di grup yang sama
        <div className="space-y-5">
          <ClosingForm eventType={p.eventType} />
          <PhotoField
            name="closingPhoto"
            slot="closing"
            label="Foto penutup"
            aspect={1}
            hint="Tampil di bagian penutup undangan."
          />
        </div>
      ),
    },
    {
      key: "bukutamu",
      title: "RSVP & ucapan tamu",
      body: <GuestbookPanel invitationId={p.id} />,
    },
    {
      key: "musik",
      title: "Musik",
      body: (
        <div className="space-y-5">
          {!wedding && manifest.editorFields?.includes("musicPhoto") && (
            <PhotoField
              name="musicPhoto"
              slot="musicCover"
              label="Foto pemutar musik"
              aspect={1}
              hint="Tampil di kartu pemutar musik, terpisah dari foto lain."
            />
          )}
          <MusicPicker
            library={p.library}
            themeDefault={manifest.defaultMusic}
            uploaded={p.uploadedAudio}
          />
        </div>
      ),
    },
  ];

  return (
    <FormProvider {...form}>
      <MediaContext.Provider value={mediaCtx}>
        <div className="flex h-dvh flex-col bg-neutral-50">
          <header className="bg-background flex h-14 shrink-0 items-center gap-3 border-b px-3 sm:px-4">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm"
              aria-label="Kembali ke dashboard"
            >
              ←
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.title}</p>
              <StatusPill state={state} />
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !showCover;
                setShowCover(next);
                post({ ns: "undangku", type: "cover", show: next });
              }}
              className="hover:bg-muted hidden rounded-md border px-3 py-1.5 text-sm sm:block"
            >
              {showCover ? "Lihat isi" : "Lihat cover"}
            </button>
            <Link
              href={`/dashboard/undangan/${p.id}/pratinjau`}
              target="_blank"
              className="hover:bg-muted hidden rounded-md border px-3 py-1.5 text-sm sm:block"
            >
              Pratinjau penuh
            </Link>
            {!p.suspended && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                data-testid="open-preview-link"
                className="hover:bg-muted rounded-md border px-2.5 py-1.5 text-sm sm:px-3"
              >
                <span className="sm:hidden">Pratinjau</span>
                <span className="hidden sm:inline">Bagikan pratinjau</span>
              </button>
            )}
            {live && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="rounded-md bg-[#1f9d55] px-3 py-1.5 text-sm font-medium text-white"
              >
                Bagikan
              </button>
            )}
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                publish.suspended
                  ? "border border-red-300 text-red-800"
                  : live
                    ? "border border-emerald-600 text-emerald-700"
                    : "bg-primary text-primary-foreground",
              )}
            >
              {publish.suspended ? "Ditangguhkan" : live ? "Terbit ✓" : "Terbitkan"}
            </button>
          </header>
          {publishOpen && (
            <PublishDialog
              id={p.id}
              state={publish}
              flushSave={flushSave}
              onState={(st) => {
                setPublish(st);
                base.current = st.updatedAt;
              }}
              onShare={() => {
                setPublishOpen(false);
                setShareOpen(true);
              }}
              onClose={() => setPublishOpen(false)}
            />
          )}
          {previewOpen && (
            <PreviewLinkDialog
              id={p.id}
              initialExpiresAt={p.previewLinkExpiresAt}
              flushSave={flushSave}
              onClose={() => setPreviewOpen(false)}
            />
          )}
          {p.suspended && (
            <div className="px-3 pt-3 sm:px-4">
              <SuspendedNotice reason={p.suspended.reason} slug={slug} />
            </div>
          )}
          {shareOpen && (
            <ShareDialog
              id={p.id}
              slug={slug}
              info={shareInfo(lastValid)}
              initialTemplate={shareTemplate}
              onSaved={setShareTemplate}
              active={live}
              onClose={() => setShareOpen(false)}
            />
          )}

          {state.kind === "conflict" && (
            <div className="flex flex-wrap items-center gap-3 bg-rose-50 px-4 py-2 text-sm text-rose-900">
              Undangan ini diubah di tab atau perangkat lain. Perubahan Anda di sini tersimpan
              sebagai draf di browser.
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="font-semibold underline"
              >
                Muat ulang data terbaru
              </button>
            </div>
          )}
          {restore && (
            <div className="flex flex-wrap items-center gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-950">
              Ada perubahan yang belum tersimpan dari{" "}
              {new Date(restore.savedAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              .
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  themeRef.current = restore.themeId;
                  variantRef.current = restore.variantId;
                  setThemeId(restore.themeId);
                  setVariantId(restore.variantId);
                  form.reset(restore.values, { keepDefaultValues: true });
                  setRestore(null);
                  onChange();
                }}
              >
                Pulihkan perubahan yang belum tersimpan
              </button>
              <button
                type="button"
                className="underline"
                onClick={() => {
                  removeDraft(p.id);
                  setRestore(null);
                }}
              >
                Buang
              </button>
            </div>
          )}

          {/* Tab mobile */}
          <div className="bg-background flex shrink-0 border-b lg:hidden" role="tablist">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium",
                  tab === t ? "border-primary text-primary border-b-2" : "text-muted-foreground",
                )}
              >
                {t === "edit" ? "Edit" : "Pratinjau"}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1">
            <form
              onSubmit={(e) => e.preventDefault()}
              noValidate
              className={cn(
                "min-h-0 w-full overflow-y-auto px-3 py-4 sm:px-5 lg:w-[540px] lg:shrink-0 lg:border-r",
                tab !== "edit" && "hidden lg:block",
              )}
            >
              <div className="mx-auto max-w-xl space-y-3 pb-24">
                {groups.map((g) => (
                  <Group
                    key={g.key}
                    title={g.title}
                    open={openGroup === g.key}
                    onToggle={() => toggleGroup(g.key, g.focus ?? g.section)}
                    chips={chips(g.section)}
                  >
                    {g.body}
                  </Group>
                ))}
              </div>
            </form>
            <section
              aria-label="Pratinjau undangan"
              className={cn("min-h-0 flex-1 p-3", tab !== "preview" && "hidden lg:block")}
            >
              <PreviewFrame
                ref={iframeRef}
                src={`/dashboard/undangan/${p.id}/pratinjau?editor=1`}
                title="Pratinjau undangan"
              />
            </section>
          </div>
        </div>
      </MediaContext.Provider>
    </FormProvider>
  );
}
