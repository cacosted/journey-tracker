import { useEffect, useState } from "react";
import { fetchPokemon, formatPokemonName, getPokemonSpriteUrl, getSpriteUrl } from "../data/pokeapi";

interface PokemonSpriteProps {
  pokemon: number | string;
  className?: string;
  alt?: string;
  fallback?: string;
}

export function PokemonSprite({ pokemon, className = "", alt, fallback = "?" }: PokemonSpriteProps) {
  const [src, setSrc] = useState(() => getPokemonSpriteUrl(pokemon));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(getPokemonSpriteUrl(pokemon));
    setFailed(false);
  }, [pokemon]);

  function handleError() {
    if (src !== getPokemonSpriteUrl(pokemon)) {
      setFailed(true);
      return;
    }
    fetchPokemon(pokemon)
      .then((data) => setSrc(getSpriteUrl(data)))
      .catch(() => setFailed(true));
  }

  if (failed || !pokemon || pokemon === "0") {
    return <span className={`pokemon-sprite-fallback ${className}`} aria-label={alt ?? "Sin sprite"}>{fallback}</span>;
  }

  return (
    <img
      className={`pokemon-sprite ${className}`}
      src={src}
      alt={alt ?? formatPokemonName(String(pokemon))}
      loading="lazy"
      onError={handleError}
    />
  );
}
