import { useState } from "react";
import { fetchEvolutionOptions, formatPokemonName, getPokemonKey } from "../data/pokeapi";
import { isAvailableStatus } from "../data/statuses";
import type { Encounter, Route } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";

interface BoxViewProps {
  encounters: Encounter[];
  routes: Route[];
  teamIds: string[];
  onPatch: (encounterId: string, patch: Partial<Encounter>) => void;
  onToggleTeam: (encounterId: string) => void;
  onEvolve: (encounterId: string, pokemon: string) => void;
}

export function BoxView({ encounters, routes, teamIds, onPatch, onToggleTeam, onEvolve }: BoxViewProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("caught");
  const [minimal, setMinimal] = useState(false);
  const available = encounters.filter((encounter) => isAvailableStatus(encounter.status));
  const filtered = available.filter((encounter) => {
    const route = routes.find((item) => item.id === encounter.routeId);
    return `${getPokemonKey(encounter)} ${encounter.nickname ?? ""} ${route?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return getPokemonKey(a).localeCompare(getPokemonKey(b));
    if (sort === "location") return (routes.find((route) => route.id === a.routeId)?.order ?? 0) - (routes.find((route) => route.id === b.routeId)?.order ?? 0);
    if (sort === "nature") return (a.nature ?? "").localeCompare(b.nature ?? "");
    return 0;
  });

  return (
    <section className="box-view">
      <div className="box-toolbar">
        <div><span className="eyebrow">POKÉMON DISPONIBLES</span><strong>{available.length}</strong></div>
        <input className="inline-input" type="search" placeholder="Buscar en Box" aria-label="Buscar en Box" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Ordenar Box" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="caught">Orden de captura</option>
          <option value="location">Ubicación</option>
          <option value="name">Nombre</option>
          <option value="nature">Naturaleza</option>
        </select>
        <button type="button" className={`button small ${minimal ? "primary" : ""}`} onClick={() => setMinimal((value) => !value)}>{minimal ? "Mostrar detalles" : "Ocultar detalles"}</button>
      </div>
      {sorted.length === 0 ? <div className="empty-state"><p>{available.length ? "No hay Pokémon que coincidan con la búsqueda." : "Tu Box está vacía. Registra y marca un encuentro como atrapado."}</p></div> : (
        <div className={`box-grid ${minimal ? "minimal" : ""}`}>
          {sorted.map((encounter) => (
            <BoxCard key={encounter.id} encounter={encounter} route={routes.find((route) => route.id === encounter.routeId)} inTeam={teamIds.includes(encounter.id)} teamFull={teamIds.length >= 6} minimal={minimal} onPatch={(patch) => onPatch(encounter.id, patch)} onToggleTeam={() => onToggleTeam(encounter.id)} onEvolve={(pokemon) => onEvolve(encounter.id, pokemon)} />
          ))}
        </div>
      )}
    </section>
  );
}

function BoxCard({ encounter, route, inTeam, teamFull, minimal, onPatch, onToggleTeam, onEvolve }: {
  encounter: Encounter;
  route?: Route;
  inTeam: boolean;
  teamFull: boolean;
  minimal: boolean;
  onPatch: (patch: Partial<Encounter>) => void;
  onToggleTeam: () => void;
  onEvolve: (pokemon: string) => void;
}) {
  const pokemon = getPokemonKey(encounter);
  const [evolutions, setEvolutions] = useState<string[]>([]);

  async function evolve() {
    const options = await fetchEvolutionOptions(pokemon);
    if (options.length === 1) onEvolve(options[0]);
    if (options.length > 1) setEvolutions(options);
  }

  return (
    <article className={`box-card ${inTeam ? "in-team" : ""}`}>
      <div className="box-card-ribbon">{inTeam ? "EQUIPO" : "BOX"}</div>
      <PokemonSprite pokemon={pokemon} />
      <h2>{encounter.nickname || formatPokemonName(pokemon)}</h2>
      {encounter.nickname && <p className="box-species">{formatPokemonName(pokemon)}</p>}
      {!minimal && <><p className="box-nature">{encounter.nature || "Sin naturaleza"}</p><p className="box-location">{route?.name || "Ubicación desconocida"}</p></>}
      <div className="box-actions">
        <button type="button" className={`button tiny ${inTeam ? "primary" : ""}`} disabled={!inTeam && teamFull} onClick={onToggleTeam}>{inTeam ? "Quitar" : "Al equipo"}</button>
        <button type="button" className="button tiny" onClick={evolve}>Evolucionar</button>
        <button type="button" className="button tiny danger" onClick={() => onPatch({ status: "dead", caught: false })}>Muerto</button>
        <button type="button" className="button tiny" onClick={() => onPatch({ status: "released", caught: false })}>Liberar</button>
      </div>
      {evolutions.length > 0 && <div className="box-evolutions">{evolutions.map((option) => <button type="button" key={option} onClick={() => { onEvolve(option); setEvolutions([]); }}><PokemonSprite pokemon={option} />{formatPokemonName(option)}</button>)}</div>}
    </article>
  );
}
