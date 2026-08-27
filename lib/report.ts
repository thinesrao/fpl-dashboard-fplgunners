import type { Dashboard, ReportFlags } from "./types";

export type AngleId = "record" | "leader" | "tight" | "haul" | "steady";
export const TIGHT_GAP = 15;
export const BIG_HAUL = 100;

export interface Angle {
  id: AngleId;
  label: string;
  icon: string;
  when: (f: ReportFlags) => boolean;
}

export const ANGLES: Angle[] = [
  { id: "record", label: "新紀錄", icon: "🔥", when: (f) => f.recordBroken },
  { id: "leader", label: "榜首易主", icon: "👑", when: (f) => f.leaderChanged },
  { id: "tight", label: "競爭白熱化", icon: "⚔️", when: (f) => f.gapToSecond <= TIGHT_GAP },
  { id: "haul", label: "神級單週", icon: "💥", when: (f) => f.weeklyTopScore >= BIG_HAUL },
  { id: "steady", label: "標準戰報", icon: "🏆", when: () => true },
];

export const selectAngle = (f: ReportFlags): AngleId =>
  (ANGLES.find((a) => a.when(f)) ?? ANGLES[ANGLES.length - 1]).id;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDeadlineMYT(iso: string): string {
  const t = new Date(new Date(iso).getTime() + 8 * 3600 * 1000); // shift to UTC+8, read as UTC parts
  const p = (n: number) => String(n).padStart(2, "0");
  return `${DAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} · ${p(t.getUTCHours())}:${p(t.getUTCMinutes())} MYT`;
}

const intro = (d: Dashboard, id: AngleId): string => {
  const f = d.report.flags;
  const gw = d.meta.lastFinishedGw;
  const t = d.standings;
  switch (id) {
    case "record":
      return `各位經理人，GW${gw} 寫下歷史！🔥\n${d.highestGw.manager} 轟下 ${d.highestGw.score} 分，刷新本季單週最高分紀錄。以下是本週總榜前五 👇`;
    case "leader":
      return `各位經理人，GW${gw} 榜首易主！👑\n${t[0].manager} 本週強勢登頂，取代 ${f.prevLeader} 成為新的領頭羊。完整前五名如下 👇`;
    case "tight":
      return `各位經理人，GW${gw} 落幕，冠軍之爭進入白熱化！⚔️\n榜首與第二名僅差 ${f.gapToSecond} 分，誰都有機會。本週前五名 👇`;
    case "haul":
      return `各位經理人，GW${gw} 有人火力全開！💥\n${d.weeklyTop.manager} 單週狂砍 ${d.weeklyTop.score} 分，冠絕全聯賽。本週前五名 👇`;
    default:
      return `各位經理人，GW${gw} 正式落幕！本週排位再度洗牌，一起看看誰站上了高位 👇`;
  }
};

export function posterHighlight(d: Dashboard, id: AngleId): string {
  const f = d.report.flags;
  const t = d.standings;
  switch (id) {
    case "record":
      return `🔥 新紀錄誕生！${d.highestGw.manager} 改寫本季最高分`;
    case "leader":
      return `👑 榜首易主！${t[0].manager} 登上本季新王座`;
    case "tight":
      return `⚔️ 冠軍懸念！榜首僅領先 ${f.gapToSecond} 分`;
    case "haul":
      return `💥 火力全開！${d.weeklyTop.manager} 單週 ${d.weeklyTop.score} 分`;
    default:
      return `🏆 GW${d.meta.lastFinishedGw} 戰報 · 本週排位出爐`;
  }
}

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
const SEASON_NUMBERS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

export const DASHBOARD_URL = "https://fplgunners.vercel.app"; // TODO(config): set to the live domain at deploy time

export function buildCaption(d: Dashboard, id: AngleId): string {
  const m = d.meta;
  const s = m.seasonLabel.replace(/\D/g, "");
  const rows = d.standings
    .slice(0, 5)
    .map((r, i) => `${MEDALS[i]} ${r.manager}　${r.total}`)
    .join("\n");
  const deadline = formatDeadlineMYT(m.nextGw.deadlineUtc);

  return [
    `${m.leagueName} ｜ FPL ${m.seasonLabel}`,
    `📢 Gameweek ${m.lastFinishedGw} 戰報`,
    ``,
    intro(d, id),
    ``,
    `🏅 本週總榜前五`,
    rows,
    ``,
    `⭐ 本週焦點`,
    `✨ 單週最高分 — ${d.weeklyTop.manager}（${d.weeklyTop.score} 分）`,
    `📈 賽季最高分紀錄 — ${d.highestGw.manager}（${d.highestGw.score} 分）`,
    ``,
    `📊 完整數據與獎項排行`,
    DASHBOARD_URL,
    ``,
    `⏰ 下一個截止時間`,
    `🗓️ Gameweek ${m.nextGw.number} ｜ ${deadline}`,
    `記得在死線前排好陣容，別讓分數溜走！`,
    ``,
    `#槍迷之家超級聯賽第${SEASON_NUMBERS[Number(s)] ?? s}季 #FPLSeason${s} #FPL`,
  ].join("\n");
}
