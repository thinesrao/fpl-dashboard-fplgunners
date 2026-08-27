import { z } from "zod";

export const ManagerSchema = z.object({
  rank: z.number(), lastRank: z.number(), entryId: z.number(),
  manager: z.string(), team: z.string(), gwPoints: z.number(), total: z.number(),
});
const RunnerScore = z.object({ manager: z.string(), score: z.number() });
const RunnerWins = z.object({ manager: z.string(), wins: z.number() });

export const HighestGwSchema = z.object({
  manager: z.string(), team: z.string(), score: z.number(), gw: z.number(),
  runnersUp: z.array(RunnerScore),
});
export const MostMotwSchema = z.object({
  manager: z.string(), team: z.string(), wins: z.number(), lastWinGw: z.number(),
  runnersUp: z.array(RunnerWins),
});
export const WeeklyTopSchema = z.object({
  manager: z.string(), team: z.string(), score: z.number(), gw: z.number(),
});
export const ReportFlagsSchema = z.object({
  recordBroken: z.boolean(), leaderChanged: z.boolean(), prevLeader: z.string(),
  gapToSecond: z.number(), weeklyTopScore: z.number(),
});
export const MetaSchema = z.object({
  leagueId: z.number(), leagueName: z.string(), leagueNameEn: z.string(),
  seasonLabel: z.string(), managerCount: z.number(), lastFinishedGw: z.number(),
  lastUpdatedUtc: z.string(), liveGw: z.number().nullable(),
  nextGw: z.object({ number: z.number(), deadlineUtc: z.string() }),
});
export const DashboardSchema = z.object({
  meta: MetaSchema, standings: z.array(ManagerSchema),
  highestGw: HighestGwSchema, mostMotw: MostMotwSchema,
  weeklyTop: WeeklyTopSchema, report: z.object({ flags: ReportFlagsSchema }),
});
export const ChampionSchema = z.object({
  season: z.string(), manager: z.string(), team: z.string(),
  totalPoints: z.number(), nationalRank: z.string(),
});

export type Manager = z.infer<typeof ManagerSchema>;
export type HighestGw = z.infer<typeof HighestGwSchema>;
export type MostMotw = z.infer<typeof MostMotwSchema>;
export type WeeklyTop = z.infer<typeof WeeklyTopSchema>;
export type ReportFlags = z.infer<typeof ReportFlagsSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type Champion = z.infer<typeof ChampionSchema>;

export const parseDashboard = (json: unknown): Dashboard => DashboardSchema.parse(json);
export const parseChampions = (json: unknown): Champion[] => z.array(ChampionSchema).parse(json);
