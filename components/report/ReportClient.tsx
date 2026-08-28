"use client";

import { useState } from "react";
import type { Dashboard } from "@/lib/types";
import { selectAngle, type AngleId } from "@/lib/report";
import Poster from "@/components/report/Poster";
import Caption from "@/components/report/Caption";

/**
 * Client-side glue between the (pure) `Poster` and the (stateful) `Caption`.
 * Holds the selected report `angle` so that picking a caption angle updates
 * the poster's headline live, without either component needing to know
 * about the other.
 */
export default function ReportClient({ data }: { data: Dashboard }) {
  const [angle, setAngle] = useState<AngleId>(() =>
    selectAngle(data.report.flags)
  );

  return (
    <div className="mt-6 grid grid-cols-[400px_1fr] items-start gap-[22px] max-[820px]:grid-cols-1">
      <div className="sticky top-5 max-[820px]:static">
        <Poster data={data} angle={angle} />
        <div className="mt-3.5">
          <a
            href="/report/opengraph-image"
            download="gameweek-report.png"
            className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-mint px-4 py-3 font-display text-sm font-extrabold uppercase tracking-[.04em] text-mint-ink shadow-[0_4px_14px_rgba(43,252,164,.28)] transition hover:brightness-110"
          >
            ⬇ Download poster (PNG)
          </a>
          <p className="mt-2 text-center text-[11.5px] text-faint">
            Save the image, copy the caption on the right, then paste both into
            your Facebook group.
          </p>
        </div>
      </div>

      <Caption data={data} onAngleChange={setAngle} />
    </div>
  );
}
