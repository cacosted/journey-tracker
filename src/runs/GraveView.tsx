import { formatPokemonName, getPokemonKey } from "../data/pokeapi";
import type { Encounter, Route } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";

interface GraveViewProps {
  encounters: Encounter[];
  routes: Route[];
  onRevive: (encounterId: string) => void;
  onEdit: (encounterId: string, notes: string) => void;
}

export function GraveView({ encounters, routes, onRevive, onEdit }: GraveViewProps) {
  const dead = encounters.filter((encounter) => encounter.status === "dead");
  if (dead.length === 0) return <div className="empty-state grave-empty"><h2>Cementerio vacío</h2><p>Ningún Pokémon ha caído. ¡Enhorabuena!</p></div>;
  return (
    <div className="grave-grid">
      {dead.map((encounter) => {
        const pokemon = getPokemonKey(encounter);
        const route = routes.find((item) => item.id === encounter.routeId);
        return (
          <article className="grave-card" key={encounter.id}>
            <div className="tombstone"><span>RIP</span><PokemonSprite pokemon={pokemon} /></div>
            <h2>{encounter.nickname || formatPokemonName(pokemon)}</h2>
            {encounter.nickname && <p>{formatPokemonName(pokemon)}</p>}
            <p>Cayó en {encounter.death?.location || route?.name || "un lugar desconocido"}</p>
            {encounter.death?.opponent && <p>Contra {encounter.death.opponent}</p>}
            {encounter.death?.notes && <blockquote>{encounter.death.notes}</blockquote>}
            <div className="grave-actions">
              <button type="button" className="button small" onClick={() => onEdit(encounter.id, encounter.death?.notes ?? "")}>Editar epitafio</button>
              <button type="button" className="button small" onClick={() => onRevive(encounter.id)}>Revivir</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
