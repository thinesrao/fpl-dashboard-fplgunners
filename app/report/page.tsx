import { getDashboard } from "@/lib/data";
import ReportClient from "@/components/report/ReportClient";

export default function ReportPage() {
  const data = getDashboard();

  return (
    <main className="mx-auto max-w-[1040px] px-5 pb-20 pt-[30px]">
      <div>
        <div className="font-display text-xs font-extrabold uppercase tracking-[.13em] text-mint">
          Gameweek Report · Facebook post generator
        </div>
        <h1 className="my-[.25em] mb-[.3em] font-display text-[clamp(24px,4.4vw,36px)] font-black">
          Poster + caption that adapt to the week
        </h1>
        <p className="max-w-[66ch] text-[15px] text-muted">
          After each gameweek settles, the app auto-picks the week&rsquo;s
          story — a broken record, a new leader, a tight race, a monster
          haul — and writes the caption around it. Copy the words, share the
          poster.
        </p>
      </div>

      <ReportClient data={data} />
    </main>
  );
}
