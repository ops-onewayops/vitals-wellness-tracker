// src/ThemeContext.jsx — Theme context, provider, and hook

import { createContext, useContext, useState, useEffect } from "react";
import { darkTheme, lightTheme } from "./themes.js";

const ThemeContext = createContext({ theme: darkTheme, mode: "auto", setMode: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem("vitals-theme") || "auto");
  const [sysDark, setSysDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  const setMode = (m) => {
    setModeState(m);
    localStorage.setItem("vitals-theme", m);
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSysDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedDark = mode === "dark" || (mode === "auto" && sysDark);
  const theme = resolvedDark ? darkTheme : lightTheme;

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.txt;
  }, [theme.bg, theme.txt]);

  return <ThemeContext.Provider value={{ theme, mode, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
