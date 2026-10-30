import type { PokemonStatus } from "./types";

export const STATUS_LABELS: Record<PokemonStatus, string> = {
  alive: "Atrapado",
  received: "Recibido",
  traded: "Intercambiado",
  shiny: "Shiny",
  boxed: "En caja",
  missed: "Perdido",
  dead: "Muerto",
  released: "Liberado",
};

export function isAvailableStatus(status?: PokemonStatus): boolean {
  return status === "alive" || status === "received" || status === "traded" || status === "shiny" || status === "boxed";
}
