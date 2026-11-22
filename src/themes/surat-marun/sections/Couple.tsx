"use client";

import Image from "next/image";

import { couple, displayFullName, parentsLines } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import type { Person } from "@/schemas/wedding";
import { instagramUrl } from "@/lib/links";
import { paperCard } from "../art/Ornaments";
import { EnterGroup, F, Section, txt, u, useFit } from "../canvas";

/**
 * Mempelai (section `profil`): per orang, latar foto hitam-putih buram
 * selebar layar; di atasnya kartu kertas "The / BRIDE|GROOM" + kartu foto
 * tajam berbingkai putih; lalu nama, orang tua, Instagram di atas gradasi gelap.
 */
function Person({ p, role }: { p: Person; role: "BRIDE" | "GROOM" }) {
  const name = displayFullName(p);
  const ref = useFit<HTMLHeadingElement>(name);
  const parents = parentsLines(
    p.childOrder,
    p.father,
    p.mother,
    role === "BRIDE" ? "Putri dari" : "Putra dari",
  );
  const ig = instagramUrl(p.instagram);
  const photo = p.photo;
  return (
    <div
      style={{ position: "relative", height: u(820), overflow: "hidden", background: "#2a2626" }}
    >
      {photo && (
        <div
          style={{
            position: "absolute",
            inset: `${u(-30)}`,
            filter: "grayscale(1) blur(14px) brightness(0.85)",
          }}
        >
          <Image
            src={photo.url}
            alt=""
            fill
            sizes="440px"
            style={{
              objectFit: "cover",
              objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 30}%`,
            }}
          />
        </div>
      )}
      <div
        data-a
        style={{
          position: "absolute",
          left: u(20),
          top: u(180),
          width: u(126),
          height: u(156),
          ...paperCard(),
          padding: u(12),
        }}
      >
        <p style={{ ...txt(F.script, 30, 1, { color: "var(--inv-ink)", align: "left" }) }}>The</p>
        <p
          style={{
            ...txt(F.serif, 30, 1, { color: "var(--inv-ink)", align: "left" }),
            marginTop: u(8),
            transform: "scaleY(1.12)",
            transformOrigin: "0 0",
          }}
        >
          {role}
        </p>
      </div>
      <div
        data-a
        style={{
          position: "absolute",
          left: u(160),
          top: u(180),
          width: u(126),
          height: u(156),
          background: "#f4f2ee",
          padding: u(6),
          boxShadow: "0 6px 16px rgb(0 0 0 / 0.35)",
          ["--d" as string]: "0.2s",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", background: "#d9d6d0" }}>
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt ?? name}
              fill
              sizes="140px"
              style={{
                objectFit: "cover",
                objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 30}%`,
              }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `${u(120)} ${u(36)} ${u(70)}`,
          background: "linear-gradient(to bottom, transparent, rgb(20 10 10 / 0.75) 45%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3
          ref={ref}
          data-a
          style={{
            ...txt(F.serif, 34, 1.15, { italic: true, color: "#f4efe6" }),
            fontSize: `calc(${u(34)} * var(--fit, 1))`,
            whiteSpace: "nowrap",
            alignSelf: "stretch",
          }}
        >
          {name}
        </h3>
        {parents && (
          <p
            data-a
            style={{
              ...txt(F.sans, 12, 1.55, { color: "rgb(244 239 230 / 0.85)" }),
              marginTop: u(10),
              textWrap: "balance",
              ["--d" as string]: "0.15s",
            }}
          >
            {parents.lead}
            <br />
            {parents.names}
          </p>
        )}
        {ig && (
          <a
            data-a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: u(6),
              marginTop: u(16),
              padding: `${u(5)} ${u(14)}`,
              border: "1px solid rgb(244 239 230 / 0.7)",
              borderRadius: 999,
              ...txt(F.sans, 11, 1, { color: "#f4efe6" }),
              textDecoration: "none",
              pointerEvents: "auto",
              ["--d" as string]: "0.25s",
            }}
          >
            @{p.instagram}
          </a>
        )}
      </div>
    </div>
  );
}

export function SuratMarunCouple() {
  const { inv } = useInvitation();
  if (inv.eventType !== "WEDDING") return null;
  const d = inv.data;
  const [a, b] = couple(d);
  const role = (p: typeof a) => (p === d.bride ? "BRIDE" : "GROOM");
  return (
    <Section id="profil" bg="#2a2626" groups>
      <EnterGroup threshold={0.3}>
        <Person p={a} role={role(a)} />
      </EnterGroup>
      <EnterGroup threshold={0.3}>
        <Person p={b} role={role(b)} />
      </EnterGroup>
    </Section>
  );
}
