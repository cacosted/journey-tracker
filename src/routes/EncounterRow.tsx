import { useState } from "react";
import { fetchEvolutionOptions, formatPokemonName, getPokemonKey } from "../data/pokeapi";
import { NATURES } from "../data/natures";
import { isAvailableStatus, STATUS_LABELS } from "../data/statuses";
import type { Encounter, PokemonStatus, Route, RunSettings } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";
import { PokemonCombobox } from "./PokemonCombobox";

interface EncounterRowProps {
  route: Route;
  encounter?: Encounter;
  inTeam: boolean;
  teamFull: boolean;
  dupe: boolean;
  settings: RunSettings;
  starterType?: "fire" | "water" | "grass";
  onSelect: (pokemon: string) => void;
  onPatch: (patch: Partial<Encounter>) => void;
  onToggleTeam: () => void;
  onClear: () => void;
  onAddRoute: () => void;
  onHide: () => void;
  onStarterType: (type: "fire" | "water" | "grass") => void;
}

export function EncounterRow({
  route,
  encounter,
  inTeam,
  teamFull,
  dupe,
  settings,
  starterType,
  onSelect,
  onPatch,
  onToggleTeam,
  onClear,
  onAddRoute,
  onHide,
  onStarterType,
}: EncounterRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [evolutions, setEvolutions] = useState<string[]>([]);
  const pokemon = encounter ? getPokemonKey(encounter) : undefined;
  const available = isAvailableStatus(encounter?.status);

  async function evolve() {
    if (!pokemon) return;
    setEvolving(true);
    const options = await fetchEvolutionOptions(pokemon);
    setEvolving(false);
    if (options.length === 1) onSelect(options[0]);
    if (options.length > 1) setEvolutions(options);
  }

  return (
    <div className={`encounter-line ${encounter?.status ?? "empty"} ${settings.nicknames ? "" : "no-nickname"}`} id={`location-${route.id}`}>
      <div className="location-label">
        {route.isStarter && (
          <span className="starter-types" aria-label="Tipo del starter">
            {(["fire", "water", "grass"] as const).map((type) => (
              <button key={type} type="button" className={`${type} ${starterType === type ? "selected" : ""}`} title={type} aria-label={`Starter ${type}`} onClick={() => onStarterType(type)} />
            ))}
          </span>
        )}
        <span title={route.encounters}>{route.name}{route.isStarter ? "*" : ""}</span>
        {dupe && <small className="dupe-label">DUPE</small>}
      </div>

      <PokemonCombobox route={route} value={pokemon} suggestions={settings.suggestions} onSelect={onSelect} />

      {settings.nicknames && (
        <input
          className="inline-input nickname-input"
          aria-label={`${route.name}: apodo`}
          placeholder="Apodo"
          value={encounter?.nickname ?? ""}
          disabled={!encounter}
          onChange={(event) => onPatch({ nickname: event.target.value || undefined })}
        />
      )}

      <div className="select-wrap">
        <select
          aria-label={`${route.name}: estado`}
          value={encounter?.status ?? ""}
          disabled={!encounter}
          onChange={(event) => onPatch({ status: (event.target.value || undefined) as PokemonStatus | undefined, caught: event.target.value !== "" })}
        >
          <option value="">Estado</option>
          {Object.entries(STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </select>
      </div>

      <div className="select-wrap nature-select">
        <select aria-label={`${route.name}: naturaleza`} value={encounter?.nature ?? ""} disabled={!encounter} onChange={(event) => onPatch({ nature: event.target.value || undefined })}>
          <option value="">Naturaleza</option>
          {NATURES.map((nature) => <option key={nature.name} value={nature.name}>{nature.name}{nature.up ? ` (+${nature.up} / -${nature.down})` : ""}</option>)}
        </select>
      </div>

      <div className="encounter-actions">
        {encounter && !encounter.status && <button type="button" className="icon-action capture-action" title="Marcar atrapado" aria-label="Marcar atrapado" onClick={() => onPatch({ status: "alive", caught: true })}><span className="mini-pokeball" /></button>}
        {encounter && encounter.status !== "dead" && encounter.status !== "missed" && <button type="button" className="icon-action" title="Marcar muerto" aria-label="Marcar muerto" onClick={() => onPatch({ status: "dead", caught: false })}>†</button>}
        {encounter && (!encounter.status || available) && <button type="button" className="icon-action evolve-action" title="Evolucionar" aria-label="Evolucionar" disabled={evolving} onClick={evolve}>{evolving ? "…" : "EVO"}</button>}
        {encounter && available && (!teamFull || inTeam) && <button type="button" className={`icon-action team-action ${inTeam ? "selected" : ""}`} title={inTeam ? "Quitar del equipo" : "Añadir al equipo"} aria-label={inTeam ? "Quitar del equipo" : "Añadir al equipo"} onClick={onToggleTeam}><span className="mini-pokeball" /><b>{inTeam ? "−" : "+"}</b></button>}
        <div className="context-menu-wrap">
          <button type="button" className="icon-action menu-action" aria-label={`Opciones de ${route.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>⋮</button>
          {menuOpen && (
            <div className="context-menu">
              <strong>{route.name}</strong>
              <button type="button" onClick={() => { onAddRoute(); setMenuOpen(false); }}>+ Añadir ubicación</button>
              <button type="button" disabled={!encounter} onClick={() => { onClear(); setMenuOpen(false); }}>Limpiar encuentro</button>
              {!route.isStarter && <button type="button" onClick={() => { onHide(); setMenuOpen(false); }}>{route.custom ? "Eliminar ubicación" : "Ocultar ubicación"}</button>}
            </div>
          )}
        </div>
      </div>

      {evolutions.length > 0 && (
        <div className="modal-backdrop" onClick={() => setEvolutions([])}>
          <div className="modal evolution-modal" onClick={(event) => event.stopPropagation()}>
            <h2>Elige una evolución</h2>
            <div className="evolution-options">
              {evolutions.map((option) => <button key={option} type="button" className="button" onClick={() => { onSelect(option); setEvolutions([]); }}><PokemonSprite pokemon={option} />{formatPokemonName(option)}</button>)}
            </div>
            <button type="button" className="button" onClick={() => setEvolutions([])}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
