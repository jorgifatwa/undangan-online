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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { PackageFeatures } from "@/lib/packages";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SECTION_ORDER,
  SECTION_FEATURE,
  SECTION_IDS,
  SECTION_LABELS,
  isSectionEmpty,
  type AnyInvitationData,
  type SectionId,
} from "@/schemas/sections";
import type { ThemeManifest } from "@/themes/types";

type Config = { id: string; visible: boolean }[];

/** Urutan efektif (tanpa cover): config user → sisa default; section terkunci di atas. */
export function effectiveOrder(
  eventType: "WEDDING" | "BIRTHDAY",
  config: Config,
  locked: readonly SectionId[],
): { id: SectionId; visible: boolean }[] {
  const defaults: SectionId[] = DEFAULT_SECTION_ORDER[eventType].filter((id) => id !== "cover");
  const known = config.filter(
    (s): s is { id: SectionId; visible: boolean } =>
      (SECTION_IDS as readonly string[]).includes(s.id) && s.id !== "cover",
  );
  const ids: SectionId[] = known.map((s) => s.id);
  for (const id of defaults) if (!ids.includes(id)) ids.push(id);
  const lockedIds: SectionId[] = locked.filter((id) => id !== "cover");
  const ordered = [...lockedIds, ...ids.filter((id) => !lockedIds.includes(id))];
  return ordered.map((id) => ({
    id,
    visible: lockedIds.includes(id) ? true : (known.find((s) => s.id === id)?.visible ?? true),
  }));
}

function Row({
  id,
  visible,
  locked,
  badges,
  onToggle,
}: {
  id: SectionId;
  visible: boolean;
  locked: boolean;
  badges: { text: string; tone: "amber" | "neutral" | "rose" }[];
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-background flex items-center gap-2 rounded-xl border px-2 py-2",
        isDragging && "relative z-10 shadow-lg",
        !visible && "opacity-60",
      )}
    >
      {locked ? (
        <span
          className="text-muted-foreground grid size-8 place-items-center"
          title="Dikunci tema: selalu tampil tepat setelah cover"
          aria-label="Dikunci tema"
        >
          🔒
        </span>
      ) : (
        <button
          type="button"
          className="text-muted-foreground hover:bg-muted grid size-8 cursor-grab touch-none place-items-center rounded-lg active:cursor-grabbing"
          aria-label={`Geser ${SECTION_LABELS[id]}`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{SECTION_LABELS[id]}</p>
        {badges.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b.text}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  b.tone === "amber" && "bg-amber-100 text-amber-900",
                  b.tone === "neutral" && "bg-neutral-200 text-neutral-700",
                  b.tone === "rose" && "bg-rose-100 text-rose-900",
                )}
              >
                {b.text}
              </span>
            ))}
          </div>
        )}
      </div>
      <label
        className={cn("flex items-center gap-1.5 text-xs", locked && "cursor-not-allowed")}
        title={locked ? "Section terkunci tidak bisa disembunyikan" : undefined}
      >
        <input
          type="checkbox"
          className="size-4"
          checked={visible}
          disabled={locked}
          onChange={onToggle}
          aria-label={`Tampilkan ${SECTION_LABELS[id]}`}
        />
        Tampil
      </label>
    </li>
  );
}

export function SectionManager({
  eventType,
  manifest,
  features,
  invitation,
  config,
  onChange,
}: {
  eventType: "WEDDING" | "BIRTHDAY";
  manifest: ThemeManifest;
  features: PackageFeatures;
  /** Data terakhir yang valid (untuk tanda "belum diisi"). */
  invitation: AnyInvitationData | null;
  config: Config;
  onChange: (next: Config) => void;
}) {
  const locked = manifest.lockedSections ?? [];
  const rows = effectiveOrder(eventType, config, locked);
  const sensors = useSensors(
    // jari: tahan sebentar sebelum menyeret agar tetap bisa menggulir daftar
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rows.findIndex((r) => r.id === e.active.id);
    let to = rows.findIndex((r) => r.id === e.over!.id);
    // tidak boleh masuk ke atas section terkunci
    const firstFree = rows.findIndex((r) => !locked.includes(r.id));
    if (to < firstFree) to = firstFree;
    onChange(arrayMove(rows, from, to));
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Seret ⠿ untuk mengubah urutan. Cover selalu di awal. Section bertanda 🔒 dikunci tema.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {rows.map((r) => {
              const isLocked = locked.includes(r.id);
              const badges: { text: string; tone: "amber" | "neutral" | "rose" }[] = [];
              if (!manifest.sections.includes(r.id))
                badges.push({ text: "tidak tampil di tema ini", tone: "neutral" });
              const feature = SECTION_FEATURE[r.id];
              if (feature && !features[feature])
                badges.push({ text: "butuh paket lebih tinggi", tone: "rose" });
              if (invitation && isSectionEmpty(r.id, invitation))
                badges.push({ text: "belum diisi", tone: "amber" });
              return (
                <Row
                  key={r.id}
                  id={r.id}
                  visible={r.visible}
                  locked={isLocked}
                  badges={badges}
                  onToggle={() =>
                    onChange(rows.map((x) => (x.id === r.id ? { ...x, visible: !x.visible } : x)))
                  }
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
