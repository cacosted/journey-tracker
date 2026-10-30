import { useState } from "react";
import { useNavigate } from "react-router";
import { GAMES } from "../data/games";
import { generateId, loadRuns, saveRuns } from "../data/storage";
import type { GameSlug, Run } from "../data/types";
import { VersionSelect } from "../ui/VersionSelect";

export function RunForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [gameSlug, setGameSlug] = useState<GameSlug>("scarlet-violet");
  const [version, setVersion] = useState("scarlet");
  const [dupesClause, setDupesClause] = useState(true);
  const [levelCap, setLevelCap] = useState(true);
  const [shinyClause, setShinyClause] = useState(false);
  const selectedGame = GAMES.find((game) => game.slug === gameSlug)!;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const now = Date.now();
    const run: Run = {
      id: generateId(),
      name: trimmed,
      gameSlug,
      version,
      createdAt: now,
      updatedAt: now,
      encounters: [],
      defeatedBosses: [],
      rules: { dupesClause, levelCap, shinyClause },
    };

    const runs = loadRuns();
    runs.unshift(run);
    saveRuns(runs);
    navigate(`/run/${run.id}`);
  }

  return (
    <div className="run-form">
      <h1>Nueva run</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre de la run
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Nuzlocke loco de Cacosted"
            required
          />
        </label>

        <div className="game-select-label">Juego</div>
        <div className="game-select-grid" role="radiogroup" aria-label="Juego">
          {GAMES.map((game) => (
            <button
              key={game.slug}
              type="button"
              role="radio"
              aria-checked={gameSlug === game.slug}
              className={`game-card ${gameSlug === game.slug ? "selected" : ""}`}
              onClick={() => {
                setGameSlug(game.slug);
                setVersion(game.versions[0].id);
              }}
              title={game.name}
            >
              {game.logoUrl ? (
                <img
                  className="game-card-image"
                  src={game.logoUrl}
                  alt={game.name}
                  loading="lazy"
                />
              ) : (
                <div
                  className="game-card-logo"
                  style={{ background: game.logoColor, color: "#fff" }}
                >
                  <span className="game-card-gen">Gen {game.generation}</span>
                  <span className="game-card-name">{game.logoText}</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <VersionSelect game={selectedGame} value={version} onChange={setVersion} />

        <fieldset>
          <legend>Reglas</legend>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={dupesClause}
              onChange={(e) => setDupesClause(e.target.checked)}
            />
            Cláusula de repetidos (Dupes Clause)
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={levelCap}
              onChange={(e) => setLevelCap(e.target.checked)}
            />
            Level cap
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={shinyClause}
              onChange={(e) => setShinyClause(e.target.checked)}
            />
            Cláusula shiny
          </label>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="button primary">
            Crear run
          </button>
        </div>
      </form>
    </div>
  );
}
