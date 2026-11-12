"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ClientUploadError, cropToBlob, preparePhoto, uploadPhoto } from "@/lib/upload/client";
import { cn } from "@/lib/utils";
import type { Photo } from "@/schemas";

import { CropDialog } from "./CropDialog";
import { useMedia } from "./MediaContext";
import { UpgradeNotice } from "./UpgradeNotice";

/**
 * Galeri: pilih banyak foto sekaligus (progres per foto), urutkan dengan
 * drag & drop (sentuh & keyboard), potong opsional per foto. Default langsung
 * dikompres tanpa crop supaya cepat. Batas paket → pesan + tawaran upgrade.
 */
interface QueueItem {
  id: string;
  name: string;
  progress: number;
  error?: string;
}
const CONCURRENCY = 2;
const RATIOS = [
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
];

function Tile({
  photo,
  index,
  onCrop,
  onRemove,
}: {
  photo: Photo;
  index: number;
  onCrop: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.url,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-neutral-100",
        isDragging && "z-10 shadow-xl",
      )}
    >
      <button
        type="button"
        className="block aspect-[3/4] w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Foto ${index + 1}. Geser untuk mengubah urutan`}
        {...attributes}
        {...listeners}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil di editor */}
        <img src={photo.url} alt="" className="h-full w-full object-cover" draggable={false} />
        <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 text-[11px] text-white">
          {index + 1}
        </span>
      </button>
      <div className="flex divide-x border-t bg-white text-[11px]">
        <button type="button" onClick={onCrop} className="hover:bg-muted flex-1 py-1">
          Atur potongan
        </button>
        <button type="button" onClick={onRemove} className="hover:text-destructive flex-1 py-1">
          Hapus
        </button>
      </div>
    </li>
  );
}

export function GalleryField() {
  const media = useMedia();
  const { control, setValue, getValues } = useFormContext();
  const photos = ((useWatch({ control, name: "gallery" }) as Photo[] | undefined) ?? []).filter(
    (p) => p?.url,
  );
  const input = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const current = () => ((getValues("gallery") as Photo[] | undefined) ?? []).filter((p) => p?.url);
  const setGallery = (next: Photo[]) => setValue("gallery", next, { shouldDirty: true });
  const patch = (id: string, p: Partial<QueueItem>) =>
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const addFiles = async (files: File[]) => {
    setLimitMsg(null);
    const limit = media.galleryLimit;
    const inFlight = queue.filter((q) => !q.error && q.progress < 1).length;
    const room = limit === null ? files.length : Math.max(0, limit - current().length - inFlight);
    const accepted = files.slice(0, room);
    if (accepted.length < files.length)
      setLimitMsg(
        room === 0
          ? `Galeri sudah penuh: paket ${media.packageLabel} maksimal ${limit} foto.`
          : `Hanya ${room} dari ${files.length} foto yang diunggah: paket ${media.packageLabel} maksimal ${limit} foto galeri.`,
      );
    const items = accepted.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      progress: 0,
    }));
    setQueue((q) => [...q.filter((x) => !x.error && x.progress < 1), ...items]);

    let next = 0;
    const worker = async () => {
      while (next < accepted.length) {
        const i = next++;
        const it = items[i];
        try {
          const blob = await preparePhoto(accepted[i]);
          const res = await uploadPhoto(media.invitationId, "gallery", blob, (p) =>
            patch(it.id, { progress: p }),
          );
          setGallery([
            ...current(),
            { url: res.url, alt: undefined, width: res.width, height: res.height },
          ]);
          media.saveSoon();
          patch(it.id, { progress: 1 });
        } catch (e) {
          const msg = e instanceof ClientUploadError ? e.message : "Gagal mengunggah.";
          if (e instanceof ClientUploadError && (e.code === "GALLERY_LIMIT" || e.code === "QUOTA"))
            setLimitMsg(msg);
          patch(it.id, { error: msg });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, accepted.length) }, worker));
    // Item sukses dibuang dari antrean setelah sebentar; yang gagal tetap tampil.
    window.setTimeout(() => setQueue((q) => q.filter((x) => x.error)), 1200);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const list = current();
    const from = list.findIndex((p) => p.url === e.active.id);
    const to = list.findIndex((p) => p.url === e.over!.id);
    if (from < 0 || to < 0) return;
    setGallery(arrayMove(list, from, to));
  };

  const remove = (i: number) => {
    const list = current();
    media.releaseUrl(list[i].url);
    setGallery(list.filter((_, j) => j !== i));
    media.saveSoon();
  };

  const full = media.galleryLimit !== null && photos.length >= media.galleryLimit;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {photos.length} foto
          {media.galleryLimit !== null ? ` dari maks. ${media.galleryLimit}` : ""} · tahan &amp;
          geser untuk mengurutkan
        </p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Pilih foto galeri"
          onChange={(e) => {
            void addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() =>
            full
              ? setLimitMsg(
                  `Galeri sudah penuh: paket ${media.packageLabel} maksimal ${media.galleryLimit} foto.`,
                )
              : input.current?.click()
          }
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm"
        >
          + Tambah foto
        </button>
      </div>

      {limitMsg && <UpgradeNotice message={limitMsg} />}

      {queue.length > 0 && (
        <ul className="space-y-1.5" aria-label="Antrean unggahan">
          {queue.map((q) => (
            <li key={q.id} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="truncate">{q.name}</span>
                <span className={q.error ? "text-destructive" : "text-muted-foreground"}>
                  {q.error
                    ? "Gagal"
                    : q.progress >= 1
                      ? "Selesai ✓"
                      : `${Math.round(q.progress * 100)}%`}
                </span>
              </div>
              {q.error ? (
                <p className="text-destructive">{q.error}</p>
              ) : (
                <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-neutral-200">
                  <div
                    className="bg-primary h-full transition-[width]"
                    style={{ width: `${Math.round(q.progress * 100)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((p) => p.url)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p, i) => (
                <Tile
                  key={p.url}
                  photo={p}
                  index={i}
                  onCrop={() => setCropIndex(i)}
                  onRemove={() => remove(i)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed py-6 text-center text-sm">
          Belum ada foto. Pilih beberapa foto sekaligus.
        </p>
      )}

      {cropIndex !== null && photos[cropIndex] && (
        <CropDialog
          src={photos[cropIndex].url}
          aspect={3 / 4}
          aspectOptions={RATIOS}
          title={`Atur potongan foto ${cropIndex + 1}`}
          onCancel={() => setCropIndex(null)}
          onDone={async (area) => {
            const i = cropIndex;
            const old = photos[i];
            setCropIndex(null);
            const id = `crop-${Date.now()}`;
            setQueue((q) => [...q, { id, name: `Foto ${i + 1} (potongan baru)`, progress: 0 }]);
            try {
              const blob = await cropToBlob(old.url, area);
              const res = await uploadPhoto(media.invitationId, "gallery-crop", blob, (p) =>
                patch(id, { progress: p }),
              );
              const list = current();
              const at = list.findIndex((p) => p.url === old.url);
              if (at >= 0) {
                list[at] = { url: res.url, alt: undefined, width: res.width, height: res.height };
                setGallery([...list]);
                media.releaseUrl(old.url);
                media.saveSoon();
              }
              patch(id, { progress: 1 });
              window.setTimeout(() => setQueue((q) => q.filter((x) => x.id !== id)), 1200);
            } catch (e) {
              patch(id, {
                error: e instanceof ClientUploadError ? e.message : "Gagal menyimpan potongan.",
              });
            }
          }}
        />
      )}
    </div>
  );
}
