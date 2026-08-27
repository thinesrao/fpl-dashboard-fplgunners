import fs from "node:fs";
import path from "node:path";
import { parseDashboard, parseChampions, type Dashboard, type Champion } from "./types";

const read = (rel: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));

export const getDashboard = (): Dashboard => parseDashboard(read("data/dashboard.json"));
export const getChampions = (): Champion[] => parseChampions(read("data/champions.json"));
export const getReigningChampion = (): Champion => getChampions()[0];
