"use client";

import { Reveal } from "../motion/Reveal";
import { useInvitation } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import { useInvitationTitle } from "./Cover";
import { FillPhoto } from "./ui";

export function DefaultPenutup() {
  const { inv } = useInvitation();
  const { title } = useInvitationTitle();
  const islami = inv.data.greeting?.style === "islami";
  const photo = inv.eventType === "WEDDING" ? inv.data.photos.closing : inv.data.closingPhoto;
  const signature = inv.eventType === "WEDDING" ? inv.data.signature : undefined;

  const fallback =
    inv.eventType === "WEDDING"
      ? "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami."
      : "Kehadiranmu akan membuat hari spesial ini semakin meriah. Sampai jumpa di pesta!";

  return (
    <SectionShell id="penutup" className="px-7 pt-20 pb-28 text-center">
      {photo && (
        <Reveal
          variant="zoom"
          className="relative mx-auto mb-10 aspect-[3/4] w-64 overflow-hidden rounded-[999px_999px_1.5rem_1.5rem]"
        >
          <FillPhoto photo={photo} sizes="260px" />
        </Reveal>
      )}
      <Reveal
        variant="rise"
        as="p"
        className="mx-auto max-w-sm text-[15px] leading-relaxed opacity-90"
      >
        {inv.data.greeting?.closingText ?? fallback}
      </Reveal>
      {islami && (
        <Reveal variant="fade" as="p" className="mt-6 text-sm font-semibold italic">
          Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh
        </Reveal>
      )}
      <Reveal
        variant="fade"
        as="p"
        className="mt-10 text-xs tracking-[0.25em] uppercase opacity-70"
      >
        {signature?.text ??
          (inv.eventType === "WEDDING" ? "Kami yang berbahagia" : "Dengan penuh sayang")}
      </Reveal>
      <Reveal
        variant="blur"
        as="h2"
        className="inv-title mt-2 text-5xl leading-tight"
        style={{
          fontFamily: "var(--inv-font-script)",
          color: "var(--inv-title, var(--inv-primary))",
        }}
      >
        {title}
      </Reveal>
      {signature && signature.families.length > 0 && (
        <Reveal variant="fade" className="mt-4 flex flex-col gap-1 text-xs opacity-80">
          {signature.families.map((f) => (
            <p key={f}>{f}</p>
          ))}
        </Reveal>
      )}
    </SectionShell>
  );
}
