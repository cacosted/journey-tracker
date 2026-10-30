import { setThemePreference, useThemePreference } from "../lib/theme";

export function ThemeToggle() {
  const preference = useThemePreference();
  return (
    <select
      aria-label="Tema"
      value={preference}
      onChange={(event) => setThemePreference(event.target.value as "system" | "light" | "dark")}
      className="theme-select"
    >
      <option value="system">Auto</option>
      <option value="light">Día</option>
      <option value="dark">Noche</option>
    </select>
  );
}
