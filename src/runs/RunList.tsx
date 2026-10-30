import { useState } from "react";
import { Link } from "react-router";
import { getGame } from "../data/games";
import { getTeamIds, loadRuns, saveRuns } from "../data/storage";
import { isAvailableStatus } from "../data/statuses";
import type { Run } from "../data/types";

export function RunList() {
  const [runs, setRuns] = useState<Run[]>(() => loadRuns());

  function handleDelete(id: string) {
    if (!confirm("¿Borrar esta run?")) return;
    const next = runs.filter((run) => run.id !== id);
    setRuns(next);
    saveRuns(next);
  }

  return (
    <div className="run-list">
      <div className="page-header"><div><span className="eyebrow">TU AVENTURA NUZLOCKE</span><h1>Mis runs</h1></div><Link to="/new" className="button primary">Nueva run</Link></div>
      {runs.length === 0 ? <div className="empty-state"><p>No tienes ninguna run todavía.</p><Link to="/new" className="button primary">Empezar una Nuzlocke</Link></div> : (
        <ul className="runs">
          {runs.map((run) => {
            const game = getGame(run.gameSlug, run.version);
            const dead = run.encounters.filter((encounter) => encounter.status === "dead").length;
            const available = run.encounters.filter((encounter) => isAvailableStatus(encounter.status)).length;
            return (
              <li key={run.id} className="run-card">
                {game?.logoUrl && <img className="run-card-logo" src={game.logoUrl} alt="" />}
                <Link to={`/run/${run.id}`} className="run-link"><div className="run-info"><h2>{run.name}</h2><p className="run-meta">{game?.name ?? run.gameSlug} · {available} disponibles · {getTeamIds(run).length}/6 en equipo · {dead} caídos · {run.defeatedBosses.length} jefes vencidos</p></div></Link>
                <button type="button" className="button danger small" onClick={() => handleDelete(run.id)}>Borrar</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
