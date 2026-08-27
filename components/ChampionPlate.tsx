import type { Champion } from "@/lib/types";

const CX = 200;
const CY = 200;
const RING_RADIUS = 168;
const ROSE_COUNT = 14;

const ROSE_PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

type Placement = {
  key: string;
  x: number;
  y: number;
  rotationDeg: number;
};

function buildRosePlacements(): Placement[] {
  const placements: Placement[] = [];
  for (let i = 0; i < ROSE_COUNT; i++) {
    const angle = (i / ROSE_COUNT) * Math.PI * 2;
    const x = CX + Math.cos(angle) * RING_RADIUS;
    const y = CY + Math.sin(angle) * RING_RADIUS;
    const rotationDeg = (angle * 180) / Math.PI + 90;
    placements.push({ key: `rose-${i}`, x, y, rotationDeg });
  }
  return placements;
}

function buildLeafPlacements(): Placement[] {
  const placements: Placement[] = [];
  for (let i = 0; i < ROSE_COUNT; i++) {
    const angle = ((i + 0.5) / ROSE_COUNT) * Math.PI * 2;
    const angleDeg = (angle * 180) / Math.PI;

    const outerX = CX + Math.cos(angle) * (RING_RADIUS + 9);
    const outerY = CY + Math.sin(angle) * (RING_RADIUS + 9);
    placements.push({
      key: `leaf-outer-${i}`,
      x: outerX,
      y: outerY,
      rotationDeg: angleDeg + 90,
    });

    const innerX = CX + Math.cos(angle) * (RING_RADIUS - 9);
    const innerY = CY + Math.sin(angle) * (RING_RADIUS - 9);
    placements.push({
      key: `leaf-inner-${i}`,
      x: innerX,
      y: innerY,
      rotationDeg: angleDeg - 90,
    });
  }
  return placements;
}

const ROSE_PLACEMENTS = buildRosePlacements();
const LEAF_PLACEMENTS = buildLeafPlacements();

function Rose() {
  return (
    <g filter="url(#emb)">
      <circle r="4.2" fill="#b8b3ab" />
      <g fill="#c5c0b8" stroke="#a49f97" strokeWidth="0.5">
        {ROSE_PETAL_ANGLES.map((deg) => (
          <ellipse
            key={deg}
            rx="3.2"
            ry="5.6"
            cy="-6"
            transform={deg === 0 ? undefined : `rotate(${deg})`}
          />
        ))}
      </g>
      <circle r="2.6" fill="#aca79f" />
    </g>
  );
}

function Leaf() {
  return (
    <ellipse
      rx="2.4"
      ry="5"
      fill="#bdb8b0"
      stroke="#a49f97"
      strokeWidth="0.4"
      filter="url(#emb)"
    />
  );
}

function FloralRing() {
  return (
    <svg
      className="ring pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 400"
      aria-hidden="true"
    >
      <defs>
        <filter id="emb" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="0.6"
            floodColor="#ffffff"
            floodOpacity="0.55"
          />
          <feDropShadow
            dx="0"
            dy="-1"
            stdDeviation="0.7"
            floodColor="#000000"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      {[RING_RADIUS + 16, RING_RADIUS - 16].map((rr) => (
        <circle
          key={rr}
          cx={CX}
          cy={CY}
          r={rr}
          fill="none"
          stroke="#8f8a82"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      ))}
      {ROSE_PLACEMENTS.map(({ key, x, y, rotationDeg }) => (
        <g key={key} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rotationDeg.toFixed(1)})`}>
          <Rose />
        </g>
      ))}
      {LEAF_PLACEMENTS.map(({ key, x, y, rotationDeg }) => (
        <g key={key} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rotationDeg.toFixed(1)})`}>
          <Leaf />
        </g>
      ))}
    </svg>
  );
}

function LaurelBranch({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 40"
      fill="#2b2f35"
      className="h-[19px] w-auto opacity-80"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M20 2C10 6 5 16 6 30c0 4 1 7 3 8-6-3-9-10-8-18C2 11 9 4 20 2z" />
    </svg>
  );
}

function seasonLabel(season: string): string {
  // "2025/26" -> "2025 / 26"
  return season.replace(/\s*\/\s*/, " / ");
}

export default function ChampionPlate({ champion }: { champion: Champion }) {
  const { season, manager, team, totalPoints, nationalRank } = champion;

  return (
    <div
      className="relative grid aspect-square w-[min(380px,84vw)] place-items-center rounded-full"
      style={{
        background:
          "radial-gradient(circle at 50% 38%, #f3f0ec 0%, #d9d5cf 34%, #b7b2ab 60%, #9a958d 78%, #cfcac2 92%, #8f8a82 100%)",
        boxShadow:
          "0 30px 60px -18px rgba(0,0,0,.8), inset 0 2px 6px rgba(255,255,255,.5), inset 0 -8px 20px rgba(0,0,0,.28)",
      }}
    >
      <div
        className="absolute inset-[11%] rounded-full"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,.05) 0deg 2deg, rgba(0,0,0,.04) 2deg 4deg), radial-gradient(circle at 50% 40%, #efece7, #c9c4bc 70%, #b3aea6 100%)",
          boxShadow:
            "inset 0 3px 10px rgba(0,0,0,.30), inset 0 -2px 6px rgba(255,255,255,.4)",
        }}
      />
      <FloralRing />
      <div
        className="relative z-[2] w-[64%] text-center text-[#33373d]"
        style={{ textShadow: "0 1px 0 rgba(255,255,255,.55)" }}
      >
        <svg
          viewBox="0 0 64 40"
          fill="#2b2f35"
          className="mx-auto mb-1 block h-auto w-11"
        >
          <path d="M6 34h52l3-22-14 10-9-18-9 18-14-10z" />
          <circle cx="6" cy="9" r="3.4" />
          <circle cx="58" cy="9" r="3.4" />
          <circle cx="32" cy="4" r="3.4" />
        </svg>
        <div className="font-cjk text-[clamp(12px,3.2vw,15px)] font-bold">
          枪迷之家
        </div>
        <div className="mt-[3px] font-serif text-[clamp(9px,2.4vw,11px)] font-bold tracking-[.06em]">
          FANTASY PREMIER LEAGUE
        </div>
        <div className="font-serif text-[clamp(9px,2.3vw,10.5px)] font-semibold opacity-85">
          {seasonLabel(season)}
        </div>
        <div className="my-[3px] font-serif text-[clamp(16px,4.6vw,24px)] font-black tracking-[.04em]">
          CHAMPION
        </div>
        <div className="my-[2px] flex items-center justify-center gap-2">
          <LaurelBranch />
          <div>
            <div className="font-serif text-[clamp(12px,3.2vw,16px)] font-extrabold leading-[1.1]">
              {manager}
            </div>
            <div className="text-[clamp(9px,2.3vw,11px)] opacity-80">
              {team}
            </div>
          </div>
          <LaurelBranch flip />
        </div>
        <div className="mt-[5px] font-serif text-[clamp(9px,2.2vw,10.5px)] font-bold leading-[1.35]">
          Total Points {totalPoints} · {nationalRank}
        </div>
      </div>
    </div>
  );
}
