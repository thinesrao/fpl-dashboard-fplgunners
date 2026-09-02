import type { Dashboard } from "@/lib/types";
import { highestGwRace, motwRace, type RaceEntry } from "@/lib/report";

type Accent = "mint" | "hot" | "gold";

const GLOW_BG: Record<Accent, string> = {
  mint: "bg-mint",
  hot: "bg-hot",
  gold: "bg-gold",
};

const BIG_TEXT: Record<Accent, string> = {
  mint: "text-mint",
  hot: "text-hot",
  gold: "text-gold",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function Card({
  accent,
  icon,
  eyebrow,
  big,
  name,
  meta,
  testId,
  children,
}: {
  accent: Accent;
  icon: string;
  eyebrow: string;
  big: number;
  name: string;
  meta: string;
  testId: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className="relative overflow-hidden rounded-[18px] border border-line bg-surface p-[18px_19px]"
    >
      <div
        className={`pointer-events-none absolute -right-[45px] -top-[45px] h-[150px] w-[150px] rounded-full opacity-20 blur-[32px] ${GLOW_BG[accent]}`}
      />
      <div className="flex items-center gap-2 font-display text-[11.5px] font-extrabold uppercase tracking-[.08em] text-muted">
        <span className="text-[15px]">{icon}</span>
        {eyebrow}
      </div>
      <div
        className={`mt-3 mb-[3px] font-display text-[clamp(46px,7vw,62px)] font-black leading-[.9] tracking-[-.02em] ${BIG_TEXT[accent]}`}
      >
        {big}
      </div>
      <div className="text-[17px] font-bold leading-[1.15]">{name}</div>
      <div className="mt-[2px] text-[12.5px] text-muted">{meta}</div>
      {children}
    </div>
  );
}

function RaceCard({
  accent,
  icon,
  title,
  race,
  unit,
  testId,
}: {
  accent: "hot" | "gold";
  icon: string;
  title: string;
  race: RaceEntry[];
  unit: string;
  testId: string;
}) {
  const valueColor = accent === "hot" ? "text-hot" : "text-gold";
  const badge = accent === "hot" ? "bg-hot/12 text-hot" : "bg-gold/14 text-gold";
  return (
    <div
      data-testid={testId}
      className="relative overflow-hidden rounded-[18px] border border-line bg-surface p-[18px_19px]"
    >
      <div
        className={`pointer-events-none absolute -right-[45px] -top-[45px] h-[150px] w-[150px] rounded-full opacity-20 blur-[32px] ${GLOW_BG[accent]}`}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-[11.5px] font-extrabold uppercase tracking-[.08em] text-muted">
          <span className="text-[15px]">{icon}</span>
          {title}
        </div>
        <span
          className={`flex-none rounded-full px-2 py-1 font-display text-[8.5px] font-extrabold uppercase tracking-[.07em] ${badge}`}
        >
          🏁 Leading the race
        </span>
      </div>
      <div className="mt-3.5 flex flex-col gap-2.5">
        {race.map((e, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-5 flex-none text-center text-[15px]">{MEDALS[i]}</span>
            <span
              className={`flex-1 truncate text-[14.5px] ${i === 0 ? "font-bold" : "font-medium text-muted"}`}
            >
              {e.manager}
            </span>
            <span
              className={`font-display text-[18px] font-black tabular-nums ${i === 0 ? valueColor : "text-text"}`}
            >
              {e.value}
              <span className="ml-1 text-[10px] font-semibold text-faint">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroCards({ data }: { data: Dashboard }) {
  const leader = data.standings[0];
  const { meta } = data;

  return (
    <section className="mt-5 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
      <Card
        accent="mint"
        icon="🥇"
        eyebrow="Current Leader"
        big={leader.total}
        name={leader.manager}
        meta={`${leader.team} · ${meta.managerCount} managers chasing`}
        testId="hero-leader"
      >
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/14 px-[9px] py-1 font-display text-[10px] font-extrabold uppercase tracking-[.06em] text-gold">
          <span
            className="h-[13px] w-[13px] rounded-full shadow-[inset_0_-1px_2px_rgba(0,0,0,.3)]"
            style={{
              background:
                "radial-gradient(circle at 50% 38%, #f0ede8, #b7b2aa 70%, #948f87)",
            }}
          />
          Chasing the plate
        </span>
      </Card>

      <RaceCard
        accent="hot"
        icon="🚀"
        title="Highest Gameweek Score"
        race={highestGwRace(data)}
        unit="pts"
        testId="hero-highest"
      />

      <RaceCard
        accent="gold"
        icon="👑"
        title="Most Manager of the Week"
        race={motwRace(data)}
        unit="×"
        testId="hero-motw"
      />
    </section>
  );
}
