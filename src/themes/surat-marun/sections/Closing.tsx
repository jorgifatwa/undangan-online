"use client";

import { couple, shortName } from "../../_shared/format";
import { useInvitation } from "../../_shared/runtime/context";
import { Monogram, Paperclip, paperCard } from "../art/Ornaments";
import { F, Section, txt, u } from "../canvas";

/**
 * Penutup (marun): catatan krem dengan penjepit kertas — "DEAR OUR FAMILY &
 * FRIENDS", "Thank You" skrip, kotak bergaris berisi kalimat penutup; lalu
 * "WITH LOVE," dan monogram inisial bergaya bordir.
 */
const FALLBACK =
  "for celebrating our wedding day with us. It was truly the most wonderful day of our lives and it wouldn't have been the same without you!\n\nWe are incredibly grateful for your generosity, love and presence on such a special occasion.";

export function SuratMarunClosing() {
  const { inv } = useInvitation();
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const [a, b] = d ? couple(d) : [null, null];
  const text = inv.data.greeting?.closingText ?? FALLBACK;
  return (
    <Section id="penutup" style={{ padding: `${u(70)} 0 ${u(80)}` }}>
      <div
        data-a
        style={{
          position: "relative",
          width: u(210),
          margin: "0 auto",
          ...paperCard(),
          padding: `${u(28)} ${u(12)} ${u(14)}`,
        }}
      >
        <Paperclip
          style={{ position: "absolute", left: u(6), top: u(-10), width: u(12), height: u(34) }}
        />
        <p style={txt(F.sans, 5.5, 1.3, { color: "#5a2a2a", ls: 0.8 })}>
          DEAR OUR FAMILY &amp; FRIENDS
        </p>
        <p style={{ ...txt(F.script, 30, 1.2, { color: "#5a2a2a" }), marginTop: u(14) }}>
          Thank You
        </p>
        <div
          style={{
            marginTop: u(16),
            border: "1px solid rgb(90 42 42 / 0.45)",
            padding: `${u(26)} ${u(18)}`,
          }}
        >
          <p
            style={{
              ...txt(F.sans, 8.4, 1.55, { italic: true, color: "#5a2a2a" }),
              whiteSpace: "pre-line",
            }}
          >
            {text}
          </p>
        </div>
      </div>
      <p
        data-a
        style={{
          ...txt(F.sans, 5.5, 1.3, { color: "var(--inv-cream)", ls: 0.6 }),
          marginTop: u(24),
          ["--d" as string]: "0.2s",
        }}
      >
        WITH LOVE,
      </p>
      {a && b && (
        <div
          data-a
          style={{
            width: u(150),
            height: u(116),
            margin: `${u(6)} auto 0`,
            ["--d" as string]: "0.35s",
          }}
        >
          <Monogram
            a={shortName(a)[0]}
            b={shortName(b)[0]}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}
    </Section>
  );
}
