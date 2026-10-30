import { useSyncExternalStore } from "react";
import type { ThemePreference } from "../data/types";

const KEY = "journey-tracker.theme";
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

let preference = readPreference();

export function applyTheme() {
  if (preference === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", preference);
  }
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Private mode
  }
  applyTheme();
  for (const listener of listeners) listener();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => preference,
  );
}

applyTheme();
