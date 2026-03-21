// src/components/BottomNav.jsx — v10.3: SVG icons, premium active states

import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";
import { T, SPECTRUM } from "../themes.js";
import { IconBrain, IconChart, IconPlus, IconSettings } from "./Icons.jsx";

const TABS = [
  { id: "coach",    label: "Coach",    Icon: IconBrain   },
  { id: "data",     label: "Data",     Icon: IconChart   },
  { id: "log",      label: "Log",      Icon: IconPlus    },
  { id: "settings", label: "Settings", Icon: IconSettings },
];

export default function BottomNav({ current, onNav }) {
  const { theme: G } = useTheme();

  return (
    <div style={{
      position: "fixed", bottom: "calc(env(safe-area-inset-bottom) + 20px)", left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, width: "auto",
    }}>
      <div style={{
        background: G.navBg,
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        borderRadius: 32,
        border: `1px solid ${G.glassBorder2}`,
        padding: "6px 6px",
        display: "flex", gap: 2, alignItems: "center",
        boxShadow: G.navShadow,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const isCoach = id === "coach";
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                padding: isCoach ? "9px 20px" : "9px 16px",
                border: "none", borderRadius: 26,
                cursor: "pointer", fontFamily: "inherit",
                background: "transparent",
                minWidth: isCoach ? 72 : 60,
              }}
            >
              {/* Active background pill */}
              {active && (
                <motion.div
                  layoutId="navPill"
                  style={{
                    position: "absolute", inset: 0, borderRadius: 26,
                    background: isCoach
                      ? "rgba(45,211,111,0.12)"
                      : G.glass3,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}

              {/* SPECTRUM underline for active Coach */}
              {isCoach && active && (
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  style={{
                    position: "absolute", bottom: 4,
                    left: "20%", right: "20%",
                    height: 2, borderRadius: 1,
                    background: SPECTRUM,
                    transformOrigin: "center",
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              )}

              {/* Icon */}
              <div style={{ position: "relative", zIndex: 1 }}>
                <Icon
                  size={isCoach ? 21 : 19}
                  color={active
                    ? isCoach ? G.moss : G.txt
                    : G.dim}
                  weight={active ? 2.1 : 1.7}
                  style={{
                    filter: active
                      ? isCoach
                        ? `drop-shadow(0 0 8px ${G.moss}80)`
                        : "none"
                      : "none",
                    transition: "filter 0.2s",
                  }}
                />
              </div>

              {/* Label */}
              <span style={{
                position: "relative", zIndex: 1,
                ...T.nano,
                fontWeight: active ? 700 : 500,
                color: active ? (isCoach ? G.moss : G.txt) : G.dim,
                letterSpacing: active ? 0.2 : 0.3,
                transition: "color 0.2s",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
