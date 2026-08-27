import { getDashboard, getReigningChampion } from "@/lib/data";
import Header from "@/components/Header";
import HeroCards from "@/components/HeroCards";
import Standings from "@/components/Standings";
import ChampionPlate from "@/components/ChampionPlate";

export default function Page() {
  const data = getDashboard();
  const champion = getReigningChampion();

  return (
    <main className="mx-auto max-w-[1060px] px-5 pb-20 pt-[26px]">
      <Header meta={data.meta} />
      <p className="mt-[13px] flex items-start gap-[7px] text-[12.5px] text-faint">
        <span>
          <b className="font-semibold text-muted">
            {data.meta.managerCount} managers
          </b>{" "}
          · Standings final through Gameweek {data.meta.lastFinishedGw} ·
          updates automatically after each gameweek settles
        </span>
      </p>
      <HeroCards data={data} />
      <Standings rows={data.standings} totalCount={data.meta.managerCount} />

      <section>
        <div className="mx-0 mt-14 mb-5 text-center">
          <div className="font-display text-[11.5px] font-extrabold uppercase tracking-[.14em] text-gold">
            🏆 Reigning Champion
          </div>
          <h2 className="mx-0 mt-[.3em] mb-[.2em] font-display text-[clamp(22px,4vw,32px)] font-black">
            What you&rsquo;re playing for
          </h2>
          <p className="mx-auto max-w-[52ch] text-sm text-muted">
            One engraved plate. Awarded to the Classic League champion each
            season — re-engraved automatically with the new winner.
          </p>
        </div>
        <div
          className="grid place-items-center rounded-[20px] border border-line px-4 pb-[30px] pt-7"
          style={{
            background:
              "radial-gradient(58% 58% at 50% 44%, #1a1e27, #0a0b0f 80%)",
          }}
        >
          <ChampionPlate champion={champion} />
        </div>
      </section>
    </main>
  );
}
