import type { Parent } from "@/schemas/common";
import type { Person, WeddingData } from "@/schemas/wedding";

/** Nama lengkap + gelar: "dr. Sekar Ayu, S.Ked." */
export function displayFullName(p: Pick<Person, "fullName" | "title" | "titlePrefix">): string {
  return [p.titlePrefix, p.fullName].filter(Boolean).join(" ") + (p.title ? `, ${p.title}` : "");
}

/** Nama panggilan, atau kata pertama nama lengkap. */
export function shortName(p: Pick<Person, "fullName" | "nickname">): string {
  return p.nickname ?? p.fullName.split(" ")[0];
}

/** Pasangan sesuai urutan yang dipilih user. */
export function couple(d: WeddingData): [Person, Person] {
  return d.order === "groom-first" ? [d.groom, d.bride] : [d.bride, d.groom];
}

/** "Sekar & Raka" */
export function coupleNames(d: WeddingData): string {
  const [a, b] = couple(d);
  return `${shortName(a)} & ${shortName(b)}`;
}

function parentName(p: Parent, kind: "father" | "mother"): string {
  const honorific = kind === "father" ? "Bapak" : "Ibu";
  const alm = p.deceased ? (kind === "father" ? "Alm. " : "Almh. ") : "";
  return `${honorific} ${alm}${p.name}`;
}

/** ["Bapak Alm. X", "Ibu Y"] — kosong jika tidak diisi. */
export function parentNames(father?: Parent, mother?: Parent): string[] {
  const out: string[] = [];
  if (father) out.push(parentName(father, "father"));
  if (mother) out.push(parentName(mother, "mother"));
  return out;
}

/**
 * Baris orang tua: "Putri pertama dari" + "Bapak X & Ibu Y".
 * Mengembalikan null bila orang tua tidak diisi.
 */
export function parentsLines(
  childOrder: string | undefined,
  father: Parent | undefined,
  mother: Parent | undefined,
  fallbackLead: string,
): { lead: string; names: string } | null {
  const names = parentNames(father, mother);
  if (names.length === 0) return null;
  return { lead: childOrder ? `${childOrder} dari` : fallbackLead, names: names.join(" & ") };
}
