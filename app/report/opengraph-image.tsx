import { ImageResponse } from "next/og";
import { getDashboard } from "@/lib/data";
import { selectAngle, posterHighlight, formatDeadlineMYT, DASHBOARD_URL } from "@/lib/report";

export const size = { width: 1080, height: 1350 };
export const contentType = "image/png";

// Fetch a Noto Sans TC subset containing exactly the glyphs drawn on this
// poster (Latin + the specific Chinese characters in the labels and the
// current manager names). This keeps the route tiny and — because it
// regenerates from live data on every deploy — it can never miss a glyph, so
// there's no bundled megabyte font and no tofu on Chinese names.
async function loadNotoSansTC(text: string): Promise<ArrayBuffer> {
  const url =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=" +
    encodeURIComponent(text);
  const css = await (await fetch(url)).text();
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
  if (!src) throw new Error("Could not resolve Noto Sans TC subset URL");
  const res = await fetch(src[1]);
  if (!res.ok) throw new Error(`Noto Sans TC subset download failed: ${res.status}`);
  return res.arrayBuffer();
}

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

// Color tokens mirrored from app/globals.css (Satori doesn't support CSS vars).
const COLORS = {
  surfaceTop: "#10131a",
  surfaceBottom: "#0a0b0f",
  surface: "rgba(18, 20, 26, 0.8)",
  line: "#242835",
  text: "#e7ecef",
  muted: "#828d9c",
  faint: "#5a6472",
  mint: "#2bfca4",
  gold: "#ffb020",
  hot: "#ff3dae",
};

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginTop: 20,
        marginBottom: 14,
        fontSize: 22,
        fontWeight: 700,
        color: COLORS.muted,
      }}
    >
      <span>{children}</span>
      <span style={{ display: "flex", flex: 1, height: 1, backgroundColor: COLORS.line }} />
    </div>
  );
}

export default async function Image() {
  const data = getDashboard();
  const { meta, standings, weeklyTop, highestGw } = data;
  const angle = selectAngle(data.report.flags);
  const top5 = standings.slice(0, 5);
  const highlight = posterHighlight(data, angle);
  const deadline = formatDeadlineMYT(meta.nextGw.deadlineUtc);
  const seasonDigits = meta.seasonLabel.replace(/\D/g, "");
  const siteHost = DASHBOARD_URL.replace(/^https?:\/\//, "");

  // Every string that will be drawn, so the fetched subset covers all of it.
  const LATIN =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ·—-–：:#!.,/'&()";
  const fontText =
    LATIN +
    [
      meta.leagueName,
      meta.leagueNameEn,
      meta.seasonLabel,
      "FPL 遊戲週戰報 GW",
      highlight,
      "本週總榜前五 Top",
      "本週特別榮譽 Honours",
      "單週最高分",
      "賽季最高分紀錄",
      "Gameweek 截止",
      deadline,
      "Next Deadline",
      siteHost,
      ...top5.map((r) => r.manager),
      weeklyTop.manager,
      highestGw.manager,
    ].join(" ");

  const font = await loadNotoSansTC(fontText);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: COLORS.surfaceBottom,
          backgroundImage: `linear-gradient(to bottom, ${COLORS.surfaceTop}, ${COLORS.surfaceBottom})`,
          color: COLORS.text,
          fontFamily: "Noto Sans TC",
          padding: "60px 60px 48px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            borderBottom: `1px solid ${COLORS.line}`,
            paddingBottom: 35,
          }}
        >
          <svg
            width={70}
            height={34}
            viewBox="0 0 152 74"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <path d="M14 28 Q4 28 4 37 Q4 46 14 46 L44 45 L44 29 Z" fill="#EF0107" />
            <path d="M100 30 L146 33 L146 41 L100 46 Z" fill="#EF0107" />
            <rect x="143" y="31" width="7" height="12" rx="2" fill="#EF0107" />
            <path d="M46 52 Q26 66 8 60 Q25 64 44 50 Z" fill="#EF0107" />
            <circle cx="72" cy="40" r="30" fill="none" stroke="#EF0107" strokeWidth="6" />
            <g stroke="#EF0107" strokeWidth="5" strokeLinecap="round">
              <line x1="72" y1="40" x2="72" y2="13" />
              <line x1="72" y1="40" x2="95" y2="27" />
              <line x1="72" y1="40" x2="95" y2="53" />
              <line x1="72" y1="40" x2="72" y2="67" />
              <line x1="72" y1="40" x2="49" y2="53" />
              <line x1="72" y1="40" x2="49" y2="27" />
            </g>
            <circle cx="72" cy="40" r="9" fill="none" stroke="#EF0107" strokeWidth="5" />
            <circle cx="72" cy="40" r="3" fill="#EF0107" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, lineHeight: 1.15 }}>
              {meta.leagueName}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: COLORS.mint,
              }}
            >
              {`FPL ${meta.seasonLabel} · 遊戲週戰報 · GW${meta.lastFinishedGw}`}
            </div>
          </div>
        </div>

        {/* Highlight */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 30,
            marginBottom: 6,
            fontSize: 34,
            fontWeight: 700,
            color: COLORS.gold,
          }}
        >
          {highlight}
        </div>

        <SectionLabel>本週總榜前五 · Top 5</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {top5.map((row, i) => (
            <div
              key={row.entryId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "13px 0",
                borderBottom: i < top5.length - 1 ? `1px solid ${COLORS.line}` : "none",
              }}
            >
              <div style={{ display: "flex", width: 56, justifyContent: "center", fontSize: 32 }}>
                {MEDALS[i]}
              </div>
              <div style={{ display: "flex", flex: 1, fontSize: 34, fontWeight: 700 }}>
                {row.manager}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 700,
                  color: i === 0 ? COLORS.gold : COLORS.mint,
                }}
              >
                {row.total}
              </div>
            </div>
          ))}
        </div>

        <SectionLabel>本週特別榮譽 · Honours</SectionLabel>
        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              borderRadius: 18,
              border: `1px solid ${COLORS.line}`,
              backgroundColor: COLORS.surface,
              padding: "22px 26px",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: COLORS.muted }}>
              ✨ 單週最高分
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: 54,
                fontWeight: 700,
                lineHeight: 1,
                color: COLORS.mint,
              }}
            >
              {weeklyTop.score}
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 26, color: COLORS.text }}>
              {weeklyTop.manager}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              borderRadius: 18,
              border: `1px solid ${COLORS.line}`,
              backgroundColor: COLORS.surface,
              padding: "22px 26px",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: COLORS.muted }}>
              📈 賽季最高分紀錄
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                fontSize: 54,
                fontWeight: 700,
                lineHeight: 1,
                color: COLORS.gold,
              }}
            >
              {highestGw.score}
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 26, color: COLORS.text }}>
              {highestGw.manager}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginTop: "auto",
            borderTop: `1px solid ${COLORS.line}`,
            paddingTop: 30,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
              {`🗓️ Gameweek ${meta.nextGw.number}`}
            </div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 24, color: COLORS.muted }}>
              {`截止：${deadline}`}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              borderRadius: 999,
              backgroundColor: "rgba(255, 61, 174, 0.14)",
              padding: "12px 22px",
              textAlign: "center",
              fontSize: 22,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              lineHeight: 1.25,
              color: COLORS.hot,
            }}
          >
            <span>Next</span>
            <span>Deadline</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 22,
            fontSize: 22,
            color: COLORS.faint,
          }}
        >
          <span style={{ display: "flex", fontWeight: 700, color: COLORS.mint }}>{siteHost}</span>
          <span style={{ display: "flex" }}>
            {`#FPLSeason${seasonDigits} #${meta.leagueNameEn.replace(/\s+/g, "")}`}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Sans TC", data: font, weight: 700, style: "normal" }],
    },
  );
}
