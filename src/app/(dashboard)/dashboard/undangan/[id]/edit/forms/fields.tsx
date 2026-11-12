"use client";

import { useFormContext, useWatch, type FieldErrors } from "react-hook-form";

import { cn } from "@/lib/utils";

/** Kelas input bersama (selaras dengan components/ui/input). */
export const inputClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 w-full min-w-0 rounded-md border px-3 py-1.5 text-base shadow-xs outline-none focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm";

/** Ambil pesan galat untuk path "a.b.0.c" dari errors RHF. */
export function errorAt(errors: FieldErrors, name: string): string | undefined {
  let cur: unknown = errors;
  for (const part of name.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  const msg = (cur as { message?: unknown } | undefined)?.message;
  return typeof msg === "string" ? msg : undefined;
}

const fieldId = (name: string) => `f-${name.replace(/\./g, "-")}`;

export function FieldShell({
  name,
  label,
  hint,
  error,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={fieldId(name)} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${fieldId(name)}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  type = "text",
  placeholder,
  maxLength,
  rows,
  dir,
  className,
  inputMode,
  number,
}: {
  name: string;
  label: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  /** >0 → textarea */
  rows?: number;
  dir?: "rtl" | "ltr" | "auto";
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Simpan sebagai angka (kosong → undefined). */
  number?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errorAt(errors, name);
  const common = {
    id: fieldId(name),
    "aria-invalid": !!error,
    "aria-describedby": error ? `${fieldId(name)}-error` : undefined,
    placeholder,
    maxLength,
    dir,
    className: inputClass,
  };
  return (
    <FieldShell name={name} label={label} hint={hint} error={error} className={className}>
      {rows ? (
        <textarea {...common} rows={rows} {...register(name)} />
      ) : (
        <input
          {...common}
          type={type}
          inputMode={inputMode}
          {...register(
            name,
            number
              ? { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) }
              : undefined,
          )}
        />
      )}
    </FieldShell>
  );
}

export function CheckField({ name, label }: { name: string; label: string }) {
  const { register } = useFormContext();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4" {...register(name)} />
      {label}
    </label>
  );
}

export function SelectField({
  name,
  label,
  options,
  hint,
}: {
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  hint?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <FieldShell name={name} label={label} hint={hint} error={errorAt(errors, name)}>
      <select id={fieldId(name)} className={cn(inputClass, "h-9")} {...register(name)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Daftar string sederhana (warna dress code, nama keluarga) lewat setValue. */
export function StringList({
  name,
  label,
  max,
  placeholder,
  addLabel,
  color,
}: {
  name: string;
  label: string;
  max: number;
  placeholder?: string;
  addLabel: string;
  color?: boolean;
}) {
  const { control, setValue, formState } = useFormContext();
  const items = (useWatch({ control, name }) as string[] | undefined) ?? [];
  const update = (next: string[]) =>
    setValue(name, next, { shouldDirty: true, shouldValidate: true });
  const error = errorAt(formState.errors, name);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          {color ? (
            <>
              <input
                type="color"
                aria-label={`Warna ${i + 1}`}
                value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"}
                onChange={(e) => update(items.map((x, j) => (j === i ? e.target.value : x)))}
                className="h-9 w-12 cursor-pointer rounded border"
              />
              <code className="text-muted-foreground text-xs">{v}</code>
            </>
          ) : (
            <input
              className={inputClass}
              value={v}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              maxLength={160}
              onChange={(e) => update(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
          )}
          <button
            type="button"
            onClick={() => update(items.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-destructive shrink-0 px-2 text-sm"
            aria-label={`Hapus ${label} ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => update([...items, color ? "#b08d57" : ""])}
          className="text-primary text-sm font-medium"
        >
          + {addLabel}
        </button>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </fieldset>
  );
}

/** Kartu item dalam daftar (acara, love story, rekening, …) dengan tombol hapus & geser. */
export function ItemCard({
  title,
  onRemove,
  onUp,
  onDown,
  children,
}: {
  title: string;
  onRemove?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-neutral-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex gap-1 text-sm">
          {onUp && (
            <button
              type="button"
              onClick={onUp}
              aria-label="Geser ke atas"
              className="hover:bg-muted rounded px-1.5"
            >
              ↑
            </button>
          )}
          {onDown && (
            <button
              type="button"
              onClick={onDown}
              aria-label="Geser ke bawah"
              className="hover:bg-muted rounded px-1.5"
            >
              ↓
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive rounded px-1.5"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:border-primary hover:text-primary w-full rounded-xl border border-dashed py-2.5 text-sm font-medium"
    >
      + {children}
    </button>
  );
}

export const grid2 = "grid gap-3 sm:grid-cols-2";
