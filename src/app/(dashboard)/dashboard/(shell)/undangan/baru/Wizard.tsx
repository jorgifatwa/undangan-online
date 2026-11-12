"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ThemeCard } from "@/components/themes/ThemeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wizardSchema } from "@/lib/invitations/initial-data";
import { QUOTE_GROUP_LABELS, QUOTE_PRESETS, wizardQuoteGroups } from "@/lib/quotes";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type ThemeCategory, type ThemeManifest } from "@/themes/types";

import { createInvitation } from "@/app/(dashboard)/dashboard/undangan/actions";

type EventType = "WEDDING" | "BIRTHDAY";
type Values = Record<string, string>;

const STEPS = ["Jenis acara", "Data dasar", "Pilih tema"] as const;

const EVENT_OPTIONS: { type: EventType; title: string; text: string; icon: string }[] = [
  {
    type: "WEDDING",
    title: "Pernikahan",
    text: "Akad, resepsi, ayat, love story, amplop digital.",
    icon: "💍",
  },
  {
    type: "BIRTHDAY",
    title: "Ulang Tahun",
    text: "Pesta anak & dewasa, wishlist kado, dress code.",
    icon: "🎂",
  },
];

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}

export function Wizard({ themes }: { themes: ThemeManifest[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [values, setValues] = useState<Values>({
    // string kosong (bukan undefined) → pesan galat khusus per field, mis. "Kota wajib diisi"
    brideName: "",
    groomName: "",
    name: "",
    date: "",
    city: "",
    timezone: "WIB",
    greeting: "islami",
    quoteId: "ar-rum-21",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [category, setCategory] = useState<ThemeCategory | "">("");
  const [pending, startTransition] = useTransition();

  const available = useMemo(
    () => themes.filter((t) => eventType && t.eventTypes.includes(eventType)),
    [themes, eventType],
  );
  const categories = [...new Set(available.map((t) => t.category))];
  const shown = available.filter((t) => !category || t.category === category);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };
  const input = (k: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      id={k}
      value={values[k] ?? ""}
      onChange={set(k)}
      aria-invalid={!!errors[k]}
      aria-describedby={errors[k] ? `${k}-error` : undefined}
      {...props}
    />
  );

  /** Validasi langkah 2 dengan schema yang sama dengan server (tema diisi belakangan). */
  const validateBasics = () => {
    const r = wizardSchema.safeParse({ ...values, eventType, themeId: "_" });
    if (r.success) return true;
    const next: Record<string, string> = {};
    for (const i of r.error.issues) {
      const key = i.path.join(".");
      if (key !== "themeId" && !(key in next)) next[key] = i.message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!values.themeId) return setErrors({ themeId: "Pilih salah satu tema" });
    setFormError(null);
    startTransition(async () => {
      const res = await createInvitation({ ...values, eventType });
      if (res.ok) {
        router.push(`/dashboard/undangan/${res.value.id}/edit`);
        return;
      }
      setFormError(res.error);
      if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        if (Object.keys(res.fieldErrors).some((k) => k !== "themeId")) setStep(1);
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Penanda langkah */}
      <ol className="mb-8 flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border text-xs font-semibold",
                i < step && "bg-primary border-primary text-primary-foreground",
                i === step && "border-primary text-primary",
                i > step && "text-muted-foreground",
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                i === step ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="bg-border mx-1 h-px w-6 sm:w-10" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h1 className="font-heading text-3xl">Undangan untuk acara apa?</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {EVENT_OPTIONS.map((o) => (
              <button
                key={o.type}
                type="button"
                onClick={() => {
                  setEventType(o.type);
                  setValues((v) => ({
                    ...v,
                    themeId: "",
                    quoteId: o.type === "WEDDING" && v.greeting === "islami" ? "ar-rum-21" : "",
                  }));
                  setStep(1);
                }}
                className={cn(
                  "hover:border-primary rounded-2xl border p-6 text-left transition-colors",
                  eventType === o.type && "border-primary bg-primary/5",
                )}
              >
                <span className="text-3xl" aria-hidden>
                  {o.icon}
                </span>
                <p className="font-heading mt-3 text-xl">{o.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{o.text}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && eventType && (
        <section>
          <h1 className="font-heading text-3xl">Data dasar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cukup ini dulu — detail lain (foto, acara, alamat, hadiah) diisi di editor.
          </p>
          <form
            className="mt-6 grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (validateBasics()) setStep(2);
            }}
            noValidate
          >
            {eventType === "WEDDING" ? (
              <>
                <Field id="brideName" label="Nama lengkap mempelai wanita" error={errors.brideName}>
                  {input("brideName", { autoComplete: "off", maxLength: 120 })}
                </Field>
                <Field
                  id="brideNickname"
                  label="Nama panggilan"
                  hint="Opsional, mis. Sekar"
                  error={errors.brideNickname}
                >
                  {input("brideNickname", { maxLength: 40 })}
                </Field>
                <Field id="groomName" label="Nama lengkap mempelai pria" error={errors.groomName}>
                  {input("groomName", { autoComplete: "off", maxLength: 120 })}
                </Field>
                <Field
                  id="groomNickname"
                  label="Nama panggilan"
                  hint="Opsional, mis. Raka"
                  error={errors.groomNickname}
                >
                  {input("groomNickname", { maxLength: 40 })}
                </Field>
              </>
            ) : (
              <>
                <Field id="name" label="Nama yang berulang tahun" error={errors.name}>
                  {input("name", { autoComplete: "off", maxLength: 120 })}
                </Field>
                <Field id="nickname" label="Nama panggilan" hint="Opsional" error={errors.nickname}>
                  {input("nickname", { maxLength: 40 })}
                </Field>
                <Field id="age" label="Ulang tahun ke-" hint="Opsional" error={errors.age}>
                  {input("age", { type: "number", inputMode: "numeric", min: 1, max: 120 })}
                </Field>
              </>
            )}
            <Field id="date" label="Tanggal acara" error={errors.date}>
              {input("date", { type: "date", min: today() })}
            </Field>
            <Field id="timezone" label="Zona waktu" error={errors.timezone}>
              <select
                id="timezone"
                value={values.timezone}
                onChange={set("timezone")}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="WIB">WIB</option>
                <option value="WITA">WITA</option>
                <option value="WIT">WIT</option>
              </select>
            </Field>
            <Field id="city" label="Kota" hint="Mis. Bandung" error={errors.city}>
              {input("city", { maxLength: 80, autoComplete: "address-level2" })}
            </Field>
            {eventType === "WEDDING" && (
              <fieldset className="space-y-1.5 sm:col-span-2">
                <legend className="text-sm font-medium">Gaya salam</legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["islami", "Islami", "Basmalah, salam, & ayat Al-Qur'an"],
                    ["umum", "Umum", "Tanpa salam; kutipan Alkitab/umum opsional"],
                  ].map(([value, label, text]) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-xl border px-4 py-3 text-sm",
                        values.greeting === value && "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="greeting"
                        value={value}
                        checked={values.greeting === value}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            greeting: e.target.value,
                            // gaya salam berganti → kutipan bawaan ikut berganti
                            quoteId: e.target.value === "islami" ? "ar-rum-21" : "",
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground block text-xs">{text}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="sm:col-span-2">
              <Field
                id="quoteId"
                label={eventType === "WEDDING" ? "Ayat / kutipan" : "Kutipan ucapan"}
                hint="Bisa diganti atau ditulis sendiri nanti di editor."
                error={errors.quoteId}
              >
                <select
                  id="quoteId"
                  value={values.quoteId ?? ""}
                  onChange={set("quoteId")}
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">Tanpa kutipan</option>
                  {wizardQuoteGroups(eventType, values.greeting === "umum" ? "umum" : "islami").map(
                    (g) => (
                      <optgroup key={g} label={QUOTE_GROUP_LABELS[g]}>
                        {QUOTE_PRESETS.filter((q) => q.group === g).map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.label}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
              </Field>
            </div>
            <div className="flex justify-between gap-3 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                ← Kembali
              </Button>
              <Button type="submit">Lanjut pilih tema →</Button>
            </div>
          </form>
        </section>
      )}

      {step === 2 && eventType && (
        <section>
          <h1 className="font-heading text-3xl">Pilih tema</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Semua tema bisa dicoba gratis dan bisa diganti kapan saja tanpa kehilangan data.
          </p>
          {categories.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(["", ...categories] as const).map((c) => (
                <button
                  key={c || "semua"}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm",
                    category === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {c ? CATEGORY_LABELS[c] : "Semua gaya"}
                </button>
              ))}
            </div>
          )}
          {errors.themeId && <p className="text-destructive mt-4 text-sm">{errors.themeId}</p>}
          <ul
            className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Tema"
          >
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={values.themeId === t.id}
                  onClick={() => {
                    setValues((v) => ({ ...v, themeId: t.id }));
                    setErrors({});
                  }}
                  className="group block w-full"
                >
                  <ThemeCard theme={t} selected={values.themeId === t.id} />
                </button>
                <a
                  href={`/preview/${t.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-primary mt-1 inline-block text-xs underline-offset-2 hover:underline"
                >
                  Lihat contoh ↗
                </a>
              </li>
            ))}
          </ul>
          {formError && <p className="text-destructive mt-6 text-sm">{formError}</p>}
          <div className="mt-8 flex justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={pending}>
              ← Kembali
            </Button>
            <Button type="button" onClick={submit} disabled={pending || !values.themeId}>
              {pending ? "Membuat undangan…" : "Buat undangan"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
