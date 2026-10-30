import type { Game } from "../data/types";

interface VersionSelectProps {
  game: Game;
  value?: string;
  onChange: (version: string) => void;
}

export function VersionSelect({ game, value, onChange }: VersionSelectProps) {
  if (game.versions.length < 2) return null;
  const selected = game.versions.find((version) => version.id === value) ?? game.versions[0];
  return (
    <label className="version-picker">
      <span>Versión</span>
      <span className="version-select">
        {selected.logoUrl && <img src={selected.logoUrl} alt="" />}
        <select aria-label={`Versión de ${game.name}`} value={selected.id} onChange={(event) => onChange(event.target.value)}>
          {game.versions.map((version) => <option key={version.id} value={version.id}>{version.name}</option>)}
        </select>
      </span>
    </label>
  );
}
