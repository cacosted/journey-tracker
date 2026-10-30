import type { Boss, BossPokemon, GameSlug, GameVersion } from "./types";

const VERSION_IDS: Partial<Record<GameSlug, string[]>> = {
  "red-blue": ["red", "blue"],
  "gold-silver": ["gold", "silver"],
  "ruby-sapphire": ["ruby", "sapphire"],
  "fire-red-leaf-green": ["firered", "leafgreen"],
  "diamond-pearl": ["diamond", "pearl"],
  "heart-gold-soul-silver": ["heartgold", "soulsilver"],
  "black-white": ["black", "white"],
  "black-2-white-2": ["black-2", "white-2"],
  "x-y": ["x", "y"],
  "omega-ruby-alpha-sapphire": ["omega-ruby", "alpha-sapphire"],
  "sun-moon": ["sun", "moon"],
  "ultra-sun-ultra-moon": ["ultra-sun", "ultra-moon"],
  "lets-go-pikachu-eevee": ["lets-go-pikachu", "lets-go-eevee"],
  "sword-shield": ["sword", "shield"],
  "brilliant-diamond-shining-pearl": ["brilliant-diamond", "shining-pearl"],
  "scarlet-violet": ["scarlet", "violet"],
};

function logoUrl(id: string): string {
  if (id === "black-2") return "/games/black-2-white-2.jpg";
  if (id === "white-2") return "/games/white-2.jpg";
  return `https://img.pokemondb.net/boxes/${id}.jpg`;
}

export function getGameVersions(slug: GameSlug, name: string, defaultLogo: string): GameVersion[] {
  const ids = VERSION_IDS[slug];
  if (!ids) return [{ id: slug, name, logoUrl: defaultLogo }];
  return name.split(" / ").map((versionName, index) => ({
    id: ids[index],
    name: versionName,
    logoUrl: index === 0 ? defaultLogo : logoUrl(ids[index]),
  }));
}

function paradoxTeam(names: string[], lastName: string, ability: string): BossPokemon[] {
  return [...names.map((pokemonName) => ({ pokemonName, level: 66, ability })), { pokemonName: lastName, level: 67, ability }];
}

export const VARIANT_BOSSES: Partial<Record<GameSlug, Boss[]>> = {
  "scarlet-violet": [
    {
      id: "scarlet-violet-boss-ai-sada",
      name: "AI Sada",
      location: "Zero Lab",
      type: "champion",
      order: 64,
      levelCap: 67,
      trainerSprite: "sada",
      image: "/trainers/leaders/sada-ai.png",
      spriteCredit: "Brumirage / Pokémon Showdown",
      team: paradoxTeam(["slither-wing", "scream-tail", "brute-bonnet", "flutter-mane", "sandy-shocks"], "roaring-moon", "protosynthesis"),
      versions: ["scarlet"],
    },
    {
      id: "scarlet-violet-boss-ai-turo",
      name: "AI Turo",
      location: "Zero Lab",
      type: "champion",
      order: 64,
      levelCap: 67,
      trainerSprite: "turo",
      image: "/trainers/leaders/turo-ai.png",
      spriteCredit: "Brumirage / Pokémon Showdown",
      team: paradoxTeam(["iron-moth", "iron-bundle", "iron-hands", "iron-jugulis", "iron-thorns"], "iron-valiant", "quark-drive"),
      versions: ["violet"],
    },
  ],
};
