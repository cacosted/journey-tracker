import { useEffect, useMemo, useState } from "react";
import { fetchPokemon, formatPokemonName, getSpriteUrl, searchPokemonByName } from "../data/pokeapi";
import type { Encounter, PokeApiPokemon, PokemonStatus } from "../data/types";

interface EncounterFormProps {
  routeName: string;
  routeOptions?: number[];
  isStarter?: boolean;
  initial?: Encounter;
  existingPokemonIds: number[];
  dupesClause: boolean;
  onSave: (encounter: Encounter) => void;
  onCancel: () => void;
}

export function EncounterForm({
  routeName,
  routeOptions,
  isStarter,
  initial,
  existingPokemonIds,
  dupesClause,
  onSave,
  onCancel,
}: EncounterFormProps) {
  const [query, setQuery] = useState(initial ? String(initial.pokemonId) : "");
  const [selected, setSelected] = useState<PokeApiPokemon | null>(null);
  const [suggestions, setSuggestions] = useState<PokeApiPokemon[]>([]);
  const [optionPokemon, setOptionPokemon] = useState<PokeApiPokemon[]>([]);
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [status, setStatus] = useState<PokemonStatus>(initial?.status ?? "alive");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeOptions || routeOptions.length === 0) {
      setOptionPokemon([]);
      return;
    }
    let cancelled = false;
    Promise.all(routeOptions.map((id) => fetchPokemon(id)))
      .then((data) => {
        if (!cancelled) setOptionPokemon(data);
      })
      .catch(() => setOptionPokemon([]));
    return () => {
      cancelled = true;
    };
  }, [routeOptions]);

  useEffect(() => {
    if (initial) {
      fetchPokemon(initial.pokemonId).then(setSelected).catch(() => setSelected(null));
    }
  }, [initial]);

  const isDupe = useMemo(() => {
    if (!dupesClause || !selected) return false;
    return existingPokemonIds.includes(selected.id);
  }, [selected, existingPokemonIds, dupesClause]);

  async function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await searchPokemonByName(value);
      setSuggestions(results);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(pokemon: PokeApiPokemon) {
    setSelected(pokemon);
    setQuery(formatPokemonName(pokemon.name));
    setSuggestions([]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      routeId: initial?.routeId ?? "",
      pokemonId: selected.id,
      nickname: nickname.trim() || undefined,
      status,
      caught: status !== "released" && status !== "dead",
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form className="encounter-form" onSubmit={handleSubmit}>
      <p className="route-hint" style={{ marginBottom: 16 }}>
        Registrar encuentro en {routeName}
      </p>

      <label>
        Pokémon
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Escribe un nombre o número"
          autoFocus
        />
        {loading && <span className="route-hint">Buscando…</span>}
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => handleSelect(p)}>
                  <img src={getSpriteUrl(p)} alt="" />
                  <span>
                    #{String(p.id).padStart(4, "0")} {formatPokemonName(p.name)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      {optionPokemon.length > 0 && (
        <div className="route-options">
          <p className="route-options-label">{isStarter ? "Elige un starter" : "Encuentros comunes"}</p>
          <div className="route-options-list">
            {optionPokemon.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`route-option ${selected?.id === p.id ? "selected" : ""}`}
                onClick={() => handleSelect(p)}
                title={formatPokemonName(p.name)}
              >
                <img src={getSpriteUrl(p)} alt={p.name} loading="lazy" />
                <span>{formatPokemonName(p.name)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="selected-pokemon">
          <img src={getSpriteUrl(selected)} alt={selected.name} />
          <span>
            #{String(selected.id).padStart(4, "0")} {formatPokemonName(selected.name)}
          </span>
          {isDupe && <span className="dupe-warning">⚠️ Repetido</span>}
        </div>
      )}

      <label>
        Apodo
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Opcional"
        />
      </label>

      <label>
        Estado
        <select value={status} onChange={(e) => setStatus(e.target.value as PokemonStatus)}>
          <option value="alive">Vivo</option>
          <option value="dead">Muerto</option>
          <option value="boxed">En caja</option>
          <option value="released">Liberado</option>
        </select>
      </label>

      <label>
        Notas
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="EVs, naturaleza, movimientos…"
          rows={3}
        />
      </label>

      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="button primary" disabled={!selected}>
          Guardar
        </button>
      </div>
    </form>
  );
}
