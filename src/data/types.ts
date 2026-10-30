export type PokemonStatus =
  | "alive"
  | "received"
  | "traded"
  | "shiny"
  | "boxed"
  | "missed"
  | "dead"
  | "released";

export interface DeathDetails {
  opponent?: string;
  location?: string;
  notes?: string;
}

export interface Encounter {
  id: string;
  routeId: string;
  pokemonId: number;
  pokemonName?: string;
  nickname?: string;
  status?: PokemonStatus;
  nature?: string;
  caught: boolean;
  notes?: string;
  death?: DeathDetails;
}

export interface Route {
  id: string;
  name: string;
  order: number;
  encounters: string;
  options?: (number | string)[];
  isStarter?: boolean;
  custom?: boolean;
}

export interface BossPokemon {
  pokemonId?: number;
  pokemonName?: string;
  level: number;
  moves?: string[];
  ability?: string;
  item?: string;
  starter?: "fire" | "water" | "grass";
  tera?: string;
}

export interface Boss {
  id: string;
  name: string;
  location: string;
  type: "gym" | "elite-four" | "rival" | "evil-team" | "champion" | "titan";
  order: number;
  levelCap?: number;
  trainerSprite?: string;
  image?: string;
  spriteCredit?: string;
  speciality?: string;
  team: BossPokemon[];
  versions?: string[];
}

export interface GameVersion {
  id: string;
  name: string;
  logoUrl?: string;
}

export type GameSlug =
  | "red-blue"
  | "yellow"
  | "gold-silver"
  | "crystal"
  | "ruby-sapphire"
  | "emerald"
  | "fire-red-leaf-green"
  | "diamond-pearl"
  | "platinum"
  | "heart-gold-soul-silver"
  | "black-white"
  | "black-2-white-2"
  | "x-y"
  | "omega-ruby-alpha-sapphire"
  | "sun-moon"
  | "ultra-sun-ultra-moon"
  | "lets-go-pikachu-eevee"
  | "sword-shield"
  | "brilliant-diamond-shining-pearl"
  | "legends-arceus"
  | "scarlet-violet";

export type ProgressStep =
  | { kind: "route"; item: Route }
  | { kind: "boss"; item: Boss };

export interface Game {
  slug: GameSlug;
  name: string;
  generation: number;
  logoText: string;
  logoUrl?: string;
  logoColor?: string;
  versions: GameVersion[];
  routes: Route[];
  bosses: Boss[];
  steps: ProgressStep[];
  dataAvailable: boolean;
}

export interface GameCustomization {
  steps: ProgressStep[];
}

export type GameCustomizations = Partial<Record<GameSlug, GameCustomization>>;

export interface RunSettings {
  nicknames: boolean;
  levelCaps: boolean;
  suggestions: boolean;
}

export interface Run {
  id: string;
  name: string;
  gameSlug: GameSlug;
  version?: string;
  createdAt: number;
  updatedAt: number;
  encounters: Encounter[];
  defeatedBosses: string[];
  teamIds?: string[];
  starterType?: "fire" | "water" | "grass";
  hiddenRouteIds?: string[];
  customRoutes?: Route[];
  settings?: RunSettings;
  rules: {
    dupesClause: boolean;
    levelCap: boolean;
    shinyClause: boolean;
  };
}

export interface PokeApiPokemon {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: {
    other?: {
      "official-artwork"?: { front_default: string | null };
      home?: { front_default: string | null };
      showdown?: { front_default: string | null };
    };
    versions?: {
      "generation-v"?: {
        "black-white"?: { front_default: string | null };
      };
    };
    front_default: string | null;
  };
}

export type ThemePreference = "system" | "light" | "dark";
