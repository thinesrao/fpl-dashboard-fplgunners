import type { Dashboard } from "@/lib/types";

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

export default function HeroCards({ data }: { data: Dashboard }) {
  const leader = data.standings[0];
  const { highestGw, mostMotw, meta } = data;

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <Card
        accent="hot"
        icon="🚀"
        eyebrow="Highest Gameweek Score"
        big={highestGw.score}
        name={highestGw.manager}
        meta={`${highestGw.team} · achieved in Gameweek ${highestGw.gw}`}
        testId="hero-highest"
      />

      <Card
        accent="gold"
        icon="👑"
        eyebrow="Most Manager of the Week"
        big={mostMotw.wins}
        name={mostMotw.manager}
        meta={`${mostMotw.team} · last won in Gameweek ${mostMotw.lastWinGw}`}
        testId="hero-motw"
      />
    </section>
  );
}
