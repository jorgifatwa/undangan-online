"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ExternalLink,
  ChevronRight,
  CircleDot,
  ListOrdered,
  Save,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type FieldValues, type Resolver } from "react-hook-form";

import { prune } from "@/lib/editor/prune";
import { shareInfo } from "@/lib/invitations/share";
import { fromPreviewSchema, parseMessage, type ToPreview } from "@/lib/editor/protocol";
import type { Entitlements } from "@/lib/pricing";
import { LogoMark } from "@/components/brand/Logo";
import { SuspendedNotice } from "@/components/dashboard/SuspendedNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  birthdayDataSchema,
  isSectionEmpty,
  weddingDataSchema,
  type AnyInvitationData,
  type SectionId,
} from "@/schemas";
import type { ThemeManifest } from "@/themes/types";
import { defaultOrderFor } from "@/schemas/sections";

import { saveInvitation, type SaveResult } from "./actions";
import { deleteMediaAction } from "./media-actions";
import { GalleryField } from "./media/GalleryField";
import { MediaContext, type MediaCtx } from "./media/MediaContext";
import { MusicPicker, type LibraryTrack, type UploadedAudio } from "./media/MusicPicker";
import { PhotoDecorPanel, StickerTip } from "./media/PhotoDecorPanel";
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
  VenueArtField,
} from "./forms/SimpleForms";
import { PreviewFrame } from "./PreviewFrame";
import { effectiveOrder, SectionManager } from "./SectionManager";
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
  /**
   * admin    : editor lengkap (dashboard).
   * claim    : pembeli mengisi lewat link khusus — form BERTAHAP, simpan tiap pindah
   *            langkah, tanpa tombol admin; langkah terakhir = `finalStep`.
   * customer : pembeli setelah tayang (/akun) — tema terkunci, tanpa tombol admin.
   * local    : pemesanan website sebelum bayar — sama dengan claim, tapi data
   *            hanya di browser (persist) dan tanpa unggah foto/musik.
   */
  mode?: "admin" | "claim" | "customer" | "local";
  /**
   * Penyimpan pengganti server action (mode local: form pemesanan website yang
   * hanya disimpan di browser sampai dibayar).
   */
  persist?: (payload: {
    data: unknown;
    themeId: string;
    colorVariant: string | null;
  }) => Promise<SaveResult>;
  /** Diisi = unggah foto/musik dimatikan dengan pesan ini. */
  uploadsDisabled?: string;
  /** URL pratinjau pemilik (bawaan: rute dashboard). */
  previewBase?: string;
  /** Tujuan tombol ← (null = tanpa tombol). */
  backHref?: string | null;
  /** URL undangan tayang (mode customer) untuk tombol "Lihat undangan". */
  liveUrl?: string | null;
  /** Mode claim: langkah awal & penyimpan posisi langkah. */
  steps?: { initial: number; onStep: (index: number) => void };
  /** Mode claim: isi langkah terakhir (konfirmasi). */
  finalStep?: (api: { flushSave: () => Promise<boolean> }) => React.ReactNode;
  /** Label langkah terakhir (bawaan "Konfirmasi"). */
  finalStepTitle?: string;
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
  visibility,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  chips: { text: string; tone: "amber" | "neutral" }[];
  /** Sakelar tampil/sembunyi section (sama dengan grup "Urutan & tampilan section"). */
  visibility?: { visible: boolean; onChange: (v: boolean) => void };
  children: React.ReactNode;
}) {
  return (
    <section
      className="bg-card rounded-xl border shadow-xs transition-shadow data-[group-open]:shadow-md"
      data-group-open={open || undefined}
    >
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
      {open && (
        <div className="border-t px-4 py-4">
          {visibility && (
            <label
              className="bg-muted/60 mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
              data-testid="section-visibility"
            >
              <span>
                Tampilkan bagian ini di undangan
                {!visibility.visible && (
                  <span className="text-muted-foreground block text-xs">
                    Disembunyikan — tamu tidak melihat bagian ini.
                  </span>
                )}
              </span>
              <Switch
                checked={visibility.visible}
                onChange={(e) => visibility.onChange(e.target.checked)}
              />
            </label>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

export function Editor(p: EditorProps) {
  const mode = p.mode ?? "admin";
  const isAdmin = mode === "admin";
  const previewBase = p.previewBase ?? `/dashboard/undangan/${p.id}/pratinjau`;
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
      const payload = { data: raw, themeId: themeRef.current, colorVariant: variantRef.current };
      const res = p.persist
        ? await p.persist(payload)
        : await saveInvitation(p.id, payload, base.current);
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
  }, [form, p, schema]);

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
      uploadsDisabled: p.uploadsDisabled,
    }),
    [p.id, features.galleryLimit, features.customMusicTracks, save, p.uploadsDisabled],
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

  // Grup yang baru dibuka digulir halus ke atas panel isian (panel ini saja,
  // bukan halaman) — sejalan dengan gulir pratinjau. Tidak saat halaman dimuat.
  const formRef = useRef<HTMLFormElement>(null);
  const groupScrollArmed = useRef(false);
  useEffect(() => {
    if (!groupScrollArmed.current || !openGroup) return;
    const box = formRef.current;
    const el = box?.querySelector<HTMLElement>("[data-group-open]");
    if (!box || !el) return;
    const top =
      box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 12;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  }, [openGroup]);

  const toggleGroup = (key: string, section?: SectionId) => {
    groupScrollArmed.current = true;
    const next = openGroup === key ? null : key;
    setOpenGroup(next);
    if (next && section)
      post({
        ns: "undangku",
        type: "focus",
        section,
        // urutan tema; section yang tidak ada di urutan bawaan → urutan manifest tema
        order: ((o) => (o.includes(section) ? o : [...manifest.sections]))(
          defaultOrderFor(p.eventType, manifest.sectionOrder),
        ),
      });
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
  // Foto pernikahan umum: tampilkan isian yang dipakai tema, plus isian yang
  // terlanjur berisi foto (agar bisa dihapus) dengan keterangan "tidak tampil".
  const photosVal = useWatch({ control: form.control, name: "photos" }) as
    | {
        cover?: { url?: string };
        strip?: ({ url?: string } | undefined)[];
        closing?: { url?: string };
      }
    | undefined;
  const usedPhotos: readonly ("cover" | "strip" | "closing" | "couple")[] =
    manifest.weddingPhotos ?? ["cover", "strip", "closing", "couple"];
  const photoShown = {
    cover: usedPhotos.includes("cover") || !!photosVal?.cover?.url,
    strip: usedPhotos.includes("strip") || !!photosVal?.strip?.some((x) => x?.url),
    closing: usedPhotos.includes("closing") || !!photosVal?.closing?.url,
  };
  const coupleVal = useWatch({ control: form.control, name: ["bride.photo", "groom.photo"] }) as (
    { url?: string } | undefined
  )[];
  /** Foto mempelai: tampil, "unused" (terlanjur diunggah, tema tidak memakai), atau sembunyi. */
  const couplePhoto = (["bride", "groom"] as const).reduce(
    (acc, who, i) => ({
      ...acc,
      [who]: usedPhotos.includes("couple") ? "show" : coupleVal?.[i]?.url ? "unused" : "hide",
    }),
    {} as Record<"bride" | "groom", "show" | "unused" | "hide">,
  );
  const photoUnused = (k: "cover" | "strip" | "closing") =>
    !usedPhotos.includes(k) && (
      <p className="text-muted-foreground rounded-md bg-neutral-100 px-2 py-1 text-xs">
        Tidak tampil di tema ini. Foto tetap tersimpan bila pindah tema — atau hapus bila tidak
        dipakai.
      </p>
    );
  // Photo strip (section mempelai) & foto penutup (section penutup) — isiannya
  // di grup section tempat foto itu tampil, sesuai urutan pratinjau.
  const weddingStrip = (
    <>
      {photoShown.strip && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <PhotoField
                key={i}
                name={`photos.strip.${i}`}
                slot="strip"
                label={`Photo strip ${i + 1}`}
                aspect={4 / 3}
                stacked
              />
            ))}
          </div>
          {photoUnused("strip")}
        </div>
      )}
    </>
  );
  const weddingClosing = (
    <>
      {photoShown.closing && (
        <div className="space-y-1.5">
          <PhotoField
            name="photos.closing"
            slot="closing"
            label="Foto penutup"
            aspect={1}
            hint="Polaroid di bagian penutup."
          />
          {photoUnused("closing")}
        </div>
      )}
    </>
  );
  /**
   * Tujuan gulir pratinjau tiap grup: tujuan khusus tema (manifest.editorFocus)
   * → focus/section grup → bawaan per grup; yang tidak didukung tema dilewati.
   */
  const FOCUS_DEFAULT: Record<string, SectionId[]> = {
    tema: ["cover"],
    urutan: ["cover"],
    salam: ["salam", "profil"],
    musik: ["salam", "ayat", "profil"],
    bukutamu: ["rsvp", "ucapan"],
  };
  /**
   * Sakelar "Tampilkan bagian ini" per grup — data yang SAMA dengan grup
   * "Urutan & tampilan section" (data.sections). Urutan lengkap dibentuk dulu
   * agar menyembunyikan satu section tidak mengubah urutan section lain.
   * Section terkunci & yang tidak didukung tema tidak diberi sakelar.
   */
  const visibilityOf = (g: { key: string; section?: SectionId }) => {
    const ids = (
      g.key === "bukutamu" ? (["rsvp", "ucapan"] as SectionId[]) : g.section ? [g.section] : []
    )
      .filter((id) => manifest.sections.includes(id))
      .filter((id) => !(manifest.lockedSections ?? []).includes(id));
    if (!ids.length) return undefined;
    const full = effectiveOrder(
      p.eventType,
      sectionsCfg,
      manifest.lockedSections ?? [],
      manifest.sectionOrder,
    );
    const visible = ids.every((id) => full.find((r) => r.id === id)?.visible !== false);
    return {
      visible,
      onChange: (v: boolean) =>
        form.setValue(
          "sections",
          full.map((r) => (ids.includes(r.id) ? { ...r, visible: v } : r)),
          { shouldDirty: true },
        ),
    };
  };
  const focusOf = (g: {
    key: string;
    focus?: SectionId;
    section?: SectionId;
  }): SectionId | undefined => {
    const own = manifest.editorFocus?.[g.key];
    if (own) return own;
    const list = [
      ...(g.focus ? [g.focus] : []),
      ...(g.section ? [g.section] : []),
      ...(FOCUS_DEFAULT[g.key] ?? []),
    ];
    return list.find((id) => id === "cover" || manifest.sections.includes(id)) ?? list[0];
  };
  const groups: {
    key: string;
    title: string;
    /** Section yang diwakili (label "belum diisi"/"tidak tampil") & tujuan gulir pratinjau. */
    section?: SectionId;
    /** Tujuan gulir pratinjau bila berbeda dari section. */
    focus?: SectionId;
    /** Grup tidak relevan untuk tema ini → tidak ditampilkan. */
    hidden?: boolean;
    /** Label tambahan di judul grup. */
    extraChips?: { text: string; tone: "amber" | "neutral" }[];
    body: React.ReactNode;
  }[] = [
    {
      key: "tema",
      title: "Tema, warna & alamat",
      body: (
        <div className="space-y-6">
          {(mode === "admin" || mode === "customer") && (
            <SlugField
              id={p.id}
              slug={slug}
              onSaved={(s, updatedAt) => {
                setSlug(s);
                setPublish((x) => ({ ...x, slug: s, updatedAt }));
                base.current = updatedAt;
              }}
            />
          )}
          {mode === "claim" && (
            <p className="text-muted-foreground rounded-lg bg-neutral-100 px-3 py-2 text-xs">
              Boleh ganti ke tema lain dengan harga yang sama selama undangan belum dikonfirmasi.
              Setelah tayang, tema terkunci.
            </p>
          )}
          {mode === "local" && (
            <p className="text-muted-foreground rounded-lg bg-neutral-100 px-3 py-2 text-xs">
              Bebas pilih tema &amp; warna — harga mengikuti tema yang dipilih. Isian tersimpan di
              browser ini sampai pembayaran selesai.
            </p>
          )}
          {mode === "customer" && (
            <p className="text-muted-foreground rounded-lg bg-neutral-100 px-3 py-2 text-xs">
              Tema terkunci setelah undangan tayang. Warna masih bisa diganti.
            </p>
          )}
          <ThemePicker
            mode={mode}
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
      body: wedding ? (
        <div className="space-y-6">
          <CoupleForm photo={couplePhoto} />
          {photoShown.strip && weddingStrip}
        </div>
      ) : (
        <CelebrantForm />
      ),
    },
    {
      key: "foto",
      focus: wedding ? "cover" : "profil",
      hidden: wedding && !photoShown.cover,
      extraChips:
        wedding && !usedPhotos.includes("cover")
          ? [{ text: "tidak tampil di tema ini", tone: "neutral" as const }]
          : [],
      title: wedding ? "Foto sampul (cover)" : "Foto",
      body: wedding ? (
        <div className="space-y-5">
          {photoShown.cover && (
            <div className="space-y-1.5">
              <PhotoField
                name="photos.cover"
                slot="cover"
                label="Foto sampul (cover)"
                aspect={4 / 5}
                hint="Tampil di cover."
              />
              {photoUnused("cover")}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {manifest.editorFields?.includes("childPhoto") && (
            <>
              <PhotoField
                name="celebrant.childPhoto"
                slot="child"
                label="Foto cover & pembuka"
                aspect={4 / 5}
                hint="Tampil di cover & bagian pembuka (dengan topi pesta)."
              />
              <StickerTip />
            </>
          )}
          {manifest.editorFields?.includes("photoDecor") && !p.uploadsDisabled && (
            <PhotoDecorPanel invitationId={p.id} />
          )}
          <PhotoField
            name="celebrant.photo"
            slot="celebrant"
            label={
              manifest.editorFields?.includes("childPhoto")
                ? "Foto profil (bingkai berpita)"
                : "Foto yang berulang tahun"
            }
            aspect={4 / 5}
            hint={
              manifest.editorFields?.includes("childPhoto")
                ? "Tampil di bagian profil, terpisah dari foto cover."
                : undefined
            }
          />
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
      body: (
        <div className="space-y-5">
          {wedding && manifest.editorFields?.includes("venueArt") && <VenueArtField />}
          <EventsForm defaultName={wedding ? "Resepsi" : "Pesta Ulang Tahun"} />
        </div>
      ),
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
                      stacked
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
        <div className="space-y-5">
          <ClosingForm eventType={p.eventType} />
          {photoShown.closing && weddingClosing}
        </div>
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
      // pembeli melihat ucapan & RSVP di dashboard akunnya (tab terpisah)
      hidden: !isAdmin,
      body: <GuestbookPanel invitationId={p.id} />,
    },
  ];
  // Pernikahan: foto sampul tampil di cover (paling awal di pratinjau) → grupnya
  // sebelum Mempelai. Grup yang tidak relevan untuk tema disembunyikan.
  const shownGroups = (() => {
    const list = groups.filter((g) => !g.hidden);
    if (!wedding) return list;
    const i = list.findIndex((g) => g.key === "foto");
    const j = list.findIndex((g) => g.key === "profil");
    if (i < 0 || j < 0 || i < j) return list;
    const [foto] = list.splice(i, 1);
    list.splice(j, 0, foto);
    return list;
  })();

  // ── Mode claim/local: form bertahap — ±6 langkah, tiap langkah berisi
  //    beberapa grup; langkah terakhir = finalStep (konfirmasi / pesan & bayar) ──
  const stepped = mode === "claim" || mode === "local" || mode === "customer";
  const cardTitle =
    mode === "claim" ? "Isi undangan" : mode === "local" ? "Pesan undangan" : "Ubah undangan";
  const stepDefs = [
    { key: "tema", title: "Tema & warna", hint: "Pilih tema dan warna favorit.", groups: ["tema"] },
    {
      key: "profil",
      title: wedding ? "Mempelai" : "Yang berulang tahun",
      hint: wedding ? "Nama dan foto kedua mempelai." : "Nama, usia, dan foto.",
      groups: ["foto", "profil"],
    },
    {
      key: "acara",
      title: "Acara",
      hint: "Waktu, lokasi, dress code, dan siaran langsung.",
      groups: ["acara", "dressCode", "liveStream"],
    },
    {
      key: "kata",
      title: "Kata-kata",
      hint: "Salam pembuka, kutipan, cerita, dan penutup.",
      groups: ["salam", "ayat", "cerita", "loveStory", "penutup"],
    },
    {
      key: "pelengkap",
      title: "Pelengkap",
      hint: "Galeri, musik, hadiah, dan urutan bagian undangan.",
      groups: ["galeri", "stripFoto", "musik", "amplop", "urutan"],
    },
  ]
    .map((d) => ({ ...d, items: shownGroups.filter((g) => d.groups.includes(g.key)) }))
    .filter((d) => d.items.length > 0);
  const finalTitle = p.finalStepTitle ?? "Konfirmasi";
  const stepTitles = [...stepDefs.map((d) => d.title), ...(p.finalStep ? [finalTitle] : [])];
  const stepCount = stepTitles.length;
  const [step, setStep] = useState(() =>
    Math.min(Math.max(0, p.steps?.initial ?? 0), Math.max(0, stepCount - 1)),
  );
  const [stepBusy, setStepBusy] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [stepsSheet, setStepsSheet] = useState(false);
  const [previewSheet, setPreviewSheet] = useState(false);
  /** Layar lebar (≥1280px): pratinjau HP tampil di samping kartu form. */
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const isFinal = stepped && !!p.finalStep && step >= stepDefs.length;
  const lastFocus = useRef<string | null>(null);
  const focusPreview = (target: SectionId | undefined) => {
    if (!target || lastFocus.current === target) return;
    lastFocus.current = target;
    post({
      ns: "undangku",
      type: "focus",
      section: target,
      order: ((o) => (o.includes(target) ? o : [...manifest.sections]))(
        defaultOrderFor(p.eventType, manifest.sectionOrder),
      ),
    });
  };
  const goStep = async (n: number) => {
    if (stepBusy || n === step || n < 0 || n >= stepCount) return;
    setStepBusy(true);
    setStepError(null);
    setSavedNote(null);
    // simpan SETIAP pindah langkah; isian belum valid → tetap di langkah ini
    const ok = state.kind === "saved" ? true : await flushSave();
    setStepBusy(false);
    if (!ok && schema.safeParse(prune(form.getValues())).success === false) {
      setStepError("Periksa isian bertanda merah sebelum lanjut.");
      return;
    }
    if (!ok) {
      setStepError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
      return;
    }
    setStep(n);
    setStepsSheet(false);
    p.steps?.onStep(n);
    formRef.current?.scrollTo({ top: 0 });
    const first = stepDefs[n]?.items[0];
    if (first) focusPreview(focusOf(first));
  };
  const saveAndClose = async () => {
    setStepError(null);
    const ok = await flushSave();
    if (ok && mode === "customer") {
      window.location.href = p.backHref ?? "/akun";
      return;
    }
    setSavedNote(
      ok
        ? mode === "claim"
          ? "Tersimpan. Lanjutkan kapan saja lewat link khusus ini."
          : "Tersimpan di browser ini. Buka halaman ini lagi untuk melanjutkan."
        : "Belum tersimpan — periksa isian bertanda merah.",
    );
  };

  const banners = (
    <>
      {state.kind === "conflict" && (
        <div className="flex flex-wrap items-center gap-3 bg-rose-50 px-4 py-2 text-sm text-rose-900">
          Undangan ini diubah di tab atau perangkat lain. Perubahan Anda di sini tersimpan sebagai
          draf di browser.
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
    </>
  );

  const previewSrc = `${previewBase}${previewBase.includes("?") ? "&" : "?"}editor=1`;

  if (stepped) {
    const stepList = (
      <ol className="space-y-1" aria-label="Langkah pengisian">
        {stepTitles.map((t, i) => (
          <li key={t}>
            <button
              type="button"
              disabled={stepBusy}
              onClick={() => void goStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                i === step
                  ? "bg-background text-foreground font-medium shadow-sm"
                  : i < step
                    ? "text-foreground hover:bg-background/60"
                    : "text-muted-foreground hover:bg-background/60",
              )}
            >
              <span className="w-4 text-xs tabular-nums">{i + 1}</span>
              <span className="flex-1">{t}</span>
              {i < step ? (
                <Check className="text-primary size-4" aria-label="selesai" />
              ) : i === step ? (
                <CircleDot className="text-gold size-4" aria-hidden />
              ) : null}
            </button>
          </li>
        ))}
      </ol>
    );
    const current = stepDefs[step];
    return (
      <FormProvider {...form}>
        <MediaContext.Provider value={mediaCtx}>
          <div className="bg-sand paper min-h-dvh">
            {banners}
            <div className="mx-auto flex max-w-[1380px] items-start gap-8 p-0 sm:p-5 lg:p-6">
              {/* Kartu form: daftar langkah (kiri) + isian (kanan) */}
              <div className="bg-card flex h-dvh min-w-0 flex-1 overflow-hidden border shadow-[0_30px_80px_-40px_rgb(80_40_20/0.35)] sm:h-[calc(100dvh-2.5rem)] sm:rounded-[28px] lg:h-[calc(100dvh-3rem)]">
                <aside className="bg-muted/70 m-2 hidden w-64 shrink-0 flex-col rounded-[22px] p-5 md:flex">
                  <LogoMark className="size-11" />
                  <h1 className="font-heading mt-6 text-2xl leading-tight">{cardTitle}</h1>
                  {mode !== "local" && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{p.title}</p>
                  )}
                  <div className="mt-6 flex-1">{stepList}</div>
                  {mode === "customer" && p.liveUrl && (
                    <Button asChild variant="outline" size="sm" className="mb-3 justify-start">
                      <a href={p.liveUrl} target="_blank" rel="noreferrer">
                        <ExternalLink /> Lihat undangan
                      </a>
                    </Button>
                  )}
                  <StatusPill state={state} />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                  {/* HP: ringkasan langkah (ketuk → semua langkah) */}
                  <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
                    <Sheet open={stepsSheet} onOpenChange={setStepsSheet}>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-0 flex-1 justify-start"
                        >
                          <ListOrdered />
                          <span className="truncate">
                            Langkah {step + 1} dari {stepCount} · {stepTitles[step]}
                          </span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-72">
                        <SheetHeader>
                          <SheetTitle className="font-heading text-2xl">{cardTitle}</SheetTitle>
                          <SheetDescription>{p.title}</SheetDescription>
                        </SheetHeader>
                        <div className="px-4">{stepList}</div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <form
                    ref={formRef}
                    onSubmit={(e) => e.preventDefault()}
                    noValidate
                    className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8"
                  >
                    <div className="mx-auto max-w-2xl">
                      <p className="text-muted-foreground text-xs tracking-wide">
                        Langkah {step + 1}/{stepCount}
                      </p>
                      <h2 className="font-heading mt-1 text-3xl tracking-tight">
                        {stepTitles[step]}
                      </h2>
                      {current && (
                        <p className="text-muted-foreground mt-1 text-sm">{current.hint}</p>
                      )}
                      <div className="mt-6 space-y-8">
                        {isFinal && p.finalStep?.({ flushSave })}
                        {current?.items.map((g, idx) => {
                          const vis = visibilityOf(g);
                          const tags = [
                            ...(g.extraChips ?? []),
                            ...chips(g.section),
                            ...(vis?.visible === false
                              ? [{ text: "disembunyikan", tone: "neutral" as const }]
                              : []),
                          ];
                          return (
                            <section
                              key={g.key}
                              onFocusCapture={() => focusPreview(focusOf(g))}
                              className="space-y-4"
                              aria-labelledby={`sub-${g.key}`}
                            >
                              {idx > 0 && <Separator />}
                              {current.items.length > 1 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 id={`sub-${g.key}`} className="font-medium">
                                    {g.title}
                                  </h3>
                                  {tags.map((c) => (
                                    <Badge
                                      key={c.text}
                                      variant="secondary"
                                      className={
                                        c.tone === "amber" ? "bg-amber-100 text-amber-900" : ""
                                      }
                                    >
                                      {c.text}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {vis && (
                                <label className="bg-muted/60 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm">
                                  <span>
                                    Tampilkan bagian ini di undangan
                                    {!vis.visible && (
                                      <span className="text-muted-foreground block text-xs">
                                        Disembunyikan — tamu tidak melihat bagian ini.
                                      </span>
                                    )}
                                  </span>
                                  <Switch
                                    checked={vis.visible}
                                    onChange={(e) => vis.onChange(e.target.checked)}
                                  />
                                </label>
                              )}
                              {g.body}
                            </section>
                          );
                        })}
                      </div>
                    </div>
                  </form>

                  <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-8">
                    {!isFinal && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void saveAndClose()}
                      >
                        <Save /> Simpan &amp; tutup
                      </Button>
                    )}
                    {!wide && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewSheet(true)}
                      >
                        <Smartphone /> Lihat pratinjau
                      </Button>
                    )}
                    <span
                      role={stepError ? "alert" : "status"}
                      className={cn(
                        "min-w-0 flex-1 text-xs",
                        stepError ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {stepError ?? savedNote}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={step === 0 || stepBusy}
                      onClick={() => void goStep(step - 1)}
                    >
                      <ChevronLeft /> Kembali
                    </Button>
                    {step < stepCount - 1 && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={stepBusy}
                        onClick={() => void goStep(step + 1)}
                      >
                        {stepBusy ? "Menyimpan…" : "Simpan & lanjut"} <ChevronRight />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pratinjau HP mengambang di samping kartu (layar lebar) */}
              {wide && (
                <section
                  aria-label="Pratinjau undangan"
                  className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-[360px] shrink-0 flex-col xl:flex"
                >
                  <div className="flex items-center justify-between px-2 pb-2 text-xs">
                    <span className="text-muted-foreground tracking-[0.2em] uppercase">
                      Pratinjau
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showCover;
                        setShowCover(next);
                        post({ ns: "undangku", type: "cover", show: next });
                      }}
                      className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                    >
                      {showCover ? "Lihat isi" : "Lihat cover"}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <PreviewFrame ref={iframeRef} src={previewSrc} title="Pratinjau undangan" />
                  </div>
                </section>
              )}
            </div>
          </div>
          {!wide && (
            <Sheet open={previewSheet} onOpenChange={setPreviewSheet}>
              <SheetContent side="right" className="bg-sand w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="font-heading text-xl">Pratinjau</SheetTitle>
                  <SheetDescription>Tampilan undangan di HP tamu.</SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 px-3 pb-4">
                  <PreviewFrame ref={iframeRef} src={previewSrc} title="Pratinjau undangan" />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </MediaContext.Provider>
      </FormProvider>
    );
  }

  return (
    <FormProvider {...form}>
      <MediaContext.Provider value={mediaCtx}>
        <div className="bg-muted/40 flex h-dvh flex-col">
          <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4">
            {p.backHref !== null && (
              <Button asChild variant="ghost" size="icon-sm" aria-label="Kembali">
                <Link href={p.backHref ?? "/dashboard"}>
                  <ChevronLeft />
                </Link>
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.title}</p>
              <StatusPill state={state} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                const next = !showCover;
                setShowCover(next);
                post({ ns: "undangku", type: "cover", show: next });
              }}
            >
              {showCover ? "Lihat isi" : "Lihat cover"}
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={previewBase} target="_blank">
                <ExternalLink /> Pratinjau penuh
              </Link>
            </Button>
            {isAdmin && !p.suspended && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                data-testid="open-preview-link"
              >
                <span className="sm:hidden">Pratinjau</span>
                <span className="hidden sm:inline">Bagikan pratinjau</span>
              </Button>
            )}
            {isAdmin && live && (
              <Button
                size="sm"
                className="bg-[#1f9d55] text-white hover:bg-[#1f9d55]/90"
                onClick={() => setShareOpen(true)}
              >
                Bagikan
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant={publish.suspended ? "destructive" : live ? "outline" : "default"}
                className={live && !publish.suspended ? "border-emerald-600 text-emerald-700" : ""}
                onClick={() => setPublishOpen(true)}
              >
                {publish.suspended ? "Ditangguhkan" : live ? "Terbit ✓" : "Terbitkan"}
              </Button>
            )}
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

          {banners}

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
              ref={formRef}
              onSubmit={(e) => e.preventDefault()}
              noValidate
              className={cn(
                "min-h-0 w-full overflow-y-auto px-3 py-4 sm:px-5 lg:w-[540px] lg:shrink-0 lg:border-r",
                tab !== "edit" && "hidden lg:block",
              )}
            >
              <div className="mx-auto max-w-xl space-y-3 pb-24">
                {shownGroups.map((g) => (
                  <Group
                    key={g.key}
                    title={g.title}
                    open={openGroup === g.key}
                    onToggle={() => toggleGroup(g.key, focusOf(g))}
                    chips={[
                      ...(g.extraChips ?? []),
                      ...chips(g.section),
                      ...(visibilityOf(g)?.visible === false
                        ? [{ text: "disembunyikan", tone: "neutral" as const }]
                        : []),
                    ]}
                    visibility={visibilityOf(g)}
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
              <PreviewFrame ref={iframeRef} src={previewSrc} title="Pratinjau undangan" />
            </section>
          </div>
        </div>
      </MediaContext.Provider>
    </FormProvider>
  );
}
