"use client";

import { useState } from "react";
import type { Manager } from "@/lib/types";

const PODIUM_ROW: Record<1 | 2 | 3, string> = {
  1: "bg-gold/8",
  2: "bg-gold/4",
  3: "bg-gold/4",
};

const PODIUM_RANK: Record<1 | 2 | 3, string> = {
  1: "text-gold",
  2: "text-[#cdd6e0]",
  3: "text-[#e0894b]",
};

function Movement({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (lastRank === 0) {
    return <div className="text-center text-xs font-bold text-gold">NEW</div>;
  }
  if (lastRank > rank) {
    return (
      <div className="text-center text-xs font-bold text-up">
        ▲{lastRank - rank}
      </div>
    );
  }
  if (lastRank < rank) {
    return (
      <div className="text-center text-xs font-bold text-down">
        ▼{rank - lastRank}
      </div>
    );
  }
  return <div className="text-center text-xs font-bold text-faint">–</div>;
}

function Row({ row }: { row: Manager }) {
  const podium = row.rank <= 3 ? (row.rank as 1 | 2 | 3) : null;

  return (
    <div
      data-testid="standings-row"
      className={`grid grid-cols-[52px_1fr_66px_60px_74px] items-center gap-2.5 border-b border-line/55 px-5 py-[11px] transition-colors hover:bg-surface-2 ${
        podium ? PODIUM_ROW[podium] : ""
      }`}
    >
      <div
        className={`text-center font-display text-base font-black ${
          podium ? PODIUM_RANK[podium] : "text-muted"
        }`}
      >
        {row.rank}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold leading-tight">
          {row.manager}
          {row.rank === 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-[7px] py-[3px] font-display text-[9.5px] font-extrabold uppercase tracking-[.05em] text-gold">
              <span
                className="h-3 w-3 rounded-full shadow-[inset_0_-1px_2px_rgba(0,0,0,.3)]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 38%, #f0ede8, #b7b2aa 70%, #948f87)",
                }}
              />
              Chasing the plate
            </span>
          )}
        </div>
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
          {row.team}
        </div>
      </div>
      <Movement rank={row.rank} lastRank={row.lastRank} />
      <div className="text-center text-sm text-muted">{row.gwPoints}</div>
      <div
        className={`text-right font-display text-base font-extrabold ${
          row.rank === 1 ? "text-mint" : ""
        }`}
      >
        {row.total}
      </div>
    </div>
  );
}

export default function Standings({
  rows,
  totalCount,
}: {
  rows: Manager[];
  totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const visibleRows = isSearching
    ? rows.filter(
        (row) =>
          row.manager.toLowerCase().includes(trimmedQuery) ||
          row.team.toLowerCase().includes(trimmedQuery),
      )
    : expanded
      ? rows
      : rows.slice(0, 3);

  return (
    <section className="mt-6 overflow-hidden rounded-[18px] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-[17px]">
        <h2 className="flex items-center gap-2 font-display text-[19px] font-black tracking-[.01em]">
          🏆 Classic League
        </h2>
        <label className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className="pointer-events-none absolute left-[11px] top-1/2 h-[15px] w-[15px] -translate-y-1/2 stroke-faint"
          >
            <circle cx={11} cy={11} r={7} />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            autoComplete="off"
            placeholder="Find manager or team…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-[220px] max-w-[52vw] rounded-[10px] border border-line bg-bg py-[9px] pl-[34px] pr-3 text-sm text-text placeholder:text-faint focus:border-mint focus:shadow-[0_0_0_3px_rgba(43,252,164,.18)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-[52px_1fr_66px_60px_74px] items-center gap-2.5 border-b border-line px-5 py-[10px] font-display text-[11px] font-bold uppercase tracking-[.07em] text-faint">
        <div className="text-center">Rank</div>
        <div>Manager</div>
        <div className="text-center">Move</div>
        <div className="text-center">GW</div>
        <div className="text-right">Total</div>
      </div>

      <div>
        {visibleRows.map((row) => (
          <Row key={row.entryId} row={row} />
        ))}
      </div>

      {visibleRows.length === 0 && (
        <div className="px-5 py-[30px] text-center text-sm text-muted">
          No manager or team matches that search.
        </div>
      )}

      {!isSearching && (
        <div className="flex justify-center border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="rounded-[10px] border border-line bg-surface-2 px-[18px] py-[9px] font-display text-xs font-extrabold uppercase tracking-[.05em] transition-colors hover:border-mint hover:text-mint"
          >
            {expanded ? "Show less ▴" : "Show top 20 ▾"}
          </button>
        </div>
      )}

      <p className="sr-only">{totalCount} managers</p>
    </section>
  );
}
