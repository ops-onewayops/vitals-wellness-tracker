// src/pages/Data.jsx — Dashboard: recovery, rings, signals, vitals, today feed (renamed from Home.jsx)

import { useTheme } from "../ThemeContext.jsx";
import { useVitalsIntel } from "../intel.js";
import { generateBriefing } from "../briefing.js";
import { td, hr, sv } from "../helpers.js";
import { Glass, GradCard, Ring, EI, Btn } from "../components/Glass.jsx";
import { motion } from "framer-motion";

export default function Data({ data, setData, go, onQuickLog }) {
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

  const deleteEntry = (type, id) => {
    const nd = { ...data, [type]: data[type].filter(x => x.id !== id) };
    setData(nd); sv(nd);
  };

  // Build a relevant observation for coach teaser
  const coachObs = intel.protDeficit != null && intel.protDeficit > 30
    ? `Your protein's been light this week — averaging ${Math.round(intel.avgProt || 0)}g. Ask your coach about it →`
    : intel.staleMuscles.length > 0
      ? `${intel.staleMuscles.slice(0, 2).join(" & ")} haven't been trained in a while. Ask your coach for a plan →`
      : intel.recoveryScore != null && intel.recoveryScore < 50
        ? `Recovery is at ${intel.recoveryScore} — your coach can suggest what to do →`
        : "Your coach knows your data inside out. Tap to chat →";

  return <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", top: -40, left: -60, width: 300, height: 300, background: "radial-gradient(circle,rgba(45,211,111,.15) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
    <div style={{ position: "absolute", top: 200, right: -80, width: 300, height: 300, background: "radial-gradient(circle,rgba(180,142,255,.12) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
    <div style={{ position: "absolute", top: 500, left: -40, width: 250, height: 250, background: "radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ marginBottom: 24, paddingTop: 8 }}>
        <div style={{ fontSize: 13, color: G.dim, fontWeight: 500 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: G.txt, marginTop: 4, letterSpacing: -.5, lineHeight: 1.1 }}>
          {hr() < 12 ? "Good Morning" : hr() < 18 ? "Good Afternoon" : "Good Evening"}{name ? `, ${name}` : ""}<span style={{ color: G.moss }}>.</span>
        </div>
      </div>

      {needsSetup && <Glass glow={`radial-gradient(circle,${G.amber}25,transparent 70%)`} style={{ marginBottom: 16, borderRadius: 20, cursor: "pointer" }} onClick={() => go("settings")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>👋</span>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: G.txt }}>Welcome to Vitals</div>
            <div style={{ fontSize: 12, color: G.dim, marginTop: 2 }}>Tap here to set up your profile, goals, and macro targets.</div></div>
        </div>
      </Glass>}

      {/* Coach Teaser Card */}
      <Glass glow={`radial-gradient(circle at 0% 50%,${G.moss}25,transparent 60%)`} style={{ marginBottom: 14, borderRadius: 20, cursor: "pointer" }} onClick={() => go("coach")}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🧠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: G.sub, lineHeight: 1.6 }}>{coachObs}</div>
          </div>
        </div>
      </Glass>

      {/* Recovery Score + Rings */}
      <Glass glow="radial-gradient(circle at 30% 50%, rgba(45,211,111,.3), rgba(255,159,67,.2) 50%, rgba(34,211,238,.2) 100%)" style={{ marginBottom: 16, borderRadius: 24, overflow: "hidden" }}>
        {intel.recoveryScore != null && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${G.glassBorder}` }}>
          <Ring pct={intel.recoveryScore} size={52} stroke={5} color={intel.recoveryColor} trackColor={`${intel.recoveryColor}25`}>
            <div style={{ fontSize: 16, fontWeight: 800, color: intel.recoveryColor }}>{intel.recoveryScore}</div>
          </Ring>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: intel.recoveryColor }}>Recovery: {intel.recoveryLabel}</div>
            <div style={{ fontSize: 10, color: G.dim }}>Sleep · RPE · Pain · Stress · Hydration</div></div>
        </div>}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0" }}>
          {[{ p: Math.round((tc / tgt.calories) * 100), v: tc, u: `/${tgt.calories}`, l: "Calories", c: G.moss, go: "log" },
          { p: Math.round((tp / tgt.protein) * 100), v: tp + "g", u: `/${tgt.protein}g`, l: "Protein", c: G.orange, go: "log" },
          { p: Math.round((todayH / tgt.water) * 100), v: todayH, u: `/${tgt.water}oz`, l: "Water", c: G.teal, go: "log" }].map((r, i) =>
            <div key={i} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => go(r.go)}>
              <Ring pct={r.p} size={92} stroke={9} color={r.c} trackColor={`${r.c}25`}>
                <div style={{ fontSize: 21, fontWeight: 800, color: r.c }}>{r.v}</div>
                <div style={{ fontSize: 8, color: G.dim, fontWeight: 600 }}>{r.u}</div>
              </Ring>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.c, marginTop: 8, letterSpacing: .5 }}>{r.l}</div>
            </div>)}
        </div>
      </Glass>

      {/* Smart Signals (all of them) */}
      {intel.signals.length > 0 && <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: G.dim, letterSpacing: 1, marginBottom: 8 }}>SIGNALS</div>
        {intel.signals.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: G.glass, backdropFilter: G.blur, borderRadius: 14, marginBottom: 6, border: `1px solid ${G.glassBorder}`, cursor: "pointer" }}
            onClick={() => go("coach")}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: G.sub, lineHeight: 1.5, fontWeight: 500 }}>{s.text}</span>
          </motion.div>
        ))}
      </div>}

      {/* Quick-log actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[{ l: "+ Meal", icon: "🍽️", c: G.moss, form: "meal" }, { l: "+ Water", icon: "💧", c: G.teal, action: "water" }, { l: "+ Workout", icon: "💪", c: G.orange, form: "exercise" }, { l: "+ Sleep", icon: "🌙", c: G.purple, form: "sleep" }].map((a, i) =>
          <button key={i} onClick={() => { if (a.action === "water") { onQuickLog("water"); } else go("log", a.form); }}
            style={{ flex: 1, background: `${a.c}12`, border: `1px solid ${a.c}25`, borderRadius: 14, padding: "10px 4px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: a.c }}>{a.l}</span>
          </button>)}
      </div>

      {/* Vitals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <GradCard colors={G.gPurple} style={{ gridRow: "span 2", minHeight: 160 }} onClick={() => go("log")}>
          <div style={{ fontSize: 11, opacity: .8, fontWeight: 700, letterSpacing: .5 }}>Heart Rate</div>
          <div style={{ fontSize: 48, fontWeight: 800, marginTop: 8, lineHeight: 1 }}>{latestHR?.resting || "—"}</div>
          <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>bpm resting</div>
          {latestHR?.hrv && <div style={{ marginTop: 12, padding: "6px 10px", background: "rgba(255,255,255,.12)", borderRadius: 10, display: "inline-block" }}>
            <span style={{ fontSize: 11, opacity: .8 }}>HRV: </span><span style={{ fontSize: 14, fontWeight: 700 }}>{latestHR.hrv}ms</span>
          </div>}
        </GradCard>
        <GradCard colors={G.gMoss} onClick={() => go("log")}>
          <div style={{ fontSize: 11, opacity: .8, fontWeight: 700 }}>Workouts</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{wk}</div>
          <div style={{ fontSize: 11, opacity: .7 }}>this week</div>
        </GradCard>
        <GradCard colors={G.gTeal} onClick={() => go("log")}>
          <div style={{ fontSize: 11, opacity: .8, fontWeight: 700 }}>Sleep</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{avgSleep}</div>
          <div style={{ fontSize: 11, opacity: .7 }}>hrs avg</div>
        </GradCard>
      </div>

      {/* Vitals mini-grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        <Glass style={{ padding: 12, borderRadius: 16, textAlign: "center" }} onClick={() => go("log")}>
          <div style={{ fontSize: 9, color: G.dim, fontWeight: 700 }}>Weight</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: G.blue, marginTop: 2 }}>{lb?.weight || "—"}</div>
          <div style={{ fontSize: 9, color: G.dim }}>lbs</div>
        </Glass>
        <Glass style={{ padding: 12, borderRadius: 16, textAlign: "center" }} onClick={() => go("log")}>
          <div style={{ fontSize: 9, color: G.dim, fontWeight: 700 }}>SpO2</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: G.blue, marginTop: 2 }}>{latestSpO2?.value || "—"}<span style={{ fontSize: 9 }}>%</span></div>
          <div style={{ fontSize: 9, color: G.dim }}>latest</div>
        </Glass>
        <Glass style={{ padding: 12, borderRadius: 16, textAlign: "center" }} onClick={() => go("log")}>
          <div style={{ fontSize: 9, color: G.dim, fontWeight: 700 }}>Steps</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: G.pink, marginTop: 2 }}>{latestSteps?.count || "—"}</div>
          <div style={{ fontSize: 9, color: G.dim }}>latest</div>
        </Glass>
      </div>

      {/* Stat badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ background: G.glass2, backdropFilter: G.blur, borderRadius: 20, padding: "5px 12px", border: `1px solid ${G.glassBorder}`, display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: G.purple }} />
          <span style={{ fontSize: 11, color: G.sub, fontWeight: 600 }}>PRs: {data.prs.length}</span>
        </div>
        {ap > 0 && <div style={{ background: "rgba(255,77,106,.1)", borderRadius: 20, padding: "5px 12px", border: `1px solid rgba(255,77,106,.2)`, display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: G.red }} />
          <span style={{ fontSize: 11, color: G.red, fontWeight: 600 }}>{ap} Pain{ap > 1 ? "s" : ""}</span>
        </div>}
      </div>

      {/* AI Insight teaser */}
      {data.insights.length > 0 && <Glass glow={`radial-gradient(circle at 0% 50%,${G.moss}20,transparent 60%)`} style={{ marginBottom: 14, borderRadius: 20 }} onClick={() => go("coach")}>
        <div style={{ fontSize: 10, fontWeight: 700, color: G.moss, letterSpacing: 1.5, marginBottom: 8 }}>⬡ LATEST ANALYSIS</div>
        <div style={{ fontSize: 13, color: G.sub, lineHeight: 1.6 }}>{data.insights[data.insights.length - 1].text?.slice(0, 200)}...</div>
      </Glass>}

      {/* Today Feed */}
      {(() => {
        const today = td();
        const feed = [];
        data.nutrition.filter(n => n.date === today).forEach(n => feed.push({ k: n.id, type: "nutrition", label: n.food, sub: `${n.meal} · ${n.calories || 0} cal`, icon: "🍽️", color: G.moss }));
        data.training.filter(t => t.date === today).forEach(t => feed.push({ k: t.id, type: "training", label: t.name, sub: t.type === "Strength" ? `${t.sets || ""}×${t.reps || ""}@${t.weight || ""}lbs` : `${t.type} · ${t.duration || ""}min`, icon: "💪", color: G.orange }));
        data.hydration.filter(h => h.date === today).forEach(h => feed.push({ k: h.id, type: "hydration", label: `${h.oz}oz ${h.type || "Water"}`, sub: h.time || "", icon: "💧", color: G.teal }));
        data.supplements.filter(s => s.date === today).forEach(s => feed.push({ k: s.id, type: "supplements", label: s.name, sub: `${s.timing}${s.dosage ? ` · ${s.dosage}` : ""}`, icon: "💊", color: G.purple }));
        data.sleep.filter(s => s.date === today).forEach(s => feed.push({ k: s.id, type: "sleep", label: `${s.hours}hrs sleep`, sub: s.quality, icon: "🌙", color: G.indigo }));
        data.lifestyle.filter(l => l.date === today).forEach(l => feed.push({ k: l.id, type: "lifestyle", label: `Energy ${l.energy}/10 · Stress ${l.stress}/10`, sub: l.mood, icon: "🧘", color: G.pink }));
        data.bodyMetrics.filter(b => b.date === today).forEach(b => feed.push({ k: b.id, type: "bodyMetrics", label: `${b.weight || "?"}lbs${b.bodyFat ? ` · ${b.bodyFat}% BF` : ""}`, sub: "Body", icon: "📏", color: G.blue }));
        data.painLog.filter(p => p.date === today).forEach(p => feed.push({ k: p.id, type: "painLog", label: `${p.location} pain`, sub: `${p.type} · ${p.severity}/10`, icon: "🩹", color: G.red }));
        data.postWorkout.filter(p => p.date === today).forEach(p => feed.push({ k: p.id, type: "postWorkout", label: `Post-WO: RPE ${p.rpe}/10`, sub: `${p.mood} · Energy ${p.energy}/10`, icon: "⚡", color: G.amber }));
        if (feed.length === 0) return <Glass style={{ marginBottom: 16, borderRadius: 20, padding: 20, textAlign: "center" }} onClick={() => go("log")}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.sub, marginBottom: 4 }}>Your day is a blank canvas</div>
          <div style={{ fontSize: 11, color: G.dim }}>Ask your Coach or head to Log.</div>
        </Glass>;
        return <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.dim, letterSpacing: 1, marginBottom: 8 }}>TODAY'S LOG</div>
          {feed.map((f, i) => <motion.div key={f.k + i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <EI primary={f.label} secondary={f.sub} color={f.color} onDelete={() => deleteEntry(f.type, f.k)} />
          </motion.div>)}
          <Btn onClick={() => go("log")} v="ghost" sx={{ fontSize: 12, padding: "6px 0", color: G.dim, marginTop: 4 }}>+ Log more →</Btn>
        </div>;
      })()}
    </div>
  </div>;
}
