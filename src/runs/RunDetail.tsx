import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { getCustomizedGame, getGameForEditor } from "../data/customizations";
import { getPokemonKey } from "../data/pokeapi";
import { generateId, getRunSettings, getTeamIds, loadGameCustomizations, loadRuns, saveGameCustomizations, saveRuns } from "../data/storage";
import { isAvailableStatus } from "../data/statuses";
import type { Encounter, ProgressStep, Route, Run, RunSettings } from "../data/types";
import { BossRow } from "../routes/BossRow";
import { EncounterRow } from "../routes/EncounterRow";
import { ThemeToggle } from "../ui/ThemeToggle";
import { VersionSelect } from "../ui/VersionSelect";
import { BoxView } from "./BoxView";
import { JourneyEditor } from "./JourneyEditor";
import { GraveView } from "./GraveView";
import { TeamBar } from "./TeamBar";

type MainTab = "game" | "box" | "grave";
type GameFilter = "nuzlocke" | "routes" | "bosses" | "upcoming";

const STARTER_TYPES: Record<string, "fire" | "water" | "grass"> = {
  bulbasaur: "grass", chikorita: "grass", treecko: "grass", turtwig: "grass", snivy: "grass", chespin: "grass", rowlet: "grass", grookey: "grass", sprigatito: "grass",
  charmander: "fire", cyndaquil: "fire", torchic: "fire", chimchar: "fire", tepig: "fire", fennekin: "fire", litten: "fire", scorbunny: "fire", fuecoco: "fire",
  squirtle: "water", totodile: "water", mudkip: "water", piplup: "water", oshawott: "water", froakie: "water", popplio: "water", sobble: "water", quaxly: "water",
};

export function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const [runs, setRuns] = useState(() => loadRuns());
  const [activeTab, setActiveTab] = useState<MainTab>("game");
  const [filter, setFilter] = useState<GameFilter>("nuzlocke");
  const [routeFilter, setRouteFilter] = useState("all");
  const [bossFilter, setBossFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [customizations, setCustomizations] = useState(() => loadGameCustomizations());
  const run = useMemo(() => runs.find((item) => item.id === runId), [runs, runId]);
  const game = run ? getCustomizedGame(run.gameSlug, run.version, customizations) : undefined;
  const editorGame = run ? getGameForEditor(run.gameSlug, customizations) : undefined;

  if (!run || !game) {
    return <div className="run-missing"><h1>Run no encontrada</h1><Link to="/" className="button primary">Volver al inicio</Link></div>;
  }

  const teamIds = getTeamIds(run);
  const settings = getRunSettings(run);
  const allRoutes = [...game.routes, ...(run.customRoutes ?? [])];
  const allSteps: ProgressStep[] = [
    ...game.steps,
    ...(run.customRoutes ?? []).map((route): ProgressStep => ({ kind: "route", item: route })),
  ].sort((a, b) => a.item.order - b.item.order);
  const visibleSteps = allSteps.filter((step) => step.kind === "boss" || !run.hiddenRouteIds?.includes(step.item.id));
  const nextRoute = visibleSteps.find((step): step is { kind: "route"; item: Route } => {
    if (step.kind !== "route") return false;
    const encounter = run.encounters.find((item) => item.routeId === step.item.id);
    return !encounter || !encounter.status;
  })?.item;
  const dead = run.encounters.filter((encounter) => encounter.status === "dead").length;
  const available = run.encounters.filter((encounter) => isAvailableStatus(encounter.status)).length;

  function updateRun(nextRun: Run) {
    setRuns((current) => {
      const next = current.map((item) => item.id === run!.id ? { ...nextRun, updatedAt: Date.now() } : item);
      saveRuns(next);
      return next;
    });
  }

  function patchEncounter(routeId: string, patch: Partial<Encounter>) {
    const existing = run!.encounters.find((encounter) => encounter.routeId === routeId);
    if (!existing) return;
    const unavailable = patch.status && !isAvailableStatus(patch.status);
    updateRun({
      ...run!,
      encounters: run!.encounters.map((encounter) => encounter.id === existing.id ? { ...encounter, ...patch } : encounter),
      teamIds: unavailable ? teamIds.filter((id) => id !== existing.id) : teamIds,
    });
  }

  function patchEncounterById(encounterId: string, patch: Partial<Encounter>) {
    const encounter = run!.encounters.find((item) => item.id === encounterId);
    if (encounter) patchEncounter(encounter.routeId, patch);
  }

  function selectPokemon(route: Route, pokemonName: string) {
    const existing = run!.encounters.find((encounter) => encounter.routeId === route.id);
    const encounter: Encounter = {
      id: existing?.id ?? generateId(),
      routeId: route.id,
      pokemonId: 0,
      pokemonName,
      nickname: existing?.nickname,
      status: existing?.status,
      nature: existing?.nature,
      caught: existing?.caught ?? false,
      notes: existing?.notes,
      death: existing?.death,
    };
    const starterType = route.isStarter ? STARTER_TYPES[pokemonName] ?? run!.starterType : run!.starterType;
    updateRun({ ...run!, encounters: [...run!.encounters.filter((item) => item.routeId !== route.id), encounter], starterType });
  }

  function clearEncounter(routeId: string) {
    const encounter = run!.encounters.find((item) => item.routeId === routeId);
    updateRun({ ...run!, encounters: run!.encounters.filter((item) => item.routeId !== routeId), teamIds: teamIds.filter((id) => id !== encounter?.id) });
  }

  function toggleTeam(encounterId: string) {
    const encounter = run!.encounters.find((item) => item.id === encounterId);
    if (!encounter || !isAvailableStatus(encounter.status)) return;
    const included = teamIds.includes(encounterId);
    if (!included && teamIds.length >= 6) return;
    updateRun({ ...run!, teamIds: included ? teamIds.filter((id) => id !== encounterId) : [...teamIds, encounterId] });
  }

  function evolveEncounter(encounterId: string, pokemonName: string) {
    const encounter = run!.encounters.find((item) => item.id === encounterId);
    if (!encounter) return;
    updateRun({ ...run!, encounters: run!.encounters.map((item) => item.id === encounterId ? { ...item, pokemonId: 0, pokemonName } : item) });
  }

  function toggleBoss(bossId: string) {
    const defeated = run!.defeatedBosses.includes(bossId);
    updateRun({ ...run!, defeatedBosses: defeated ? run!.defeatedBosses.filter((id) => id !== bossId) : [...run!.defeatedBosses, bossId] });
  }

  function addCustomRoute(afterOrder: number) {
    const name = window.prompt("Nombre de la nueva ubicación");
    if (!name?.trim()) return;
    const route: Route = { id: `custom-${generateId()}`, name: name.trim(), order: afterOrder + 0.5, encounters: "Ubicación personalizada", options: [], custom: true };
    updateRun({ ...run!, customRoutes: [...(run!.customRoutes ?? []), route] });
  }

  function hideRoute(route: Route) {
    if (route.custom) {
      const encounter = run!.encounters.find((item) => item.routeId === route.id);
      updateRun({ ...run!, customRoutes: (run!.customRoutes ?? []).filter((item) => item.id !== route.id), encounters: run!.encounters.filter((item) => item.routeId !== route.id), teamIds: teamIds.filter((id) => id !== encounter?.id) });
      return;
    }
    updateRun({ ...run!, hiddenRouteIds: [...new Set([...(run!.hiddenRouteIds ?? []), route.id])] });
  }

  function updateSettings(patch: Partial<RunSettings>) {
    updateRun({ ...run!, settings: { ...settings, ...patch } });
  }

  function saveJourney(steps: ProgressStep[]) {
    const next = { ...customizations, [run!.gameSlug]: { steps } };
    if (!saveGameCustomizations(next)) {
      setEditorError("No se pudieron guardar los cambios. Prueba con imágenes más pequeñas o libera espacio del navegador.");
      return;
    }
    setCustomizations(next);
    setEditorError("");
    setEditorOpen(false);
  }

  function resetJourney() {
    const next = { ...customizations };
    delete next[run!.gameSlug];
    if (!saveGameCustomizations(next)) {
      setEditorError("No se pudo restaurar el recorrido. Inténtalo de nuevo.");
      return;
    }
    setCustomizations(next);
    setEditorError("");
    setEditorOpen(false);
  }

  function locateRoute(routeId: string) {
    setActiveTab("game");
    setFilter("nuzlocke");
    setSearch("");
    window.setTimeout(() => document.getElementById(`location-${routeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  const normalizedSearch = search.toLowerCase().trim();
  const filteredSteps = visibleSteps.filter((step) => {
    if (filter === "routes" && step.kind !== "route") return false;
    if (filter === "bosses" && step.kind !== "boss") return false;
    if (filter === "upcoming" && nextRoute && step.item.order < nextRoute.order) return false;
    if (step.kind === "boss" && filter === "bosses" && bossFilter !== "all" && step.item.type !== bossFilter) return false;
    if (step.kind === "route" && filter === "routes" && routeFilter !== "all") {
      const encounter = run.encounters.find((item) => item.routeId === step.item.id);
      if (routeFilter === "planned" && (!encounter || encounter.status)) return false;
      if (routeFilter === "missed" && encounter?.status !== "missed") return false;
      if (routeFilter === "upcoming" && nextRoute && step.item.order < nextRoute.order) return false;
    }
    if (!normalizedSearch) return true;
    if (step.kind === "boss") return `${step.item.name} ${step.item.location} ${step.item.team.map((member) => member.pokemonName).join(" ")}`.toLowerCase().includes(normalizedSearch);
    const encounter = run.encounters.find((item) => item.routeId === step.item.id);
    return `${step.item.name} ${encounter?.pokemonName ?? ""} ${encounter?.nickname ?? ""}`.toLowerCase().includes(normalizedSearch);
  });

  return (
    <div className="run-shell">
      <header className="run-topbar">
        <Link to="/" className="run-identity" title="Cargar y gestionar runs">
          <img src={game.logoUrl} alt={game.name} />
          <span><strong>{run.name}</strong><small>{game.name}</small></span>
        </Link>
        <Link to="/" className="save-button" aria-label="Cargar y gestionar runs" title="Cargar y gestionar runs">▤</Link>
        <TeamBar encounters={run.encounters} teamIds={teamIds} onClear={() => updateRun({ ...run, teamIds: [] })} onAdd={() => setActiveTab("box")} onRemove={toggleTeam} onLocate={locateRoute} />
        <ThemeToggle />
        <nav className="run-main-tabs" aria-label="Gestión de la run">
          <button type="button" className={activeTab === "game" ? "active" : ""} onClick={() => setActiveTab("game")}>Juego</button>
          <button type="button" className={activeTab === "box" ? "active" : ""} onClick={() => setActiveTab("box")}>Box <span>{available}</span></button>
          <button type="button" className={activeTab === "grave" ? "active" : ""} onClick={() => setActiveTab("grave")}>Grave <span>{dead}</span></button>
        </nav>
      </header>

      <main className="tracker-main">
        {activeTab === "game" && (
          <>
            <div className="game-controls">
              <div className="game-filters">
                {filter === "nuzlocke" && nextRoute && <button type="button" className="continue-button" onClick={() => locateRoute(nextRoute.id)}>Continuar en {nextRoute.name} <span>→</span></button>}
                <div className="filter-tabs" role="tablist" aria-label="Filtrar recorrido">
                  {([{ id: "nuzlocke", label: "Nuzlocke" }, { id: "routes", label: "Rutas" }, { id: "bosses", label: "Jefes" }, { id: "upcoming", label: "Próximos" }] as const).map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={filter === tab.id} className={filter === tab.id ? "active" : ""} onClick={() => setFilter(tab.id)}>{tab.label}</button>)}
                </div>
                {filter === "routes" && <div className="subfilters">{["all", "upcoming", "planned", "missed"].map((value) => <button type="button" key={value} className={routeFilter === value ? "active" : ""} onClick={() => setRouteFilter(value)}>{{ all: "Todas", upcoming: "Próximas", planned: "Planificadas", missed: "Perdidas" }[value]}</button>)}</div>}
                {filter === "bosses" && <div className="subfilters">{[{ value: "all", label: "Todos" }, { value: "gym", label: "Gimnasios" }, { value: "elite-four", label: "Alto Mando" }, { value: "rival", label: "Rivales" }, { value: "evil-team", label: "Equipo villano" }, { value: "titan", label: "Titanes" }].map((item) => <button type="button" key={item.value} className={bossFilter === item.value ? "active" : ""} onClick={() => setBossFilter(item.value)}>{item.label}</button>)}</div>}
              </div>
              <div className="game-tools">
                <VersionSelect game={game} value={run.version} onChange={(version) => updateRun({ ...run, version })} />
                <button type="button" className="settings-button" aria-label="Editar recorrido" title="Editar rutas, combates y sprites" onClick={() => { setEditorError(""); setEditorOpen(true); }}>EDITAR</button>
                <button type="button" className="settings-button" aria-label="Abrir ajustes" title="Ajustes" onClick={() => setSettingsOpen(true)}>AJUSTES</button>
                <input type="search" aria-label="Buscar en el recorrido" placeholder="Buscar…" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>

            <div className="run-summary"><span>{available} disponibles</span><span>{dead} caídos</span><span>{run.defeatedBosses.length}/{game.bosses.length} jefes</span></div>

            {!game.dataAvailable && <div className="data-notice"><strong>Guía no disponible en nuzlocke.data para este juego.</strong><p>No se han inventado rutas ni equipos. Puedes añadir ubicaciones personalizadas.</p><button type="button" className="button primary" onClick={() => addCustomRoute(0)}>Añadir ubicación</button></div>}
            {game.dataAvailable && filteredSteps.length === 0 && <div className="empty-state"><p>No hay ubicaciones ni jefes que coincidan con estos filtros.</p></div>}

            <div className="journey-list">
              {filteredSteps.map((step) => {
                if (step.kind === "boss") return <BossRow key={step.item.id} boss={step.item} defeated={run.defeatedBosses.includes(step.item.id)} showLevelCap={settings.levelCaps} starterType={run.starterType} onToggleDefeated={() => toggleBoss(step.item.id)} />;
                const route = step.item;
                const encounter = run.encounters.find((item) => item.routeId === route.id);
                const pokemon = encounter ? getPokemonKey(encounter) : undefined;
                const dupe = Boolean(encounter && run.rules.dupesClause && run.encounters.some((item) => item.id !== encounter.id && getPokemonKey(item) === pokemon));
                return <EncounterRow key={route.id} route={route} encounter={encounter} inTeam={encounter ? teamIds.includes(encounter.id) : false} teamFull={teamIds.length >= 6} dupe={dupe} settings={settings} starterType={run.starterType} onSelect={(pokemonName) => selectPokemon(route, pokemonName)} onPatch={(patch) => patchEncounter(route.id, patch)} onToggleTeam={() => encounter && toggleTeam(encounter.id)} onClear={() => clearEncounter(route.id)} onAddRoute={() => addCustomRoute(route.order)} onHide={() => hideRoute(route)} onStarterType={(starterType) => updateRun({ ...run, starterType })} />;
              })}
            </div>
          </>
        )}

        {activeTab === "box" && <BoxView encounters={run.encounters} routes={allRoutes} teamIds={teamIds} onPatch={patchEncounterById} onToggleTeam={toggleTeam} onEvolve={evolveEncounter} />}
        {activeTab === "grave" && <GraveView encounters={run.encounters} routes={allRoutes} onRevive={(id) => patchEncounterById(id, { status: "alive", caught: true })} onEdit={(id, previous) => { const notes = window.prompt("Epitafio", previous); if (notes !== null) patchEncounterById(id, { death: { notes } }); }} />}
      </main>

      <footer className="run-footer">Rutas y equipos: <a href="https://github.com/domtronn/nuzlocke.data" target="_blank" rel="noreferrer">nuzlocke.data</a> · Sprites: Pokémon Showdown, PokéAPI y Kyledove</footer>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal settings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h2>Ajustes de la run</h2><button type="button" className="icon-action" aria-label="Cerrar ajustes" onClick={() => setSettingsOpen(false)}>×</button></div>
            <div className="modal-body">
              <label>Nombre de la run<input value={run.name} onChange={(event) => updateRun({ ...run, name: event.target.value })} /></label>
              <label className="checkbox"><input type="checkbox" checked={settings.nicknames} onChange={(event) => updateSettings({ nicknames: event.target.checked })} /> Mostrar apodos en el recorrido</label>
              <label className="checkbox"><input type="checkbox" checked={settings.levelCaps} onChange={(event) => updateSettings({ levelCaps: event.target.checked })} /> Mostrar level caps</label>
              <label className="checkbox"><input type="checkbox" checked={settings.suggestions} onChange={(event) => updateSettings({ suggestions: event.target.checked })} /> Sugerir encuentros de cada ruta</label>
              <button type="button" className="button" disabled={!run.hiddenRouteIds?.length} onClick={() => updateRun({ ...run, hiddenRouteIds: [] })}>Restaurar ubicaciones ocultas ({run.hiddenRouteIds?.length ?? 0})</button>
            </div>
          </div>
        </div>
      )}

      {editorOpen && editorGame && (
        <JourneyEditor
          game={editorGame}
          error={editorError}
          onClose={() => { setEditorOpen(false); setEditorError(""); }}
          onSave={saveJourney}
          onReset={resetJourney}
        />
      )}
    </div>
  );
}
