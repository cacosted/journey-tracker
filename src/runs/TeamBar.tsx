import { getPokemonKey } from "../data/pokeapi";
import type { Encounter } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";

interface TeamBarProps {
  encounters: Encounter[];
  teamIds: string[];
  onClear: () => void;
  onAdd: () => void;
  onRemove: (encounterId: string) => void;
  onLocate: (routeId: string) => void;
}

export function TeamBar({ encounters, teamIds, onClear, onAdd, onRemove, onLocate }: TeamBarProps) {
  const team = teamIds.map((id) => encounters.find((encounter) => encounter.id === id)).filter((encounter): encounter is Encounter => Boolean(encounter)).slice(0, 6);
  return (
    <div className="team-bar" aria-label="Equipo actual">
      <div className="team-slots">
        {Array.from({ length: 6 }, (_, index) => {
          const encounter = team[index];
          if (!encounter) return <button key={index} type="button" className="team-slot empty" title="Añadir Pokémon desde Box" aria-label={`Añadir Pokémon en la posición ${index + 1}`} onClick={onAdd}><span className="pixel-pokeball" /></button>;
          const pokemon = getPokemonKey(encounter);
          return (
            <div className="team-slot filled" key={encounter.id}>
              <button type="button" className="team-locate" title={encounter.nickname ?? pokemon} onClick={() => onLocate(encounter.routeId)}><PokemonSprite pokemon={pokemon} /></button>
              <button type="button" className="team-remove" aria-label={`Quitar a ${encounter.nickname ?? pokemon} del equipo`} onClick={() => onRemove(encounter.id)}>×</button>
            </div>
          );
        })}
      </div>
      <button type="button" className="clear-team" disabled={team.length === 0} title="Vaciar equipo" aria-label="Vaciar equipo" onClick={onClear}>×</button>
      <span className="team-count">{team.length}/6</span>
    </div>
  );
}
