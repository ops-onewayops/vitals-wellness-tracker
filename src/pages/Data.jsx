// src/pages/Data.jsx — v10.3: Recovery hero, premium metric rows, SVG icons

import { useTheme } from "../ThemeContext.jsx";
import { T, SPECTRUM } from "../themes.js";
import { useVitalsIntel } from "../intel.js";
import { generateBriefing } from "../briefing.js";
import { td, hr } from "../helpers.js";
import { Glass, GradCard, EI, Btn } from "../components/Glass.jsx";
import { motion } from "framer-motion";
import {
  IconHeart, IconDumbbell, IconMoon, IconDrop, IconUtensils,
  IconActivity, IconZap, IconTrendUp, IconChevronRight, IconScale, IconWind
} from "../components/Icons.jsx";

export default function Data({ data, go, onQuickLog, onDelete }) {
  const { theme: G } = useTheme();
  const intel = useVitalsIntel(data);
  const briefingText = generateBriefing(intel, data);
  const p = data.profile; const tgt = intel.tgt;
  const tc = intel.todayCal; const tp = intel.todayProt; const todayH = intel.todayWater;
  const avgSleep = intel.avgSleepHrs != null ? intel.avgSleepHrs.toFixed(1) : "—";
  const lb = data.bodyMetrics.length ? data.bodyMetrics[data.bodyMetrics.length - 1] : null;
  const wk = intel.workoutsThisWeek;
  const latestHR = intel.latestHR;
  const latestSpO2 = data.bloodOx.length ? data.bloodOx[data.bloodOx.length - 1] : null;
  const latestSteps = data.stepsData.length ? data.stepsData[data.stepsData.length - 1] : null;
  const ap = intel.activePains.length;
  const name = p.name || "";
  const needsSetup = !p.name;

  const coachObs = intel.protDeficit != null && intel.protDeficit > 30
    ? `Protein's been light — ${Math.round(intel.avgProt || 0)}g avg vs ${intel.tgt.protein}g target`
    : intel.staleMuscles.length > 0
      ? `${intel.staleMuscles.slice(0, 2).join(" & ")} haven't been trained in a while`
      : intel.recoveryScore != null && intel.recoveryScore < 50
        ? `Recovery at ${intel.recoveryScore} — ask your coach what to do`
        : "Your coach knows your data inside out";

  const score = intel.recoveryScore;
  const scoreColor = intel.recoveryColor || G.moss;
  const scoreLabel = intel.recoveryLabel || "";

  const metrics = [
    { v: tc,         u: `/ ${tgt.calories}`,  l: "CALORIES", c: G.moss,   p: Math.min(Math.round((tc / tgt.calories) * 100), 100) || 0 },
    { v: `${tp}g`,   u: `/ ${tgt.protein}g`,  l: "PROTEIN",  c: G.orange, p: Math.min(Math.round((tp / tgt.protein) * 100), 100) || 0 },
    { v: `${todayH}oz`, u: `/ ${tgt.water}oz`, l: "WATER",  c: G.teal,   p: Math.min(Math.round((todayH / tgt.water) * 100), 100) || 0 },
  ];

  const quickLog = [
    { l: "Meal",    Icon: IconUtensils, c: G.moss,   form: "meal" },
    { l: "Water",   Icon: IconDrop,     c: G.teal,   action: "water" },
    { l: "Workout", Icon: IconDumbbell, c: G.orange, form: "exercise" },
    { l: "Sleep",   Icon: IconMoon,     c: G.purple, form: "sleep" },
  ];

  return (
    <div style={{ position: "relative" }}>

      {/* Setup banner */}
      {needsSetup && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => go("settings")}
          style={{
            marginBottom: 16, borderRadius: 18, padding: "14px 18px",
            background: `${G.amber}12`, border: `1px solid ${G.amber}25`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{ fontSize: 24 }}>👋</div>
          <div>
            <div style={{ ...T.bodyMed, color: G.txt, fontWeight: 700 }}>Welcome to Vitals</div>
            <div style={{ ...T.caption, color: G.dim, marginTop: 2 }}>Set up your profile, goals, and targets →</div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          HERO — Recovery Score + Metrics
      ════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "relative", borderRadius: 28, overflow: "hidden",
          marginBottom: 16,
          background: score != null
            ? `linear-gradient(160deg, ${scoreColor}14 0%, rgba(5,5,8,0) 55%)`
            : G.glass,
          border: `1px solid ${score != null ? scoreColor + "22" : G.glassBorder}`,
        }}
      >
        {/* SPECTRUM top bar */}
        <div style={{ height: 3, background: SPECTRUM }} />

        {score != null ? (
          <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
            {/* Label */}
            <div style={{ ...T.nano, color: G.dim, letterSpacing: 2.5, marginBottom: 14 }}>
              RECOVERY SCORE
            </div>

            {/* Big number */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                fontSize: 96, fontWeight: 900, lineHeight: 1,
                color: scoreColor,
                letterSpacing: -5,
                filter: `drop-shadow(0 0 40px ${scoreColor}55)`,
              }}
            >
              {score}
            </motion.div>

            {/* Score label */}
            <div style={{
              ...T.caption, color: scoreColor,
              fontWeight: 700, marginTop: 8, opacity: 0.85, letterSpacing: 1,
            }}>
              {scoreLabel.toUpperCase()}
            </div>

            {/* SPECTRUM progress bar */}
            <div style={{
              margin: "20px 16px 6px",
              height: 4, borderRadius: 2,
              background: G.muted, overflow: "hidden", position: "relative",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  background: SPECTRUM, borderRadius: 2,
                }}
              />
            </div>
            <div style={{ ...T.nano, color: G.dim, letterSpacing: 0.8, marginBottom: 4 }}>
              Sleep · Nutrition · Training · Stress · Hydration
            </div>
          </div>
        ) : (
          <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
            <div style={{ ...T.nano, color: G.dim, letterSpacing: 2, marginBottom: 8 }}>RECOVERY SCORE</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: G.muted, letterSpacing: -2 }}>—</div>
            <div style={{ ...T.caption, color: G.dim, marginTop: 8 }}>Log sleep, stress, and workouts to unlock</div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: G.glassBorder, margin: "0 20px" }} />

        {/* Metrics row */}
        <div style={{ display: "flex", padding: "20px 8px 22px" }}>
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => go("log")}
              style={{
                flex: 1, textAlign: "center", padding: "0 6px",
                borderRight: i < 2 ? `1px solid ${G.glassBorder}` : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ ...T.nano, color: G.dim, letterSpacing: 2, marginBottom: 8 }}>{m.l}</div>
              <div style={{
                fontSize: 26, fontWeight: 900, color: m.c,
                letterSpacing: -1, lineHeight: 1,
              }}>{m.v}</div>
              <div style={{ ...T.nano, color: G.dim, marginTop: 3, marginBottom: 10 }}>{m.u}</div>
              <div style={{ height: 3, background: G.muted, borderRadius: 2, margin: "0 12px" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.p}%` }}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                  style={{ height: 3, background: m.c, borderRadius: 2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Coach teaser */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => go("coach")}
        style={{
          marginBottom: 16, borderRadius: 18, padding: "14px 18px",
          background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
          border: `1px solid ${G.glassBorder}`,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 18, flexShrink: 0,
          background: `${G.moss}18`, border: `1px solid ${G.moss}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconActivity size={16} color={G.moss} weight={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...T.caption, color: G.sub, lineHeight: 1.55 }}>{coachObs}</div>
        </div>
        <IconChevronRight size={14} color={G.dim} weight={2} />
      </motion.div>

      {/* Quick-log actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {quickLog.map((a, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => a.action === "water" ? onQuickLog("water") : go("log", a.form)}
            style={{
              flex: 1, background: `${a.c}10`, border: `1px solid ${a.c}22`,
              borderRadius: 16, padding: "12px 6px",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}
          >
            <a.Icon size={18} color={a.c} weight={2.2} />
            <span style={{ fontSize: 10, fontWeight: 700, color: a.c, letterSpacing: 0.2 }}>{a.l}</span>
          </motion.button>
        ))}
      </div>

      {/* Smart Signals */}
      {intel.signals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...T.micro, color: G.dim, marginBottom: 10 }}>SIGNALS</div>
          {intel.signals.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => go("coach")}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "11px 16px",
                background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
                borderRadius: 14, marginBottom: 6,
                border: `1px solid ${G.glassBorder}`,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
              <span style={{ ...T.caption, color: G.sub, lineHeight: 1.55 }}>{s.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vitals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <GradCard colors={G.gPurple} style={{ gridRow: "span 2", minHeight: 164 }} onClick={() => go("log")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <IconHeart size={14} color="rgba(255,255,255,0.75)" weight={2} />
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 0.5 }}>Heart Rate</div>
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{latestHR?.resting || "—"}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>bpm resting</div>
          {latestHR?.hrv && (
            <div style={{ marginTop: 14, padding: "6px 10px", background: "rgba(255,255,255,0.14)", borderRadius: 10, display: "inline-block" }}>
              <span style={{ fontSize: 10, opacity: 0.7 }}>HRV </span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>{latestHR.hrv}ms</span>
            </div>
          )}
        </GradCard>

        <GradCard colors={G.gMoss} onClick={() => go("log")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <IconDumbbell size={13} color="rgba(255,255,255,0.75)" weight={2} />
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75 }}>Workouts</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2 }}>{wk}</div>
          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>this week</div>
        </GradCard>

        <GradCard colors={G.gTeal} onClick={() => go("log")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <IconMoon size={13} color="rgba(255,255,255,0.75)" weight={2} />
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75 }}>Sleep</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2 }}>{avgSleep}</div>
          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>hrs avg</div>
        </GradCard>
      </div>

      {/* Mini vitals row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Weight", value: lb?.weight || "—", unit: "lbs", color: G.blue,  Icon: IconScale },
          { label: "SpO2",   value: latestSpO2?.value || "—", unit: "%", color: G.indigo, Icon: IconWind },
          { label: "Steps",  value: latestSteps?.count || "—", unit: "", color: G.pink,  Icon: IconActivity },
        ].map(({ label, value, unit, color, Icon }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            onClick={() => go("log")}
            style={{
              padding: "14px 10px", borderRadius: 18, textAlign: "center",
              background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
              border: `1px solid ${G.glassBorder}`, cursor: "pointer",
            }}
          >
            <Icon size={14} color={color} weight={2} style={{ margin: "0 auto 6px" }} />
            <div style={{ ...T.nano, color: G.dim, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: -0.5 }}>
              {value}<span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>{unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{
          background: G.glass, backdropFilter: G.blur, borderRadius: 20,
          padding: "5px 12px", border: `1px solid ${G.glassBorder}`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: G.purple }} />
          <span style={{ ...T.nano, color: G.sub }}>PRs: {data.prs.length}</span>
        </div>
        {ap > 0 && (
          <div style={{
            background: "rgba(255,77,106,.08)", borderRadius: 20,
            padding: "5px 12px", border: `1px solid rgba(255,77,106,.18)`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: G.red }} />
            <span style={{ ...T.nano, color: G.red }}>{ap} Active Pain{ap > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* AI Analysis teaser */}
      {data.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => go("coach")}
          style={{
            marginBottom: 16, borderRadius: 20, overflow: "hidden", cursor: "pointer",
            background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
            border: `1px solid ${G.glassBorder}`,
          }}
        >
          <div style={{ height: 2, background: SPECTRUM }} />
          <div style={{ padding: "14px 18px" }}>
            <div style={{ ...T.micro, color: G.moss, letterSpacing: 1.5, marginBottom: 8 }}>LATEST ANALYSIS</div>
            <div style={{ ...T.caption, color: G.sub, lineHeight: 1.65 }}>
              {data.insights[data.insights.length - 1].text?.slice(0, 200)}…
            </div>
          </div>
        </motion.div>
      )}

      {/* Today Feed */}
      {(() => {
        const today = td();
        const feed = [];
        data.nutrition.filter(n => n.date === today).forEach(n => feed.push({ k: n.id, arr: "nutrition", label: n.food, sub: `${n.meal} · ${n.calories || 0} cal`, color: G.moss }));
        data.training.filter(t => t.date === today).forEach(t => feed.push({ k: t.id, arr: "training", label: t.name, sub: t.type === "Strength" ? `${t.sets || ""}×${t.reps || ""}@${t.weight || ""}lbs` : `${t.type} · ${t.duration || ""}min`, color: G.orange }));
        data.hydration.filter(h => h.date === today).forEach(h => feed.push({ k: h.id, arr: "hydration", label: `${h.oz}oz ${h.type || "Water"}`, sub: h.time || "", color: G.teal }));
        data.supplements.filter(s => s.date === today).forEach(s => feed.push({ k: s.id, arr: "supplements", label: s.name, sub: `${s.timing}${s.dosage ? ` · ${s.dosage}` : ""}`, color: G.purple }));
        data.sleep.filter(s => s.date === today).forEach(s => feed.push({ k: s.id, arr: "sleep", label: `${s.hours}hrs sleep`, sub: s.quality, color: G.indigo }));
        data.lifestyle.filter(l => l.date === today).forEach(l => feed.push({ k: l.id, arr: "lifestyle", label: `Energy ${l.energy}/10 · Stress ${l.stress}/10`, sub: l.mood, color: G.pink }));
        data.bodyMetrics.filter(b => b.date === today).forEach(b => feed.push({ k: b.id, arr: "bodyMetrics", label: `${b.weight || "?"}lbs${b.bodyFat ? ` · ${b.bodyFat}% BF` : ""}`, sub: "Body", color: G.blue }));
        data.painLog.filter(p => p.date === today).forEach(p => feed.push({ k: p.id, arr: "painLog", label: `${p.location} pain`, sub: `${p.type} · ${p.severity}/10`, color: G.red }));
        data.postWorkout.filter(p => p.date === today).forEach(p => feed.push({ k: p.id, arr: "postWorkout", label: `Post-WO: RPE ${p.rpe}/10`, sub: `${p.mood} · Energy ${p.energy}/10`, color: G.amber }));

        if (feed.length === 0) return (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => go("log")}
            style={{
              marginBottom: 16, borderRadius: 20, padding: "24px 20px",
              textAlign: "center", cursor: "pointer",
              background: G.glass, backdropFilter: G.blur, border: `1px solid ${G.glassBorder}`,
            }}
          >
            <div style={{ ...T.bodyMed, color: G.sub, marginBottom: 4 }}>Your day is a blank canvas</div>
            <div style={{ ...T.caption, color: G.dim }}>Tap Log to start tracking →</div>
          </motion.div>
        );

        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...T.micro, color: G.dim, marginBottom: 10 }}>TODAY'S LOG</div>
            {feed.map((f, i) => (
              <motion.div key={f.k + i}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <EI primary={f.label} secondary={f.sub} color={f.color} onDelete={() => onDelete(f.arr, f.k)} />
              </motion.div>
            ))}
            <Btn onClick={() => go("log")} v="ghost" sx={{ fontSize: 12, padding: "6px 0", color: G.dim, marginTop: 4 }}>
              + Log more →
            </Btn>
          </div>
        );
      })()}
    </div>
  );
}
