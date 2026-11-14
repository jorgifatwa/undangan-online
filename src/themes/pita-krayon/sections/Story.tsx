"use client";

import { eventStart, firstEvent } from "@/lib/datetime";

import { useCountdown } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { F, Orn, Section, txt, Typewriter, u, useDecor } from "../canvas";
import { Cake, Ribbon, Sparkle } from "../ornaments";

/** Cerita ulang tahun (section "cerita"): judul diketik + paragraf teks polos. */
export function Story() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  if (inv.eventType !== "BIRTHDAY" || !inv.data.story?.text.trim()) return null;
  const title = inv.data.story.title?.trim() || t.story;
  const paras = inv.data.story.text.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <Section id="cerita" style={{ padding: `${u(34)} ${u(30)} ${u(44)}` }}>
      <Orn
        slot="ribbon-b"
        l={18}
        t={10}
        w={40}
        ratio={1.36}
        rotate={-14}
        a="fade"
        d={0.3}
        wiggle
        fallback={<Ribbon />}
      />
      <Orn
        slot="sparkle-c"
        l={378}
        t={30}
        w={18}
        ratio={1.03}
        tint={false}
        a="fade"
        d={0.4}
        fallback={<Sparkle />}
      />
      <h2
        style={{
          ...txt(31, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 }),
          padding: `0 ${u(30)}`,
        }}
      >
        <Typewriter text={title} delay={0.1} />
      </h2>
      <div style={{ marginTop: u(22) }}>
        {paras.map((p, i) => (
          <p
            key={i}
            data-a="fade"
            style={{
              ...txt(15.5, 1.42),
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
              marginTop: i ? u(16) : 0,
              ["--d" as string]: `${0.4 + i * 0.15}s`,
            }}
          >
            {p.trim()}
          </p>
        ))}
      </div>
    </Section>
  );
}

/**
 * "SEE YOU ON 8.8.26" + hitung mundur (angka Arimo miring merah seperti
 * desain) + kue coretan. Setelah hari-H: hitung mundur disembunyikan.
 */
export function Countdown() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const e = firstEvent(inv.data.events);
  const cd = useCountdown(eventStart(e));
  const [y, m, d] = e.date.split("-");
  const short = `${Number(d)}.${Number(m)}.${y.slice(2)}`;
  const vals = [cd.days, cd.hours, cd.minutes, cd.seconds];
  return (
    <Section id="hitungMundur" minHeight={360} style={{ padding: `${u(34)} ${u(26)} 0` }}>
      <h2
        style={{ ...txt(40, 1.02, { color: "var(--inv-red)", weight: 700, ls: 2, align: "left" }) }}
      >
        <span style={{ display: "block" }}>
          <Typewriter text={t.seeYou} delay={0.1} />
        </span>
        <span style={{ display: "block" }}>
          <Typewriter text={`${t.seeYouOn} ${short}`} delay={0.1 + t.seeYou.length * 0.055} />
        </span>
      </h2>
      {!cd.done && (
        <div
          data-a="up"
          role="timer"
          aria-label={`${cd.days} hari ${cd.hours} jam ${cd.minutes} menit lagi`}
          style={{ display: "flex", gap: u(6), marginTop: u(14), ["--d" as string]: "0.6s" }}
        >
          {vals.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: F.count,
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: u(i === 0 ? 38 : 38),
                    lineHeight: 1,
                    color: "var(--inv-red)",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: u(i === 0 ? 30 : 50),
                  }}
                  suppressHydrationWarning
                >
                  {cd.ready ? (i === 0 ? v : String(v).padStart(2, "0")) : i === 0 ? "0" : "00"}
                </p>
                <p
                  style={{
                    ...txt(11, 1, {
                      color: "var(--inv-red)",
                      font: "system-ui, sans-serif",
                      ls: 0.5,
                    }),
                    marginTop: u(6),
                  }}
                >
                  {t.units[i]}
                </p>
              </div>
              {i < 3 && (
                <span
                  aria-hidden
                  style={{
                    fontFamily: F.count,
                    fontSize: u(34),
                    lineHeight: 1,
                    color: "var(--inv-red)",
                    padding: `0 ${u(2)}`,
                  }}
                >
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "relative", height: u(230) }}>
        <Orn slot="cake" l={-26} t={10} w={170} ratio={1.53} a="up" d={0.7} fallback={<Cake />} />
        <Orn
          slot="sparkle-pair"
          l={330}
          t={60}
          w={26}
          ratio={1.22}
          tint={false}
          a="fade"
          d={0.8}
          fallback={<Sparkle />}
        />
      </div>
    </Section>
  );
}
