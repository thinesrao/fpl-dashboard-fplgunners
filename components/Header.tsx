import type { Meta } from "@/lib/types";
import CannonLogo from "@/components/CannonLogo";

function LivePill({ gw }: { gw: number }) {
  return (
    <span className="inline-flex flex-none items-center gap-2 rounded-full bg-hot/13 px-3.5 py-2 font-display text-[11px] font-extrabold uppercase tracking-[.12em] text-hot">
      <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-hot" />
      Live · GW{gw}
    </span>
  );
}

export default function Header({ meta }: { meta: Meta }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line pb-[18px]">
      <div className="flex min-w-0 items-center gap-[15px]">
        <CannonLogo className="h-[42px] w-auto flex-none drop-shadow-[0_3px_8px_rgba(239,1,7,0.28)]" />
        <div>
          <h1 className="m-0 font-display text-[clamp(19px,3.4vw,26px)] font-black leading-[1.05] tracking-[.01em]">
            {meta.leagueNameEn}
          </h1>
          <div className="mt-[3px] text-[13px] text-muted">
            {meta.leagueName} · Classic League
          </div>
        </div>
      </div>
      {meta.liveGw !== null && <LivePill gw={meta.liveGw} />}
    </div>
  );
}
