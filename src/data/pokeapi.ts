import type { Encounter, PokeApiPokemon } from "./types";

const CACHE_KEY = "journey-tracker.pokemon-cache";
const POKEMON_LIST_KEY = "journey-tracker.pokemon-list";

function getCache(): Map<number, PokeApiPokemon> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? new Map(JSON.parse(raw) as [number, PokeApiPokemon][]) : new Map();
  } catch {
    return new Map();
  }
}

function setCache(cache: Map<number, PokeApiPokemon>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
  } catch {
    // Storage can be unavailable in private mode.
  }
}

const cache = getCache();

export async function fetchPokemon(idOrName: number | string): Promise<PokeApiPokemon> {
  const key = typeof idOrName === "number" ? idOrName : idOrName.toLowerCase();
  if (typeof key === "number" && cache.has(key)) return cache.get(key)!;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
  if (!response.ok) throw new Error(`Pokemon not found: ${idOrName}`);
  const data = (await response.json()) as PokeApiPokemon;
  cache.set(data.id, data);
  setCache(cache);
  return data;
}

export function getPokemonKey(encounter: Encounter): string {
  return encounter.pokemonName ?? String(encounter.pokemonId);
}

export function getPokemonSpriteUrl(pokemon: number | string): string {
  if (typeof pokemon === "number" || /^\d+$/.test(pokemon)) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemon}.gif`;
  }
  const slug = pokemon.toLowerCase().trim().replace(/[ _]+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`;
}

export function getSpriteUrl(pokemon: PokeApiPokemon | undefined): string {
  if (!pokemon) return "";
  return (
    pokemon.sprites.other?.showdown?.front_default ??
    pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ??
    pokemon.sprites.front_default ??
    ""
  );
}

export function getSmallSpriteUrl(pokemon: PokeApiPokemon | undefined): string {
  return getSpriteUrl(pokemon);
}

export function getTrainerSpriteUrl(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `https://play.pokemonshowdown.com/sprites/trainers/${slug}.png`;
}

export function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

let pokemonListPromise: Promise<string[]> | undefined;

export function fetchPokemonList(): Promise<string[]> {
  if (pokemonListPromise) return pokemonListPromise;
  pokemonListPromise = (async () => {
    try {
      const cached = localStorage.getItem(POKEMON_LIST_KEY);
      if (cached) return JSON.parse(cached) as string[];
    } catch {
      // Fetch a fresh list below.
    }
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000");
    if (!response.ok) throw new Error("Could not load the Pokemon list");
    const data = (await response.json()) as { results: { name: string }[] };
    const names = data.results.map((result) => result.name);
    try {
      localStorage.setItem(POKEMON_LIST_KEY, JSON.stringify(names));
    } catch {
      // The list is still available for this session.
    }
    return names;
  })();
  return pokemonListPromise;
}

export async function searchPokemonNames(query: string): Promise<string[]> {
  const normalized = query.toLowerCase().trim().replace(/[ _]+/g, "-");
  if (!normalized) return [];
  const names = await fetchPokemonList();
  return names
    .filter((name) => name.includes(normalized))
    .sort((a, b) => Number(!a.startsWith(normalized)) - Number(!b.startsWith(normalized)) || a.localeCompare(b))
    .slice(0, 16);
}

export async function searchPokemonByName(query: string): Promise<PokeApiPokemon[]> {
  const names = await searchPokemonNames(query);
  return Promise.all(names.slice(0, 10).map((name) => fetchPokemon(name)));
}

interface EvolutionNode {
  species: { name: string; url: string };
  evolves_to: EvolutionNode[];
}

export async function fetchEvolutionOptions(pokemon: number | string): Promise<string[]> {
  try {
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${String(pokemon).toLowerCase()}`);
    if (!speciesResponse.ok) return [];
    const species = (await speciesResponse.json()) as { evolution_chain: { url: string } };
    const chainResponse = await fetch(species.evolution_chain.url);
    if (!chainResponse.ok) return [];
    const chain = (await chainResponse.json()) as { chain: EvolutionNode };
    const targetName = typeof pokemon === "number" ? (await fetchPokemon(pokemon)).name : pokemon;

    function findNext(node: EvolutionNode): string[] | null {
      if (node.species.name === targetName) return node.evolves_to.map((next) => next.species.name);
      for (const next of node.evolves_to) {
        const result = findNext(next);
        if (result) return result;
      }
      return null;
    }

    return findNext(chain.chain) ?? [];
  } catch {
    return [];
  }
}

export async function fetchEvolutionNext(pokemon: number | string): Promise<string | null> {
  return (await fetchEvolutionOptions(pokemon))[0] ?? null;
}
