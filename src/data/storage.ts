import type { GameCustomizations, Run, RunSettings } from "./types";

const RUNS_KEY = "journey-tracker.runs";
const CUSTOMIZATIONS_KEY = "journey-tracker.game-customizations";

export function loadGameCustomizations(): GameCustomizations {
  try {
    const raw = localStorage.getItem(CUSTOMIZATIONS_KEY);
    return raw ? (JSON.parse(raw) as GameCustomizations) : {};
  } catch {
    return {};
  }
}

export function saveGameCustomizations(customizations: GameCustomizations): boolean {
  try {
    localStorage.setItem(CUSTOMIZATIONS_KEY, JSON.stringify(customizations));
    return true;
  } catch {
    return false;
  }
}

export function loadRuns(): Run[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    return raw ? (JSON.parse(raw) as Run[]) : [];
  } catch {
    return [];
  }
}

export function saveRuns(runs: Run[]): void {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function getTeamIds(run: Run): string[] {
  return run.teamIds ?? run.encounters.filter((encounter) => encounter.status === "alive").slice(0, 6).map((encounter) => encounter.id);
}

export function getRunSettings(run: Run): RunSettings {
  return run.settings ?? { nicknames: true, levelCaps: true, suggestions: true };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
