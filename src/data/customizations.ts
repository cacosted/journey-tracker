import { getGame } from "./games";
import type { Boss, Game, GameCustomization, GameCustomizations, ProgressStep, Route } from "./types";

export function getCustomizedGame(slug: string, versionId: string | undefined, customizations: GameCustomizations): Game | undefined {
  const game = getGame(slug, versionId);
  if (!game) return undefined;
  return resolveGame(game, versionId, customizations[game.slug]);
}

export function getGameForEditor(slug: string, customizations: GameCustomizations): Game | undefined {
  const game = getGame(slug);
  if (!game) return undefined;
  return resolveGame(game, undefined, customizations[game.slug], false);
}

export function resolveGame(game: Game, versionId: string | undefined, customization?: GameCustomization, filterByVersion = true): Game {
  const version = game.versions.find((item) => item.id === versionId) ?? game.versions[0];
  const source = customization?.steps ?? game.steps;
  const steps: ProgressStep[] = source
    .filter((step) => step.kind !== "boss" || !filterByVersion || !step.item.versions?.length || step.item.versions.includes(version.id))
    .sort((a, b) => a.item.order - b.item.order)
    .map((step, order): ProgressStep => step.kind === "route"
      ? { kind: "route", item: { ...step.item, order } }
      : { kind: "boss", item: { ...step.item, order } });
  const routes = steps.filter((step): step is { kind: "route"; item: Route } => step.kind === "route").map((step) => step.item);
  const bosses = steps.filter((step): step is { kind: "boss"; item: Boss } => step.kind === "boss").map((step) => step.item);
  return { ...game, logoUrl: version.logoUrl, routes, bosses, steps };
}
