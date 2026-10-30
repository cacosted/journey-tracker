import { useEffect, useState } from "react";
import { formatPokemonName, getTrainerSpriteUrl } from "../data/pokeapi";
import type { Boss } from "../data/types";
import { PokemonSprite } from "../ui/PokemonSprite";

interface BossRowProps {
  boss: Boss;
  defeated: boolean;
  showLevelCap: boolean;
  starterType?: "fire" | "water" | "grass";
  onToggleDefeated: () => void;
}

export function BossRow({ boss, defeated, showLevelCap, starterType = "fire", onToggleDefeated }: BossRowProps) {
  const [expanded, setExpanded] = useState(false);
  const team = boss.team.filter((member) => !member.starter || member.starter === starterType);
  const levelCap = team.length ? Math.max(...team.map((member) => member.level)) : boss.levelCap;

  return (
    <article className={`boss-line ${defeated ? "defeated" : ""} ${expanded ? "expanded" : ""}`}>
      <div className="boss-summary">
        <button type="button" className="boss-accordion" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          <span className="accordion-arrow">{expanded ? "▾" : "▸"}</span>
          <TrainerSprite boss={boss} />
          <span className="boss-heading">
            <span className="boss-name-row"><strong>{boss.name}</strong>{boss.speciality && <span className={`type-badge type-${boss.speciality}`}>{boss.speciality}</span>}</span>
            <span className="boss-location">{boss.location}</span>
            {boss.spriteCredit && <small>Sprite por {boss.spriteCredit}</small>}
          </span>
        </button>
        <div className="boss-mini-team" aria-label="Equipo rival">
          {team.map((member, index) => <PokemonSprite key={`${member.pokemonName}-${index}`} pokemon={member.pokemonName ?? member.pokemonId ?? 0} />)}
        </div>
        {showLevelCap && levelCap !== undefined && <div className="boss-level-cap"><span>LEVEL CAP</span><strong>{levelCap}</strong></div>}
        <button type="button" className={`boss-vs ${defeated ? "won" : ""}`} title={defeated ? "Marcar como pendiente" : "Marcar jefe vencido"} aria-label={defeated ? `Reactivar a ${boss.name}` : `Marcar a ${boss.name} como vencido`} onClick={onToggleDefeated}>{defeated ? "✓" : "VS"}</button>
      </div>
      {defeated && <span className="defeated-stamp">VENCIDO</span>}
      {expanded && (
        <div className="boss-details">
          {team.map((member, index) => {
            const pokemon = member.pokemonName ?? String(member.pokemonId ?? 0);
            return (
              <div className="boss-pokemon-card" key={`${pokemon}-${index}`}>
                <div className="boss-pokemon-top">
                  <div><small>NIVEL</small><strong>{member.level}</strong></div>
                  <PokemonSprite pokemon={pokemon} />
                </div>
                <h3>{formatPokemonName(pokemon)}</h3>
                {member.ability && <p className="boss-ability">{formatPokemonName(member.ability)}</p>}
                {member.item && <p className="boss-item">Objeto: {formatPokemonName(member.item)}</p>}
                <div className="boss-moves">
                  {(member.moves ?? []).map((move) => <span key={move}>{formatPokemonName(move)}</span>)}
                </div>
                {member.tera && <span className="tera-label">TERA {member.tera}</span>}
              </div>
            );
          })}
          {team.length === 0 && <p>No hay datos del equipo para este combate.</p>}
        </div>
      )}
    </article>
  );
}

export function TrainerSprite({ boss }: { boss: Boss }) {
  const src = boss.image ?? getTrainerSpriteUrl(boss.trainerSprite ?? boss.name);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className="trainer-sprite">
      {failed ? <span>{boss.name.charAt(0)}</span> : <img src={src} alt={boss.name} loading="lazy" onError={() => setFailed(true)} />}
    </span>
  );
}
