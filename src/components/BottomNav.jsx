// src/components/BottomNav.jsx — [🧠 Coach] [📊 Data] [➕ Log] [⚙️] with sliding indicator

import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";

export default function BottomNav({ current, onNav }) {
  const { theme: G } = useTheme();
  const tabs = [
    { id: "coach", icon: "🧠", label: "Coach", big: true },
    { id: "data", icon: "📊", label: "Data" },
    { id: "log", icon: "➕", label: "Log" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "auto", maxWidth: 380 }}>
      <div style={{
        background: G.navBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 28, border: `1px solid ${G.glassBorder2}`, padding: "6px 8px",
        display: "flex", gap: 2, alignItems: "center", boxShadow: G.navShadow,
      }}>
        {tabs.map(t => {
          const isActive = current === t.id;
          const isCoach = t.id === "coach";
          return (
            <button key={t.id} onClick={() => onNav(t.id)}
              style={{
                flex: 1, position: "relative", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, padding: "10px 16px",
                border: "none", borderRadius: 22, cursor: "pointer", fontFamily: "inherit",
                background: "transparent", transition: "all .2s",
              }}>
              {isActive && (
                <motion.div layoutId="navIndicator"
                  style={{ position: "absolute", inset: 0, borderRadius: 22, background: G.glass3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }} />
              )}
              <span style={{
                position: "relative", zIndex: 1,
                fontSize: isCoach ? 22 : 20,
                color: isActive ? G.moss : G.dim,
                transition: "color .2s",
                filter: isActive ? `drop-shadow(0 0 ${isCoach ? "10" : "8"}px ${G.moss}60)` : "none",
              }}>{t.icon}</span>
              <span style={{
                position: "relative", zIndex: 1,
                fontSize: 9, fontWeight: isActive ? 700 : 500,
                color: isActive ? G.moss : G.dim,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
