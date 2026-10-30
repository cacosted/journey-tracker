import { useEffect, useMemo, useRef, useState } from "react";
import { formatPokemonName, searchPokemonNames } from "../data/pokeapi";
import type { Route } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";

interface PokemonComboboxProps {
  route: Route;
  value?: string;
  suggestions: boolean;
  onSelect: (pokemon: string) => void;
}

export function PokemonCombobox({ route, value, suggestions, onSelect }: PokemonComboboxProps) {
  const [query, setQuery] = useState(value ? formatPokemonName(value) : "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const searching = query.trim().length > 0 && query.toLowerCase() !== formatPokemonName(value ?? "").toLowerCase();

  useEffect(() => {
    setQuery(value ? formatPokemonName(value) : "");
  }, [value]);

  useEffect(() => {
    if (!open || !searching) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      searchPokemonNames(query).then((names) => {
        if (!cancelled) setResults(names);
      }).catch(() => {
        if (!cancelled) setResults([]);
      });
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [open, query, searching]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const options = useMemo(() => {
    if (searching) return results;
    if (!suggestions) return [];
    return (route.options ?? []).filter((option): option is string => typeof option === "string");
  }, [results, route.options, searching, suggestions]);

  function select(pokemon: string) {
    onSelect(pokemon);
    setQuery(formatPokemonName(pokemon));
    setOpen(false);
  }

  return (
    <div className="pokemon-combobox" ref={rootRef}>
      {value && !searching ? <PokemonSprite pokemon={value} className="combobox-sprite" /> : <span className="search-icon">⌕</span>}
      <input
        role="combobox"
        aria-label={`${route.name}: buscar Pokémon`}
        aria-expanded={open}
        aria-controls={`encounters-${route.id}`}
        value={query}
        placeholder="Buscar encuentro"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && open && options[0]) {
            event.preventDefault();
            select(options[0]);
          }
        }}
      />
      <span className="combobox-chevron">▾</span>
      {open && (
        <div className="combobox-options" id={`encounters-${route.id}`} role="listbox">
          {options.map((pokemon) => (
            <button key={pokemon} type="button" role="option" aria-selected={pokemon === value} onClick={() => select(pokemon)}>
              <PokemonSprite pokemon={pokemon} />
              <span>{formatPokemonName(pokemon)}</span>
            </button>
          ))}
          {options.length === 0 && <p>{searching ? "Sin resultados" : "Escribe para buscar cualquier Pokémon"}</p>}
        </div>
      )}
    </div>
  );
}
