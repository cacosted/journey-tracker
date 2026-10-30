import leagueJson from "./league.json";
import routeJson from "./routes.json";
import type { Boss, BossPokemon, Game, GameSlug, ProgressStep, Route } from "./types";
import { getGameVersions, VARIANT_BOSSES } from "./versions";

interface ReferenceRoute {
  type: "route" | "gym";
  name: string;
  encounters?: string[];
  value?: string;
  group?: string;
  boss?: string;
}

interface ReferenceBossPokemon {
  name: string;
  level: string;
  moves?: string[];
  ability?: string;
  item?: string;
  starter?: "fire" | "water" | "grass";
  tera?: string;
}

interface ReferenceBoss {
  name: string;
  speciality?: string;
  img?: { src?: string; author?: string } | string;
  pokemon: ReferenceBossPokemon[];
}

const ROUTES = routeJson as Record<string, ReferenceRoute[]>;
const LEAGUES = leagueJson as Record<string, Record<string, ReferenceBoss>>;

const LOGO_URLS: Record<GameSlug, string> = {
  "red-blue": "https://img.pokemondb.net/boxes/red.jpg",
  yellow: "https://img.pokemondb.net/boxes/yellow.jpg",
  "gold-silver": "https://img.pokemondb.net/boxes/gold.jpg",
  crystal: "https://img.pokemondb.net/boxes/crystal.jpg",
  "ruby-sapphire": "https://img.pokemondb.net/boxes/ruby.jpg",
  emerald: "https://img.pokemondb.net/boxes/emerald.jpg",
  "fire-red-leaf-green": "https://img.pokemondb.net/boxes/firered.jpg",
  "diamond-pearl": "https://img.pokemondb.net/boxes/diamond.jpg",
  platinum: "https://img.pokemondb.net/boxes/platinum.jpg",
  "heart-gold-soul-silver": "https://img.pokemondb.net/boxes/heartgold.jpg",
  "black-white": "https://img.pokemondb.net/boxes/black.jpg",
  "black-2-white-2": `${import.meta.env.BASE_URL}games/black-2-white-2.jpg`,
  "x-y": "https://img.pokemondb.net/boxes/x.jpg",
  "omega-ruby-alpha-sapphire": "https://img.pokemondb.net/boxes/omega-ruby.jpg",
  "sun-moon": "https://img.pokemondb.net/boxes/sun.jpg",
  "ultra-sun-ultra-moon": "https://img.pokemondb.net/boxes/ultra-sun.jpg",
  "lets-go-pikachu-eevee": "https://img.pokemondb.net/boxes/lets-go-pikachu.jpg",
  "sword-shield": "https://img.pokemondb.net/boxes/sword.jpg",
  "brilliant-diamond-shining-pearl": "https://img.pokemondb.net/boxes/brilliant-diamond.jpg",
  "legends-arceus": "https://img.pokemondb.net/boxes/legends-arceus.jpg",
  "scarlet-violet": "https://img.pokemondb.net/boxes/scarlet.jpg",
};

const GEN_COLORS: Record<number, string> = {
  1: "#e3350d",
  2: "#d4af37",
  3: "#d32f2f",
  4: "#1976d2",
  5: "#111516",
  6: "#7b1fa2",
  7: "#f57c00",
  8: "#388e3c",
  9: "#7c4dff",
};

interface GameDefinition {
  slug: GameSlug;
  name: string;
  generation: number;
  routeKey?: string;
  leagueKey?: string;
}

const DEFINITIONS: GameDefinition[] = [
  { slug: "red-blue", name: "Red / Blue", generation: 1, routeKey: "rb", leagueKey: "rb" },
  { slug: "yellow", name: "Yellow", generation: 1, routeKey: "yel", leagueKey: "yel" },
  { slug: "gold-silver", name: "Gold / Silver", generation: 2, routeKey: "gsc", leagueKey: "gsc" },
  { slug: "crystal", name: "Crystal", generation: 2, routeKey: "crys", leagueKey: "gsc" },
  { slug: "ruby-sapphire", name: "Ruby / Sapphire", generation: 3, routeKey: "ruby", leagueKey: "rs" },
  { slug: "emerald", name: "Emerald", generation: 3, routeKey: "em", leagueKey: "em" },
  { slug: "fire-red-leaf-green", name: "FireRed / LeafGreen", generation: 3, routeKey: "frlg", leagueKey: "frlg" },
  { slug: "diamond-pearl", name: "Diamond / Pearl", generation: 4, routeKey: "dp", leagueKey: "dp" },
  { slug: "platinum", name: "Platinum", generation: 4, routeKey: "plat", leagueKey: "plat" },
  { slug: "heart-gold-soul-silver", name: "HeartGold / SoulSilver", generation: 4, routeKey: "hg", leagueKey: "hgss" },
  { slug: "black-white", name: "Black / White", generation: 5, routeKey: "bl", leagueKey: "bw" },
  { slug: "black-2-white-2", name: "Black 2 / White 2", generation: 5, routeKey: "b2w2", leagueKey: "b2w2" },
  { slug: "x-y", name: "X / Y", generation: 6, routeKey: "xy", leagueKey: "xy" },
  { slug: "omega-ruby-alpha-sapphire", name: "Omega Ruby / Alpha Sapphire", generation: 6, routeKey: "or", leagueKey: "oras" },
  { slug: "sun-moon", name: "Sun / Moon", generation: 7, routeKey: "sun", leagueKey: "sm" },
  { slug: "ultra-sun-ultra-moon", name: "Ultra Sun / Ultra Moon", generation: 7, routeKey: "usun", leagueKey: "usum" },
  { slug: "lets-go-pikachu-eevee", name: "Let's Go Pikachu / Eevee", generation: 7 },
  { slug: "sword-shield", name: "Sword / Shield", generation: 8, routeKey: "sw", leagueKey: "swsh" },
  { slug: "brilliant-diamond-shining-pearl", name: "Brilliant Diamond / Shining Pearl", generation: 8, routeKey: "bdsp", leagueKey: "bdsp" },
  { slug: "legends-arceus", name: "Legends: Arceus", generation: 8 },
  { slug: "scarlet-violet", name: "Scarlet / Violet", generation: 9, routeKey: "sc", leagueKey: "sv" },
];

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function bossType(group?: string): Boss["type"] {
  if (group === "gym-leader") return "gym";
  if (group === "titan") return "titan";
  if (group === "elite-four" || group === "rival" || group === "evil-team") return group;
  return "champion";
}

function makeGame(definition: GameDefinition): Game {
  const source = definition.routeKey ? ROUTES[definition.routeKey] ?? [] : [];
  const league = definition.leagueKey ? LEAGUES[definition.leagueKey] ?? {} : {};
  const routes: Route[] = [];
  const bosses: Boss[] = [];
  const steps: ProgressStep[] = [];

  source.forEach((entry, order) => {
    if (entry.type === "route") {
      const options = entry.encounters ?? [];
      const route: Route = {
        id: `${definition.slug}-route-${order}-${slugify(entry.name)}`,
        name: entry.name,
        order,
        encounters: options.slice(0, 8).join(", ") + (options.length > 8 ? ` +${options.length - 8}` : ""),
        options,
        isStarter: entry.name === "Starter",
      };
      routes.push(route);
      steps.push({ kind: "route", item: route });
      return;
    }

    const data = entry.value ? league[entry.value] : undefined;
    const image = typeof data?.img === "object" ? data.img : undefined;
    const team: BossPokemon[] = (data?.pokemon ?? []).map((member) => ({
      pokemonName: member.name,
      level: Number(member.level) || 0,
      moves: member.moves ?? [],
      ability: member.ability,
      item: member.item,
      starter: member.starter,
      tera: member.tera,
    }));
    const levels = team.map((member) => member.level).filter((level) => level > 0);
    const boss: Boss = {
      id: `${definition.slug}-boss-${entry.value ?? slugify(entry.boss ?? entry.name)}`,
      name: data?.name ?? entry.boss ?? entry.name,
      location: entry.name,
      type: bossType(entry.group),
      order,
      levelCap: levels.length ? Math.max(...levels) : undefined,
      trainerSprite: slugify(data?.name ?? entry.boss ?? "").replace(/-/g, ""),
      image: image?.src?.startsWith("/leaders/") ? `/trainers${image.src}.webp` : undefined,
      spriteCredit: image?.author,
      speciality: data?.speciality,
      team,
    };
    bosses.push(boss);
    steps.push({ kind: "boss", item: boss });
  });

  const variantBosses = VARIANT_BOSSES[definition.slug] ?? [];
  variantBosses.forEach((boss) => {
    bosses.push(boss);
    steps.push({ kind: "boss", item: boss });
  });
  const logoUrl = LOGO_URLS[definition.slug];

  return {
    slug: definition.slug,
    name: definition.name,
    generation: definition.generation,
    logoText: definition.name,
    logoColor: GEN_COLORS[definition.generation],
    logoUrl,
    versions: getGameVersions(definition.slug, definition.name, logoUrl),
    routes,
    bosses,
    steps,
    dataAvailable: source.length > 0,
  };
}

export const GAMES: Game[] = DEFINITIONS.map(makeGame);

export function getGame(slug: string, versionId?: string): Game | undefined {
  const game = GAMES.find((item) => item.slug === slug);
  if (!game) return undefined;
  const version = game.versions.find((item) => item.id === versionId) ?? game.versions[0];
  return { ...game, logoUrl: version.logoUrl };
}

export function getProgress(game: Game): ProgressStep[] {
  return game.steps;
}
