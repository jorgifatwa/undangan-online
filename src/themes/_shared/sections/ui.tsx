"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Photo } from "@/schemas/common";

import { Reveal } from "../motion/Reveal";

/** Judul section default: kicker kecil + judul script. */
export function SectionTitle({
  kicker,
  title,
  className,
}: {
  kicker?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 text-center", className)}>
      {kicker && (
        <Reveal
          variant="fade"
          as="p"
          className="inv-kicker mb-2 text-[11px] tracking-[0.3em] uppercase opacity-70"
        >
          {kicker}
        </Reveal>
      )}
      <Reveal
        variant="blur"
        as="h2"
        className="inv-title text-[2.6rem] leading-tight"
        style={{
          fontFamily: "var(--inv-font-script)",
          color: "var(--inv-title, var(--inv-primary))",
        }}
      >
        {title}
      </Reveal>
    </div>
  );
}

/** Foto dengan next/image + titik fokus. Mengisi parent (parent harus relative + berukuran). */
export function FillPhoto({
  photo,
  sizes = "(max-width: 440px) 100vw, 440px",
  className,
  priority,
}: {
  photo: Photo;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={photo.url}
      alt={photo.alt ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      style={{ objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 50}%` }}
    />
  );
}

/** Garis pemisah kecil dengan titik di tengah. */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("mx-auto my-6 flex w-40 items-center gap-3 opacity-60", className)}
      aria-hidden
    >
      <span className="h-px flex-1" style={{ background: "currentColor" }} />
      <span className="size-1.5 rotate-45" style={{ background: "currentColor" }} />
      <span className="h-px flex-1" style={{ background: "currentColor" }} />
    </div>
  );
}

export function Icon({
  name,
  className,
}: {
  name: "map" | "calendar" | "copy" | "gift" | "play" | "insta" | "wa";
  className?: string;
}) {
  const paths: Record<typeof name, string> = {
    map: "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
    calendar:
      "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 7h14v10H5V9Z",
    copy: "M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16h-9V7h9v14Z",
    gift: "M20 7h-2.2A3 3 0 0 0 12 3.8 3 3 0 0 0 6.2 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8h1a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Zm-5-2a1 1 0 1 1 0 2h-2V6a1 1 0 0 1 1-1h1ZM8 6a1 1 0 0 1 2 0v1H9a1 1 0 0 1-1-1Zm3 14H7v-8h4v8Zm0-10H5V9h6v1Zm6 10h-4v-8h4v8Zm2-10h-6V9h6v1Z",
    play: "M8 5v14l11-7z",
    insta:
      "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1C4.2 2.3 2.3 4.2 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.2 3.7 2.1 5.6 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.7-.2 5.6-2.1 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.2-3.7-2.1-5.6-5.8-5.8C15 2 14.7 2 12 2Z",
    wa: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z",
  };
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
