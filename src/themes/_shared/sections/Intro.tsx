"use client";

import { displayFullName, parentsLines, couple } from "../format";
import { Reveal } from "../motion/Reveal";
import { useInvitation } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import type { Person } from "@/schemas/wedding";
import { FillPhoto, Icon, SectionTitle } from "./ui";

const SECTION_PAD = "px-7 py-20";

/** Salam pembuka + kalimat undangan. */
export function DefaultSalam() {
  const { inv } = useInvitation();
  const islami = inv.data.greeting?.style === "islami";
  const fallback =
    inv.eventType === "WEDDING"
      ? islami
        ? "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada pernikahan kami."
        : "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada hari bahagia kami."
      : "Dengan penuh sukacita, kami mengundang kamu untuk hadir dan merayakan hari spesial ini bersama kami!";

  return (
    <SectionShell id="salam" className={`${SECTION_PAD} text-center`}>
      {islami && (
        <Reveal
          variant="blur"
          as="p"
          className="mb-5 text-3xl"
          style={{ fontFamily: "var(--inv-font-arabic)" }}
        >
          <span dir="rtl" lang="ar">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </span>
        </Reveal>
      )}
      {islami && (
        <Reveal variant="fade" as="p" className="mb-4 text-sm font-semibold italic">
          Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
        </Reveal>
      )}
      <Reveal
        variant="rise"
        as="p"
        className="mx-auto max-w-sm text-[15px] leading-relaxed opacity-90"
      >
        {inv.data.greeting?.openingText ?? fallback}
      </Reveal>
    </SectionShell>
  );
}

/** Kutipan ayat: teks Arab (Amiri) + terjemahan + sumber. */
export function DefaultAyat() {
  const { inv } = useInvitation();
  const q = inv.data.quote;
  if (!q) return null;
  return (
    <SectionShell
      id="ayat"
      className={`${SECTION_PAD} text-center`}
      style={{ background: "var(--inv-bg-alt)" }}
    >
      {q.arabic && (
        <Reveal
          variant="blur"
          as="p"
          className="mb-6 text-2xl leading-[2.1]"
          style={{ fontFamily: "var(--inv-font-arabic)" }}
        >
          <span dir="rtl" lang="ar">
            {q.arabic}
          </span>
        </Reveal>
      )}
      {q.translation && (
        <Reveal
          variant="rise"
          as="p"
          className="mx-auto max-w-sm text-sm leading-relaxed italic opacity-90"
        >
          &ldquo;{q.translation}&rdquo;
        </Reveal>
      )}
      {q.source && (
        <Reveal
          variant="fade"
          as="p"
          className="mt-4 text-xs font-semibold tracking-widest uppercase opacity-70"
        >
          {q.source}
        </Reveal>
      )}
    </SectionShell>
  );
}

function PersonCard({
  person,
  lead,
  side,
}: {
  person: Person;
  lead: string;
  side: "left" | "right";
}) {
  const parents = parentsLines(person.childOrder, person.father, person.mother, lead);
  return (
    <Reveal variant={side} className="flex flex-col items-center text-center">
      {person.photo && (
        <div
          className="relative mb-5 h-64 w-48 overflow-hidden"
          style={{
            borderRadius: "999px 999px 1.25rem 1.25rem",
            boxShadow: "0 0 0 6px var(--inv-surface), 0 0 0 7px var(--inv-accent)",
          }}
        >
          <FillPhoto photo={person.photo} sizes="200px" />
        </div>
      )}
      <h3
        className="text-3xl leading-tight"
        style={{
          fontFamily: "var(--inv-font-script)",
          color: "var(--inv-title, var(--inv-primary))",
        }}
      >
        {displayFullName(person)}
      </h3>
      {parents && (
        <p className="mt-3 text-sm leading-relaxed opacity-85">
          {parents.lead}
          <br />
          <span className="font-semibold">{parents.names}</span>
        </p>
      )}
      {person.instagram && (
        <a
          href={`https://instagram.com/${encodeURIComponent(person.instagram)}`}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100"
        >
          <Icon name="insta" /> @{person.instagram}
        </a>
      )}
    </Reveal>
  );
}

/** Profil mempelai (wedding) atau yang berulang tahun (birthday). */
export function DefaultProfil() {
  const { inv } = useInvitation();

  if (inv.eventType === "WEDDING") {
    const [a, b] = couple(inv.data);
    const lead = (p: Person) => (p === inv.data.bride ? "Putri dari" : "Putra dari");
    return (
      <SectionShell id="profil" className={SECTION_PAD}>
        <SectionTitle kicker="Mempelai" title="Kedua Mempelai" />
        <div className="flex flex-col gap-10">
          <PersonCard person={a} lead={lead(a)} side="left" />
          <Reveal
            variant="pop"
            as="p"
            className="text-center text-5xl"
            style={{ fontFamily: "var(--inv-font-script)", color: "var(--inv-accent)" }}
          >
            &amp;
          </Reveal>
          <PersonCard person={b} lead={lead(b)} side="right" />
        </div>
      </SectionShell>
    );
  }

  const c = inv.data.celebrant;
  const parents = parentsLines(undefined, c.father, c.mother, "Anak dari");
  return (
    <SectionShell id="profil" className={`${SECTION_PAD} text-center`}>
      <SectionTitle kicker="Yang Berulang Tahun" title={c.nickname ?? c.name} />
      {c.photo && (
        <Reveal
          variant="pop"
          className="relative mx-auto mb-6 size-56 overflow-hidden rounded-full"
          style={{ boxShadow: "0 0 0 8px var(--inv-surface), 0 0 0 11px var(--inv-accent)" }}
        >
          <FillPhoto photo={c.photo} sizes="240px" />
        </Reveal>
      )}
      <Reveal variant="rise" as="p" className="text-xl font-semibold">
        {c.name}
      </Reveal>
      {c.age !== undefined && (
        <Reveal
          variant="pop"
          delay={0.15}
          className="mx-auto mt-4 inline-flex items-baseline gap-2 rounded-full px-5 py-2"
          style={{ background: "var(--inv-primary)", color: "var(--inv-primary-text)" }}
        >
          <span className="text-sm">Ulang tahun ke-</span>
          <span className="text-3xl font-bold" style={{ fontFamily: "var(--inv-font-display)" }}>
            {c.age}
          </span>
        </Reveal>
      )}
      {parents && (
        <Reveal variant="fade" as="p" className="mt-5 text-sm opacity-85">
          {parents.lead} <span className="font-semibold">{parents.names}</span>
        </Reveal>
      )}
      {inv.data.partyTheme && (
        <Reveal variant="fade" as="p" className="mt-3 text-sm">
          Tema pesta: <strong>{inv.data.partyTheme}</strong>
        </Reveal>
      )}
    </SectionShell>
  );
}

/** Love story: linimasa vertikal. */
export function DefaultLoveStory() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  return (
    <SectionShell
      id="loveStory"
      className={SECTION_PAD}
      style={{ background: "var(--inv-bg-alt)" }}
    >
      <SectionTitle kicker="Perjalanan Kami" title="Love Story" />
      <ol className="relative ml-3 border-l pl-6" style={{ borderColor: "var(--inv-accent)" }}>
        {inv.data.loveStory.map((item, i) => (
          <Reveal key={i} as="li" variant="right" className="relative mb-8 last:mb-0">
            <span
              className="absolute top-1.5 -left-[31px] size-3 rounded-full"
              style={{ background: "var(--inv-accent)", boxShadow: "0 0 0 4px var(--inv-bg-alt)" }}
            />
            {item.date && (
              <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
                {item.date}
              </p>
            )}
            <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
            {item.photo && (
              <div className="relative my-3 aspect-[4/3] overflow-hidden rounded-xl">
                <FillPhoto photo={item.photo} sizes="360px" />
              </div>
            )}
            {item.text && <p className="mt-1 text-sm leading-relaxed opacity-85">{item.text}</p>}
          </Reveal>
        ))}
      </ol>
    </SectionShell>
  );
}
