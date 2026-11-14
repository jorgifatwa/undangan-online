/**
 * Pengganti SVG orisinal (gaya coretan pensil/krayon) untuk setiap slot
 * ornamen Pita Krayon — dipakai bila aset asli berstatus pro/belum dicek di
 * ASSET-AUDIT.md. Warna merah ditentukan lewat token varian.
 */
const S = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const svg = (vb: string, children: React.ReactNode) => (
  <svg viewBox={vb} width="100%" height="100%" aria-hidden style={{ overflow: "visible" }}>
    {children}
  </svg>
);

export const Ribbon = () =>
  svg(
    "0 0 168 172",
    <g {...S} stroke="var(--inv-accent)" strokeWidth={4.5} opacity={0.9}>
      <path d="M84 40 C60 10 18 8 14 28 C10 50 52 52 84 40" />
      <path d="M84 40 C108 10 150 8 154 28 C158 50 116 52 84 40" />
      <path d="M84 40 C78 70 70 110 60 166" />
      <path d="M84 40 C92 76 104 120 112 160" />
    </g>,
  );

export const Sparkle = () =>
  svg(
    "0 0 72 99",
    <path
      d="M36 4 C38 36 40 46 68 50 C40 54 38 64 36 96 C34 64 32 54 4 50 C32 46 34 36 36 4 Z"
      fill="none"
      stroke="#4a4030"
      strokeWidth={3.5}
      strokeLinejoin="round"
      opacity={0.75}
    />,
  );

export const PartyHat = ({ glitter }: { glitter?: boolean }) =>
  svg(
    "0 0 100 143",
    <g>
      <path d="M58 14 L94 132 Q50 146 8 120 Z" fill="var(--inv-red)" />
      {!glitter && (
        <g stroke="var(--inv-deep)" strokeWidth={7} opacity={0.65}>
          <path d="M44 58 L74 66" />
          <path d="M32 86 L84 98" />
        </g>
      )}
      {glitter && (
        <g fill="#fff" opacity={0.35}>
          {[20, 34, 48, 62, 76, 90, 104, 118].map((y, i) => (
            <circle key={y} cx={38 + ((i * 17) % 40)} cy={y} r={2.2} />
          ))}
        </g>
      )}
      <circle cx={60} cy={12} r={10} fill="var(--inv-deep)" />
    </g>,
  );

export const Cake = () =>
  svg(
    "0 0 480 733",
    <g {...S} stroke="#1b1918" strokeWidth={6}>
      <path d="M190 40 L190 230 M290 40 L290 230" />
      <path d="M182 30 Q190 6 198 30 M282 30 Q290 6 298 30" stroke="var(--inv-red)" />
      <path d="M70 240 Q240 200 410 240 L420 380 Q240 410 60 380 Z" fill="#fffdf8" />
      <path d="M40 390 Q240 430 440 390 L450 560 Q240 600 30 560 Z" fill="#fffdf8" />
      <path d="M70 250 Q120 300 150 250 Q190 310 230 255 Q280 300 320 252 Q360 300 405 250" />
      <path d="M200 600 L190 700 M280 600 L290 700 M140 710 L340 710" />
      <path
        d="M240 400 C200 360 150 380 170 410 C190 430 230 410 240 400 C250 360 310 370 300 405 C290 430 250 420 240 400 L220 520 M240 400 L262 515"
        stroke="var(--inv-accent)"
      />
    </g>,
  );

export const DiscoBall = () =>
  svg(
    "0 0 629 800",
    <g {...S} stroke="#1b1918" strokeWidth={7}>
      <path d="M314 0 L314 230" />
      <rect x="276" y="230" width="76" height="34" rx="10" fill="#1b1918" />
      <circle cx="314" cy="480" r="214" />
      <path d="M110 420 Q314 360 518 420 M100 500 Q314 470 528 500 M130 590 Q314 600 498 590" />
      <path d="M314 266 L314 694 M230 280 Q170 480 230 680 M398 280 Q458 480 398 680" />
      <path d="M60 300 l20 -20 M40 620 q20 30 50 10 M560 320 q30 -10 20 30 M580 640 l20 20" />
    </g>,
  );

export const ScallopFrame = () =>
  svg(
    "0 0 440 558",
    <path
      d="M40 30 Q60 10 80 30 Q100 10 120 30 Q140 10 160 30 Q180 10 200 30 Q220 10 240 30 Q260 10 280 30 Q300 10 320 30 Q340 10 360 30 Q380 10 400 30 Q430 40 410 70 Q430 100 410 130 Q430 160 410 190 Q430 220 410 250 Q430 280 410 310 Q430 340 410 370 Q430 400 410 430 Q430 460 410 490 Q420 530 400 528 Q380 548 360 528 Q340 548 320 528 Q300 548 280 528 Q260 548 240 528 Q220 548 200 528 Q180 548 160 528 Q140 548 120 528 Q100 548 80 528 Q60 548 40 528 Q10 520 30 490 Q10 460 30 430 Q10 400 30 370 Q10 340 30 310 Q10 280 30 250 Q10 220 30 190 Q10 160 30 130 Q10 100 30 70 Q10 40 40 30 Z"
      fill="none"
      stroke="var(--inv-red)"
      strokeWidth={9}
    />,
  );

export const WavyFrame = () =>
  svg(
    "0 0 504 739",
    <g {...S} stroke="var(--inv-red)" strokeWidth={8}>
      <path d="M252 70 C150 60 60 110 70 200 C40 300 90 380 60 470 C40 600 140 700 250 690 C380 700 470 620 450 500 C470 400 420 320 450 220 C470 120 360 60 252 70 Z" />
      <path d="M252 70 C210 30 170 30 180 60 C190 80 230 76 252 70 C290 30 330 30 324 60 C318 82 280 78 252 70 L220 150 M252 70 L290 140" />
    </g>,
  );

export const ScribbleCircle = () =>
  svg(
    "0 0 373 364",
    <g {...S} stroke="var(--inv-deep)" strokeWidth={5}>
      <path d="M190 20 C80 10 10 100 22 200 C34 310 150 350 240 330 C340 300 370 200 340 120 C310 40 220 14 150 30" />
      <path d="M170 34 C70 40 30 140 46 220 C64 300 170 336 250 314 C330 290 356 190 320 110" />
    </g>,
  );
