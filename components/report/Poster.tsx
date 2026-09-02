import type { Dashboard } from "@/lib/types";
import {
  posterHighlight,
  formatDeadlineMYT,
  DASHBOARD_URL,
  highestGwRace,
  motwRace,
  type AngleId,
  type RaceEntry,
} from "@/lib/report";
import CannonLogo from "@/components/CannonLogo";

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-2 flex items-center gap-[7px] font-cjk text-xs font-bold text-muted">
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function RaceBox({
  icon,
  title,
  race,
  unit,
  valueClass,
}: {
  icon: string;
  title: string;
  race: RaceEntry[];
  unit: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface/80 px-2.5 py-2.5">
      <div className="flex items-center gap-1 font-cjk text-[10px] font-bold text-muted">
        {icon} {title}
      </div>
      <div className="mt-1.5 flex flex-col gap-1">
        {race.map((e, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[11px]">{MEDALS[i]}</span>
            <span
              className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-cjk text-[10.5px] ${i === 0 ? "font-bold text-text" : "text-muted"}`}
            >
              {e.manager}
            </span>
            <span
              className={`font-display text-[12px] font-black ${i === 0 ? valueClass : "text-text"}`}
            >
              {e.value}
              <span className="ml-px text-[8px] text-faint">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The 4:5 shareable Gameweek-Report graphic. Pure/presentational — no
 * `'use client'`, no hooks, no state — so it can be reused as-is inside a
 * `next/og` image route later.
 */
export default function Poster({ data, angle }: { data: Dashboard; angle: AngleId }) {
  const { meta, standings } = data;
  const top5 = standings.slice(0, 5);
  const highlight = posterHighlight(data, angle);
  const deadline = formatDeadlineMYT(meta.nextGw.deadlineUtc);
  const seasonDigits = meta.seasonLabel.replace(/\D/g, "");
  const siteHost = DASHBOARD_URL.replace(/^https?:\/\//, "");
  const hgwRace = highestGwRace(data);
  const motwList = motwRace(data);

  return (
    <div
      data-testid="poster"
      className="relative aspect-[4/5] w-[400px] max-w-full overflow-hidden rounded-[18px] border border-line bg-gradient-to-b from-[#10131a] to-[#0a0b0f] shadow-[0_30px_60px_-25px_rgba(0,0,0,.8)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 40% at 100% 0%, color-mix(in srgb, var(--mint) 16%, transparent), transparent 60%), radial-gradient(50% 34% at 0% 100%, color-mix(in srgb, var(--hot) 12%, transparent), transparent 60%)",
        }}
      />

      <div className="relative z-[1] flex h-full flex-col px-[22px] pt-[22px] pb-[18px]">
        <div className="flex items-center gap-[11px] border-b border-line pb-[13px]">
          <CannonLogo className="h-[26px] w-auto flex-none" />
          <div>
            <div className="font-cjk text-[15px] font-black leading-[1.15]">{meta.leagueName}</div>
            <div className="mt-[2px] font-display text-[10.5px] font-extrabold uppercase tracking-[.08em] text-mint">
              FPL {meta.seasonLabel} · 遊戲週戰報 · GW{meta.lastFinishedGw}
            </div>
          </div>
        </div>

        <div className="mt-[11px] mb-[2px] flex items-center gap-1.5 font-cjk text-[12.5px] font-bold text-gold">
          {highlight}
        </div>

        <SectionLabel>本週總榜前五 · Top 5</SectionLabel>
        <div data-testid="poster-top5">
          {top5.map((row, i) => (
            <div
              key={row.entryId || row.rank}
              className="grid grid-cols-[26px_1fr_auto] items-center gap-2.5 py-[5px]"
            >
              <div className="text-center text-base">{MEDALS[i]}</div>
              <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-cjk text-[14.5px] font-bold">
                {row.manager}
              </div>
              <div
                className={`font-display text-[15px] font-extrabold ${i === 0 ? "text-gold" : "text-mint"}`}
              >
                {row.total}
              </div>
            </div>
          ))}
        </div>

        <SectionLabel>領先者之爭 · Leading the Race</SectionLabel>
        <div className="mt-0.5 grid grid-cols-2 gap-2.5">
          <RaceBox icon="🚀" title="單週最高分" race={hgwRace} unit="分" valueClass="text-mint" />
          <RaceBox icon="👑" title="每週最佳" race={motwList} unit="次" valueClass="text-gold" />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-line pt-[13px]">
          <div>
            <div className="font-display text-[15px] font-black">
              🗓️ Gameweek {meta.nextGw.number}
            </div>
            <div className="mt-px font-cjk text-[11px] text-muted">截止：{deadline}</div>
          </div>
          <div className="flex-none rounded-full bg-hot/14 px-2.5 py-1.5 text-center font-display text-[10px] font-extrabold uppercase leading-[1.25] tracking-[.06em] text-hot">
            Next
            <br />
            Deadline
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-faint">
          <span className="font-bold text-mint">{siteHost}</span>
          <span>
            #FPLSeason{seasonDigits} #{meta.leagueNameEn.replace(/\s+/g, "")}
          </span>
        </div>
      </div>
    </div>
  );
}
