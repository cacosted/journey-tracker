import { useEffect, useState } from "react";
import { generateId } from "../data/storage";
import type { Boss, BossPokemon, Game, ProgressStep, Route } from "../data/types";
import { TrainerSprite } from "../routes/BossRow";

interface JourneyEditorProps {
  game: Game;
  error: string;
  onClose: () => void;
  onSave: (steps: ProgressStep[]) => void;
  onReset: () => void;
}

export function JourneyEditor({ game, error, onClose, onSave, onReset }: JourneyEditorProps) {
  const [steps, setSteps] = useState<ProgressStep[]>(() => game.steps.map((step): ProgressStep => step.kind === "route"
    ? { kind: "route", item: { ...step.item } }
    : { kind: "boss", item: { ...step.item } }));
  const [editing, setEditing] = useState<{ index: number; kind: ProgressStep["kind"] } | null>(null);
  const [dirty, setDirty] = useState(false);

  function requestClose() {
    if ((editing || dirty) && !window.confirm("¿Salir sin guardar los cambios del recorrido?")) return;
    onClose();
  }

  function saveStep(step: ProgressStep) {
    if (!editing) return;
    const next = [...steps];
    if (editing.index < next.length) next[editing.index] = step;
    else next.push(step);
    setSteps(next.map((item, order): ProgressStep => item.kind === "route"
      ? { kind: "route", item: { ...item.item, order } }
      : { kind: "boss", item: { ...item.item, order } }));
    setDirty(true);
    setEditing(null);
  }

  function move(index: number, offset: number) {
    const destination = index + offset;
    if (destination < 0 || destination >= steps.length) return;
    const next = [...steps];
    [next[index], next[destination]] = [next[destination], next[index]];
    setSteps(next.map((step, order): ProgressStep => step.kind === "route"
      ? { kind: "route", item: { ...step.item, order } }
      : { kind: "boss", item: { ...step.item, order } }));
    setDirty(true);
  }

  function remove(index: number) {
    if (!window.confirm("¿Eliminar este paso del recorrido? Las capturas guardadas no se borrarán.")) return;
    setSteps(steps.filter((_, itemIndex) => itemIndex !== index));
    setDirty(true);
  }

  function reset() {
    if (window.confirm("¿Restaurar el recorrido original del juego? Se perderán sus personalizaciones.")) onReset();
  }

  return (
    <div className="modal-backdrop editor-backdrop">
      <section className="modal editor-modal" role="dialog" aria-modal="true" aria-labelledby="journey-editor-title">
        <div className="modal-header">
          <div><span className="eyebrow">PERSONALIZAR {game.name.toUpperCase()}</span><h2 id="journey-editor-title">Editor del recorrido</h2></div>
          <button type="button" className="icon-action" aria-label="Cerrar editor" onClick={requestClose}>×</button>
        </div>
        <p className="editor-help">Edita rutas, combates, equipos y sprites. Los cambios se guardan para este juego en este navegador y se aplican a todas sus runs.</p>
        {error && <p className="editor-error" role="alert">{error}</p>}
        {editing ? (
          <StepEditor game={game} step={steps[editing.index]} kind={editing.kind} onSave={saveStep} onCancel={() => setEditing(null)} />
        ) : (
          <>
            <div className="editor-toolbar">
              <button type="button" className="button primary" onClick={() => setEditing({ index: steps.length, kind: "route" })}>+ Ruta</button>
              <button type="button" className="button primary" onClick={() => setEditing({ index: steps.length, kind: "boss" })}>+ Combate</button>
              <button type="button" className="button" onClick={reset}>Restaurar original</button>
            </div>
            <ol className="editor-list">
              {steps.map((step, index) => (
                <li key={step.item.id} className={`editor-step ${step.kind}`}>
                  <div className="editor-order"><button type="button" aria-label={`Subir ${step.item.name}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><span>{index + 1}</span><button type="button" aria-label={`Bajar ${step.item.name}`} disabled={index === steps.length - 1} onClick={() => move(index, 1)}>↓</button></div>
                  <div className="editor-step-info"><small>{step.kind === "route" ? "RUTA" : step.item.type === "gym" ? "GIMNASIO" : "COMBATE"}</small><strong>{step.item.name}</strong><span>{step.kind === "route" ? `${step.item.options?.length ?? 0} encuentros sugeridos` : `${step.item.location} · ${step.item.team.length} Pokémon`}</span>{step.kind === "boss" && step.item.versions?.length ? <small>{step.item.versions.map((id) => game.versions.find((version) => version.id === id)?.name ?? id).join(" / ")}</small> : null}</div>
                  <div className="editor-step-actions"><button type="button" className="button small" onClick={() => setEditing({ index, kind: step.kind })}>Editar</button><button type="button" className="button danger small" aria-label={`Eliminar ${step.item.name}`} onClick={() => remove(index)}>Eliminar</button></div>
                </li>
              ))}
              {steps.length === 0 && <li className="empty-state">El recorrido está vacío. Añade una ruta o un combate.</li>}
            </ol>
          </>
        )}
        {!editing && <div className="editor-footer"><button type="button" className="button" onClick={requestClose}>Cerrar</button><button type="button" className="button primary" disabled={!dirty} onClick={() => onSave(steps)}>Guardar cambios</button></div>}
      </section>
    </div>
  );
}

interface StepEditorProps {
  game: Game;
  step?: ProgressStep;
  kind: ProgressStep["kind"];
  onSave: (step: ProgressStep) => void;
  onCancel: () => void;
}

function StepEditor({ game, step, kind, onSave, onCancel }: StepEditorProps) {
  if (kind === "route") {
    const route = step?.kind === "route" ? step.item : undefined;
    return <RouteEditor route={route} gameSlug={game.slug} onSave={(item) => onSave({ kind: "route", item })} onCancel={onCancel} />;
  }
  const boss = step?.kind === "boss" ? step.item : undefined;
  return <BossEditor boss={boss} game={game} onSave={(item) => onSave({ kind: "boss", item })} onCancel={onCancel} />;
}

function RouteEditor({ route, gameSlug, onSave, onCancel }: { route?: Route; gameSlug: Game["slug"]; onSave: (route: Route) => void; onCancel: () => void }) {
  const [options, setOptions] = useState(route?.options?.join(", ") ?? "");
  return (
    <form className="editor-form" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const encounters = options.split(",").map((name) => name.trim()).filter(Boolean);
      const name = String(data.get("name") ?? "").trim();
      onSave({
        id: route?.id ?? `${gameSlug}-route-custom-${generateId()}`,
        name,
        order: route?.order ?? 0,
        options: encounters,
        encounters: encounters.join(", "),
        isStarter: data.get("starter") === "on",
        custom: route?.custom,
      });
    }}>
      <h3>{route ? `Editar ${route.name}` : "Nueva ruta"}</h3>
      <div className="editor-fields"><label>Nombre de la ubicación<input name="name" required defaultValue={route?.name ?? ""} placeholder="Ej. Area Zero" /></label><label className="editor-wide">Encuentros sugeridos<textarea value={options} onChange={(event) => setOptions(event.target.value)} placeholder="nombres separados por comas" rows={3} /><small>Se podrán seleccionar al elegir un encuentro; la búsqueda libre seguirá disponible.</small></label><label className="checkbox editor-wide"><input name="starter" type="checkbox" defaultChecked={route?.isStarter ?? false} /> Es la ubicación del starter</label></div>
      <div className="editor-form-actions"><button type="button" className="button" onClick={onCancel}>Volver</button><button type="submit" className="button primary">Aplicar cambios</button></div>
    </form>
  );
}

function BossEditor({ boss, game, onSave, onCancel }: { boss?: Boss; game: Game; onSave: (boss: Boss) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Boss>(() => boss ? { ...boss, team: boss.team.map((member) => ({ ...member })) } : {
    id: `${game.slug}-boss-custom-${generateId()}`,
    name: "",
    location: "",
    type: "gym",
    order: 0,
    team: [],
  });
  const [spriteError, setSpriteError] = useState("");

  function update(patch: Partial<Boss>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function uploadSprite(file?: File) {
    setSpriteError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setSpriteError("Usa una imagen PNG, JPG, WebP o GIF.");
      return;
    }
    if (file.size > 2_000_000) {
      setSpriteError("La imagen no puede superar 2 MB.");
      return;
    }
    try {
      update({ image: await prepareSprite(file), spriteCredit: "Personalizado" });
    } catch {
      setSpriteError("No se pudo leer la imagen.");
    }
  }

  return (
    <form className="editor-form" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get("name") ?? "").trim();
      const levels = draft.team.map((member) => member.level).filter((level) => level > 0);
      onSave({
        ...draft,
        name,
        location: String(data.get("location") ?? "").trim(),
        type: data.get("type") as Boss["type"],
        speciality: String(data.get("speciality") ?? "").trim() || undefined,
        levelCap: levels.length ? Math.max(...levels) : undefined,
      });
    }}>
      <h3>{boss ? `Editar ${boss.name}` : "Nuevo combate"}</h3>
      <div className="editor-fields">
        <label>Nombre del personaje<input name="name" required value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej. AI Turo" /></label>
        <label>Ubicación<input name="location" required value={draft.location} onChange={(event) => update({ location: event.target.value })} placeholder="Ej. Zero Lab" /></label>
        <label>Tipo de combate<select name="type" value={draft.type} onChange={(event) => update({ type: event.target.value as Boss["type"] })}><option value="gym">Gimnasio</option><option value="rival">Rival</option><option value="elite-four">Alto Mando</option><option value="champion">Campeón / Final</option><option value="evil-team">Equipo villano</option><option value="titan">Titán</option></select></label>
        <label>Especialidad<input name="speciality" value={draft.speciality ?? ""} onChange={(event) => update({ speciality: event.target.value })} placeholder="Opcional" /></label>
        {game.versions.length > 1 && <label className="editor-wide">Aparece en<select aria-label="Versiones de este combate" value={draft.versions?.[0] ?? "all"} onChange={(event) => update({ versions: event.target.value === "all" ? undefined : [event.target.value] })}><option value="all">Ambas versiones</option>{game.versions.map((version) => <option key={version.id} value={version.id}>{version.name}</option>)}</select></label>}
      </div>
      <fieldset className="sprite-editor"><legend>Sprite del personaje</legend><div className="sprite-editor-preview"><TrainerSprite boss={draft} /><div><label>URL del sprite<input type="url" value={draft.image?.startsWith("data:") ? "" : draft.image ?? ""} onChange={(event) => update({ image: event.target.value || undefined })} placeholder="https://…" /></label><label className="file-button">Subir imagen<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void uploadSprite(event.target.files?.[0])} /></label><small>PNG, JPG, WebP o GIF · máx. 2 MB. Las imágenes subidas se optimizan.</small><button type="button" className="button small" onClick={() => update({ image: undefined, spriteCredit: undefined, trainerSprite: draft.name.toLowerCase().replace(/[^a-z0-9]/g, "") })}>Usar sprite automático</button>{spriteError && <p className="editor-error" role="alert">{spriteError}</p>}</div></div></fieldset>
      <fieldset className="team-editor"><legend>Equipo</legend>{draft.team.map((member, index) => <PokemonEditor key={index} member={member} onChange={(next) => update({ team: draft.team.map((item, itemIndex) => itemIndex === index ? next : item) })} onRemove={() => update({ team: draft.team.filter((_, itemIndex) => itemIndex !== index) })} />)}<button type="button" className="button" onClick={() => update({ team: [...draft.team, { pokemonName: "", level: 1, moves: [] }] })}>+ Añadir Pokémon</button></fieldset>
      <div className="editor-form-actions"><button type="button" className="button" onClick={onCancel}>Volver</button><button type="submit" className="button primary">Aplicar cambios</button></div>
    </form>
  );
}

function PokemonEditor({ member, onChange, onRemove }: { member: BossPokemon; onChange: (member: BossPokemon) => void; onRemove: () => void }) {
  const [moves, setMoves] = useState((member.moves ?? []).join(", "));
  useEffect(() => setMoves((member.moves ?? []).join(", ")), [member.pokemonName]);
  return (
    <div className="pokemon-editor">
      <label>Pokémon<input required value={member.pokemonName ?? ""} onChange={(event) => onChange({ ...member, pokemonName: event.target.value })} placeholder="Ej. roaring-moon" /></label>
      <label>Nivel<input type="number" min="1" max="100" required value={member.level} onChange={(event) => onChange({ ...member, level: Number(event.target.value) })} /></label>
      <label>Habilidad<input value={member.ability ?? ""} onChange={(event) => onChange({ ...member, ability: event.target.value || undefined })} /></label>
      <label>Movimientos<input value={moves} onChange={(event) => { setMoves(event.target.value); onChange({ ...member, moves: event.target.value.split(",").map((move) => move.trim()).filter(Boolean) }); }} placeholder="Separados por comas" /></label>
      <button type="button" className="icon-action" aria-label={`Quitar ${member.pokemonName || "Pokémon"}`} onClick={onRemove}>×</button>
    </div>
  );
}

function prepareSprite(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File error"));
    reader.onload = () => {
      const source = String(reader.result);
      if (file.type === "image/gif") {
        resolve(source);
        return;
      }
      const image = new Image();
      image.onerror = () => reject(new Error("Image error"));
      image.onload = () => {
        const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas error"));
          return;
        }
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}
