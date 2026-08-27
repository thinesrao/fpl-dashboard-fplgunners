"use client";

import { useEffect, useState } from "react";
import type { Dashboard } from "@/lib/types";
import { ANGLES, selectAngle, buildCaption, type AngleId } from "@/lib/report";

const COPIED_TIMEOUT_MS = 1500;

/** Selects the caption text in a hidden-from-flow way and runs the legacy
 * `execCommand('copy')` fallback for browsers/contexts without the async
 * Clipboard API (e.g. older WebViews, non-secure contexts). */
function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the execCommand fallback
  }
  return copyViaExecCommand(text);
}

export default function Caption({
  data,
  onAngleChange,
}: {
  data: Dashboard;
  onAngleChange?: (id: AngleId) => void;
}) {
  const [current, setCurrent] = useState<AngleId>(() => selectAngle(data.report.flags));
  const [copied, setCopied] = useState(false);
  const autoId = selectAngle(data.report.flags);
  const caption = buildCaption(data, current);

  useEffect(() => {
    onAngleChange?.(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const selectAngleTab = (id: AngleId) => {
    setCurrent(id);
  };

  const handleCopy = async () => {
    const ok = await copyText(caption);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_TIMEOUT_MS);
    }
  };

  const handleShare = async () => {
    // Always copy first — Facebook's native share sheet on most platforms
    // drops arbitrary text, so the clipboard copy is the honest fallback
    // that lets people paste the caption into the post themselves.
    await copyText(caption);
    if (navigator.share) {
      try {
        await navigator.share({ title: "GW Report", text: caption });
      } catch {
        // user cancelled or share failed — caption is already copied
      }
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black">Caption</h2>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-[10px] border border-line bg-surface-2 px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-[.04em] text-text transition-colors hover:border-mint hover:text-mint"
          >
            📤 Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-[10px] border-none px-4 py-2.5 font-display text-xs font-extrabold uppercase tracking-[.05em] transition-[filter] hover:brightness-110 ${
              copied ? "bg-gold text-mint-ink" : "bg-mint text-mint-ink"
            }`}
          >
            {copied ? "✓ Copied" : "Copy caption"}
          </button>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap gap-2">
        {ANGLES.map((angle) => (
          <button
            key={angle.id}
            type="button"
            onClick={() => selectAngleTab(angle.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] font-body text-[12.5px] font-semibold transition-colors ${
              angle.id === current
                ? "border-mint bg-mint/14 text-mint"
                : "border-line bg-surface text-muted hover:border-faint hover:text-text"
            }`}
          >
            {angle.icon} {angle.label}
            {angle.id === autoId && (
              <span className="rounded-[5px] bg-mint px-[5px] py-[2px] font-display text-[8.5px] font-extrabold uppercase tracking-[.05em] text-mint-ink">
                auto
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="whitespace-pre-wrap rounded-[14px] border border-line bg-surface p-[18px] font-cjk text-sm leading-[1.8] text-text">
        {caption}
      </div>
    </div>
  );
}
