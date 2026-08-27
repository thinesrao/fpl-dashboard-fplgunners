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
        <div className="mt-3.5 flex gap-2.5">
          <a
            href="/report/opengraph-image"
            className="flex-1 rounded-[11px] border border-line bg-surface-2 px-[11px] py-[11px] text-center font-display text-xs font-extrabold uppercase tracking-[.04em] text-text transition-colors hover:border-mint hover:text-mint"
          >
            ⬇ Image
          </a>
        </div>
      </div>

      <Caption data={data} onAngleChange={setAngle} />
    </div>
  );
}
