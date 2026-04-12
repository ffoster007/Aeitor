const THEME_STORAGE_KEY = "aeitor-theme";

export function buildThemeInitScript(): string {
  return `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const root = document.documentElement;
    const stored = localStorage.getItem(storageKey);
    const preference = stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = preference === "dark" || (preference === "system" && systemPrefersDark)
      ? "dark"
      : "light";

    root.classList.toggle("dark", resolved === "dark");
    root.dataset.theme = resolved;
  } catch {
    // Ignore failures and keep CSS defaults.
  }
})();
`;
}
