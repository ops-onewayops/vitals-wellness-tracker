// src/pages/Coach.jsx — v10.3: Premium AI interface. Panel messages, chip actions, SVG icons.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";
import { td, uid, sv, haptic, loadChat, saveChat } from "../helpers.js";
import { useVitalsIntel } from "../intel.js";
import { generateBriefing, generateSmartActions, generateStatLine } from "../briefing.js";
import { Glass, Btn, Ring, Modal } from "../components/Glass.jsx";
import { callClaude, hasApiKey } from "../api.js";
import { getData, setData as setStorageData } from "../storage.js";
import { T, SPECTRUM } from "../themes.js";
import { IconArrowUp, IconChart, IconActivity, IconZap, IconSave, IconTrash } from "../components/Icons.jsx";
import { hr } from "../helpers.js";

// ─── PrismaticRing (recovery ring w/ easter egg) ───────────────────────────
function PrismaticRing({ pct, size, stroke, color, useSpectrum, G, children }) {
  const [sparkle, setSparkle] = useState(false);
  const holdTimer = useRef(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => { const t = setTimeout(() => setAnimPct(pct || 0), 100); return () => clearTimeout(t); }, [pct]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(animPct, 100) / 100) * circ;
  const gradId = `ring${color?.replace(/[^a-z0-9]/gi, "")}${size}`;

  return (
    <div
      style={{ position: "relative", width: size, height: size, cursor: "pointer", userSelect: "none" }}
      onMouseDown={() => { holdTimer.current = setTimeout(() => { setSparkle(true); haptic(60); setTimeout(() => setSparkle(false), 1400); }, 800); }}
      onMouseUp={() => clearTimeout(holdTimer.current)}
      onTouchStart={() => { holdTimer.current = setTimeout(() => { setSparkle(true); haptic(60); setTimeout(() => setSparkle(false), 1400); }, 800); }}
      onTouchEnd={() => clearTimeout(holdTimer.current)}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 10px ${color}50)` }}>
        <defs>
          {useSpectrum ? (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ff4d6a" /><stop offset="16%" stopColor="#ff9f43" />
              <stop offset="33%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#2dd36f" />
              <stop offset="66%" stopColor="#22d3ee" /><stop offset="83%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#b48eff" />
            </linearGradient>
          ) : (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color || G.moss} stopOpacity="1" />
              <stop offset="100%" stopColor={color || G.moss} stopOpacity="0.55" />
            </linearGradient>
          )}
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={G.muted} strokeWidth={stroke} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      <AnimatePresence>
        {sparkle && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.4 }}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, pointerEvents: "none" }}>
            ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Coach component ───────────────────────────────────────────────────
export default function Coach({ data, setData, go }) {
  const { theme: G } = useTheme();
  const intel = useVitalsIntel(data);
  const briefingText = generateBriefing(intel, data);
  const smartActions = generateSmartActions(intel, data);
  const statLine = generateStatLine(intel);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [err, setErr] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTab, setMoreTab] = useState("gen");
  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState(null);
  const [prismBurst, setPrismBurst] = useState(false);

  // ── Workout Builder state ────────────────────────────────────────────────
  const [wbF, setWbF] = useState({ focus: "Full Body", duration: "60", equipment: "Full Gym", intensity: "Moderate", notes: "" });
  const [wbLoading, setWbLoading] = useState(false);
  const [wbResult, setWbResult] = useState(null);
  const [wbErr, setWbErr] = useState(null);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [wbExpandedId, setWbExpandedId] = useState(null);
  const [wbLogLoading, setWbLogLoading] = useState(null);
  const [wbLogSuccess, setWbLogSuccess] = useState(null);

  useEffect(() => { (async () => { try { const s = await getData("vitals-workouts"); if (s) setSavedWorkouts(s); } catch {} })(); }, []);

  const generateWorkout = async () => {
    setWbLoading(true); setWbErr(null); setWbResult(null);
    try {
      const painH = data.painLog.filter(p => !p.resolved).map(p => `${p.location}(${p.type},sev:${p.severity}/10)`).join(", ");
      const prH = data.prs.slice(-15).map(p => `${p.exercise} ${p.repMax}@${p.weight}lbs`).join(", ");
      const recentTrain = data.training.slice(-14).map(t => `${t.date}:${t.name}${t.type === "Strength" ? ` ${t.sets}x${t.reps}@${t.weight}` : ""}`).join("\n");
      const sleepAvg = data.sleep.length ? (data.sleep.slice(-7).reduce((s, e) => s + Number(e.hours), 0) / Math.min(data.sleep.length, 7)).toFixed(1) : "unknown";
      const sys = `You are a knowledgeable, supportive strength & conditioning coach building a workout for ${data.profile.name || "the user"} — ${data.profile.age || ""}yo, goals: ${(data.profile.goals || []).join(", ") || "general fitness"}.
Recovery score: ${intel.recoveryScore != null ? intel.recoveryScore + "/100 (" + intel.recoveryLabel + ")" : "unknown"}
${intel.recoveryScore != null && intel.recoveryScore < 50 ? "Recovery is lower — suggest scaling back." : ""}
Stale muscle groups (good to hit): ${intel.staleMuscles.join(", ") || "none"}
Recently trained: ${intel.freshMuscles.join(", ") || "none"}
Active pains: ${painH || "None"} | Recent PRs: ${prH || "None"}
Recent training: ${recentTrain || "None"} | Sleep avg: ${sleepAvg}hrs
Supplements: ${[...new Set(data.supplements.map(s => s.name))].join(", ") || "None"}
Focus: ${wbF.focus} | Duration: ${wbF.duration}min | Equipment: ${wbF.equipment} | Intensity: ${wbF.intensity}
${wbF.notes ? "Notes: " + wbF.notes : ""}
RULES: Avoid exercises aggravating active pains. Prioritize stale muscles. Use actual PR numbers for weight targets (e.g. "Squat 4x6 @ 225lbs"). Include warm-up, main work, cool-down. Be encouraging and specific — coaching tone, not clinical.${data.profile.allergies ? ` No suggestions containing: ${data.profile.allergies}.` : ""}`;
      const txt = await callClaude({ system: sys, messages: [{ role: "user", content: "Generate my workout." }], maxTokens: 1500 });
      setWbResult(txt);
    } catch (e) { setWbErr(e.message || "Failed."); }
    setWbLoading(false);
  };

  const saveWorkout = async () => {
    if (!wbResult) return;
    const entry = { id: uid(), date: td(), focus: wbF.focus, duration: wbF.duration, intensity: wbF.intensity, equipment: wbF.equipment, workout: wbResult };
    const ns = [entry, ...savedWorkouts].slice(0, 20); setSavedWorkouts(ns);
    try { await setStorageData("vitals-workouts", ns); } catch {}
  };

  const deleteSavedWorkout = async (id) => {
    const ns = savedWorkouts.filter(w => w.id !== id); setSavedWorkouts(ns);
    if (wbExpandedId === id) setWbExpandedId(null);
    try { await setStorageData("vitals-workouts", ns); } catch {}
  };

  const logWorkoutToTraining = async (workoutText, workoutDate) => {
    setWbLogLoading(workoutDate); setWbLogSuccess(null);
    try {
      const txt = await callClaude({ system: `Parse this workout plan into individual exercises. Return ONLY a JSON array. Format: [{"name":"Name","type":"Strength"|"Cardio"|"Plyometrics"|"Mobility","sets":"N","reps":"N","weight":"N","duration":"N","notes":"..."}]. Extract every exercise, skip pure stretches. For weights use number only.`, messages: [{ role: "user", content: `Parse:\n${workoutText}` }] });
      const exercises = JSON.parse(txt.replace(/```json|```/g, "").trim());
      if (!Array.isArray(exercises) || exercises.length === 0) throw new Error("No exercises parsed");
      const entries = exercises.map(ex => ({ id: uid(), type: ex.type || "Strength", name: ex.name, sets: String(ex.sets || ""), reps: String(ex.reps || ""), weight: String(ex.weight || ""), duration: String(ex.duration || ""), distance: "", notes: ex.notes || "", date: workoutDate || td() }));
      const nd = { ...data, training: [...data.training, ...entries] }; setData(nd); sv(nd);
      setWbLogSuccess(workoutDate); setTimeout(() => setWbLogSuccess(null), 3000);
    } catch (e) { setWbErr("Parse failed: " + (e.message || "")); }
    setWbLogLoading(null);
  };
  const chatEndRef = useRef(null);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, chatLoading]);

  useEffect(() => {
    (async () => {
      const saved = await loadChat();
      if (saved && saved.length > 0) setChatHistory(saved);
      setChatReady(true);
    })();
  }, []);

  useEffect(() => {
    if (chatReady && chatHistory.length > 0) saveChat(chatHistory);
  }, [chatHistory, chatReady]);

  const isNewUser = !data.profile?.name;
  useEffect(() => {
    if (chatReady && isNewUser && chatHistory.length === 0) {
      setChatHistory([{
        role: "assistant",
        content: "Hey! I'm your wellness coach. Before we get started, head to Settings to set up your name, goals, and daily targets — it helps me give you better advice.\n\nOnce you're set up, come back here and I'll be ready to help with nutrition, training, recovery, and anything else."
      }]);
    }
  }, [chatReady, isNewUser]);

  useEffect(() => {
    const st = document.createElement("style");
    st.id = "coach-v103-styles";
    st.textContent = `
      @keyframes ambientDrift1 {
        0%,100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes ambientDrift2 {
        0%,100% { background-position: 100% 50%; }
        50% { background-position: 0% 50%; }
      }
      @keyframes thinkPulse {
        0%,100% { opacity: 0.15; transform: scaleY(0.5); }
        50% { opacity: 1; transform: scaleY(1); }
      }
      .coach-msgs::-webkit-scrollbar { display: none; }
      .coach-msgs { -ms-overflow-style: none; scrollbar-width: none; }
      .coach-chips::-webkit-scrollbar { display: none; }
      .coach-chips { -ms-overflow-style: none; scrollbar-width: none; }
      .coach-input:focus { border-color: rgba(45,211,111,0.45) !important; }
    `;
    if (!document.getElementById("coach-v103-styles")) document.head.appendChild(st);
    return () => { document.getElementById("coach-v103-styles")?.remove(); };
  }, []);

  const handleScroll = useCallback(() => {
    if (msgsRef.current) setCollapsed(msgsRef.current.scrollTop > 20);
  }, []);

  const buildContext = () => {
    const mem = data.aiMemory.slice(-12).map(m => `[${m.date}] ${m.summary}`).join("\n");
    const painH = data.painLog.map(p => `${p.date}:${p.location}(${p.type},sev:${p.severity})${p.resolved ? "[resolved]" : "[active]"}`).join("\n");
    const prH = data.prs.slice(-25).map(p => `${p.date}:${p.exercise} ${p.repMax}@${p.weight}lbs`).join("\n");
    const pwH = data.postWorkout.slice(-14).map(p => `${p.date}:RPE${p.rpe} Energy${p.energy} ${p.mood}`).join("\n");
    const suppH = [...new Set(data.supplements.map(s => s.name))].join(", ");
    const hydAvg = intel.avgWater != null ? Math.round(intel.avgWater) : 0;
    const hrD = data.heartRate.slice(-7).map(h => `${h.date}:rest${h.resting} HRV:${h.hrv}`).join("\n");
    return { mem, painH, prH, pwH, suppH, hydAvg, hrD };
  };

  const coachPersonality = `You are a knowledgeable, supportive wellness coach — think of yourself as a good training partner who's also well-read on nutrition and recovery. Your tone is:
- Warm and encouraging, never clinical or alarming
- Conversational — talk like a friend, not a textbook
- Specific to the user's actual data — reference their real numbers, not generic advice
- Honest but constructive — if something needs attention, frame it as an opportunity, not a problem
- Concise — get to the point, no filler paragraphs

NEVER use words like: CRITICAL, DEFICIENCY, ALARMING, WARNING, DANGER, SEVERE, URGENT, CONCERNING (in caps or otherwise alarmist framing).
Instead of "CRITICAL PROTEIN DEFICIENCY" say something like "Your protein has been running a bit low — around ${Math.round(intel.avgProt || 0)}g vs your ${intel.tgt.protein}g target. An extra shake or some chicken would close that gap."
Instead of "WARNING: Overtraining detected" say "You've been going hard — your body might appreciate a lighter day."

When referencing data, be specific: use actual numbers, dates, and exercise names from their log. Don't generalize.`;

  const buildCoachSys = () => {
    const ctx = buildContext();
    return `${coachPersonality}

ABOUT THIS PERSON:
${data.profile.name || "User"}, ${data.profile.age || ""}yo. Goals: ${(data.profile.goals || []).join(", ") || "general wellness"}. ${data.profile.allergies ? `Allergies/restrictions: ${data.profile.allergies}.` : ""} ${data.profile.units || "imperial"} units.
Targets: ${intel.tgt.calories}cal, ${intel.tgt.protein}g protein, ${intel.tgt.water}oz water.
Recovery score: ${intel.recoveryScore != null ? intel.recoveryScore + "/100 (" + intel.recoveryLabel + ")" : "not enough data yet"}.

CURRENT DATA SNAPSHOT:
Today: ${intel.todayCal}cal, ${intel.todayProt}g protein, ${intel.todayWater}oz water.
7-day averages: ${Math.round(intel.avgCal || 0)}cal, ${Math.round(intel.avgProt || 0)}g protein, ${Math.round(intel.avgWater || 0)}oz water.
Sleep: avg ${intel.avgSleepHrs != null ? intel.avgSleepHrs.toFixed(1) : "?"}hrs. Workouts this week: ${intel.workoutsThisWeek}.
${intel.avgRPE != null ? "Avg RPE: " + intel.avgRPE.toFixed(1) + "/10. " : ""}${intel.avgStress != null ? "Avg stress: " + intel.avgStress.toFixed(1) + "/10. " : ""}
Stale muscle groups (5+ days): ${intel.staleMuscles.join(", ") || "none"}.
Active pains: ${intel.activePains.map(p => p.location + " (" + p.type + ", " + p.severity + "/10)").join(", ") || "none"}.

MEMORY (past analyses):
${ctx.mem || "First session."}
PAIN HISTORY: ${ctx.painH || "None."}
PRs: ${ctx.prH || "None."}
POST-WORKOUT: ${ctx.pwH || "None."}
SUPPLEMENTS: ${ctx.suppH || "None."}
HYDRATION avg: ${ctx.hydAvg}oz/day
HEART RATE: ${ctx.hrD || "None."}

LOGGING CAPABILITY:
You can log items for the user. When they mention food, exercises, water, supplements, sleep, weight, or mood, offer to log it. When they confirm (or if they clearly want it logged like "log 8 hours sleep"), include a JSON block the app will parse:

\`\`\`vitals-log
{"entries":[
  {"type":"meal","food":"description","calories":N,"protein":N,"carbs":N,"fat":N,"meal":"Lunch"},
  {"type":"training","name":"Exercise","sets":"N","reps":"N","weight":"N","exerciseType":"Strength"},
  {"type":"water","oz":"N"},
  {"type":"supplement","name":"Name","dosage":"5g","timing":"Morning"},
  {"type":"sleep","hours":"N","quality":"Good","bedtime":"23:00","wakeTime":"06:30"},
  {"type":"body","weight":"N","bodyFat":"N"},
  {"type":"lifestyle","energy":"N","stress":"N","mood":"Good"},
  {"type":"pain","location":"Lower Back","painType":"Dull/Aching","severity":"N"}
]}
\`\`\`
Only include relevant types. For meals, estimate accurate macros using USDA data. Always confirm before logging unless the user explicitly asks to log.`;
  };

  const executeLogBlock = (text) => {
    const match = text.match(/```vitals-log\s*([\s\S]*?)\s*```/);
    if (!match) return { cleaned: text, count: 0 };
    let logData; try { logData = JSON.parse(match[1]); } catch { return { cleaned: text, count: 0 }; }
    if (!logData?.entries) return { cleaned: text, count: 0 };
    let nd = { ...data }; let count = 0; const date = td();
    logData.entries.forEach(entry => {
      const id = uid();
      if (entry.type === "meal")      { nd.nutrition = [...nd.nutrition, { meal: entry.meal || "Lunch", food: entry.food || "", calories: String(entry.calories || 0), protein: String(entry.protein || 0), carbs: String(entry.carbs || 0), fat: String(entry.fat || 0), date, id }]; count++; }
      if (entry.type === "training")  { nd.training = [...nd.training, { type: entry.exerciseType || "Strength", name: entry.name || "", sets: String(entry.sets || ""), reps: String(entry.reps || ""), weight: String(entry.weight || ""), duration: String(entry.duration || ""), notes: "", date, id }]; count++; }
      if (entry.type === "water")     { nd.hydration = [...nd.hydration, { oz: String(entry.oz || 16), type: "Water", date, time: new Date().toTimeString().slice(0, 5), id }]; count++; }
      if (entry.type === "supplement"){ nd.supplements = [...nd.supplements, { name: entry.name || "", dosage: entry.dosage || "", timing: entry.timing || "Morning", date, id }]; count++; }
      if (entry.type === "sleep")     { nd.sleep = [...nd.sleep, { hours: String(entry.hours || ""), quality: entry.quality || "Good", bedtime: entry.bedtime || "", wakeTime: entry.wakeTime || "", date, id }]; count++; }
      if (entry.type === "body")      { nd.bodyMetrics = [...nd.bodyMetrics, { weight: String(entry.weight || ""), bodyFat: String(entry.bodyFat || ""), date, id }]; count++; }
      if (entry.type === "lifestyle") { nd.lifestyle = [...nd.lifestyle, { energy: String(entry.energy || 5), stress: String(entry.stress || 5), mood: entry.mood || "Good", date, id }]; count++; }
      if (entry.type === "pain")      { nd.painLog = [...nd.painLog, { location: entry.location || "", type: entry.painType || "Dull/Aching", severity: String(entry.severity || 5), resolved: false, date, id }]; count++; }
    });
    if (count > 0) { setData(nd); sv(nd); haptic(); }
    const cleaned = text.replace(/```vitals-log[\s\S]*?```/g, "").trim() + (count > 0 ? `\n\n✓ Logged ${count} item${count > 1 ? "s" : ""}` : "");
    return { cleaned, count };
  };

  // ─── Easter egg: "dark side" ────────────────────────────────────────────
  const DARK_SIDE_REPLY = "We're all just light passing through a prism. 🌈\n\nKeep logging. Keep moving. The data is the music.";

  const doSend = async (msg) => {
    if (!msg.trim() || chatLoading) return;

    if (msg.trim().toLowerCase() === "dark side") {
      setChatHistory(h => [...h,
        { role: "user", content: msg },
        { role: "assistant", content: DARK_SIDE_REPLY, prism: true }
      ]);
      setChatInput("");
      setPrismBurst(true); haptic(80);
      setTimeout(() => setPrismBurst(false), 3200);
      return;
    }

    const userMsg = { role: "user", content: msg };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory); setChatInput(""); setChatLoading(true); setErr(null);
    try {
      const sys = buildCoachSys() + `\n\nThis is a conversation. Answer the user's specific question using their data. Be concise (1-3 short paragraphs max). If they mention food they ate, exercises, sleep, supplements etc — offer to log it or log it directly if they ask. Always be specific, never generic.`;
      const messages = newHistory.slice(-10);
      const txt = await callClaude({ system: sys, messages, maxTokens: 1000 });
      const { cleaned } = executeLogBlock(txt);
      setChatHistory([...newHistory, { role: "assistant", content: cleaned }]);
    } catch (e) { setErr(e.message || "Failed."); setChatHistory(newHistory); }
    setChatLoading(false);
  };

  const sendChat = () => doSend(chatInput);
  const tapAction = (action) => { if (!action.msg) { inputRef.current?.focus(); return; } doSend(action.msg); };

  const genAnalysis = async () => {
    setGenLoading(true); setGenErr(null); try {
      const sys = buildCoachSys() + `\n\nGive a comprehensive but readable analysis. Structure it naturally — don't use headers like "NUTRITION ANALYSIS" or clinical formatting. Instead, flow through what's going well, what could use attention, and 2-3 specific action items. Keep it to about 300 words. Reference their actual numbers.\n\nCross-reference domains: connect sleep to training performance, nutrition to recovery, hydration to energy, pain to exercise selection. Spot patterns.\n\nEnd with: [MEMORY]: one-sentence key takeaway for next time.`;
      const payload = { recentNutrition: data.nutrition.slice(-28), recentTraining: data.training.slice(-28), recentBody: data.bodyMetrics.slice(-8), recentSleep: data.sleep.slice(-21), recentLifestyle: data.lifestyle.slice(-21) };
      const txt = await callClaude({ system: sys, messages: [{ role: "user", content: `Here's my recent data — give me your take:\n${JSON.stringify(payload, null, 2)}` }] });
      const mM = txt.match(/\[MEMORY\]:?\s*(.+)/); const mN = mM ? mM[1].trim() : txt.slice(0, 120);
      const nd = { ...data, insights: [...data.insights, { id: uid(), date: td(), text: txt }], aiMemory: [...data.aiMemory, { id: uid(), date: td(), summary: mN }] }; setData(nd); sv(nd);
    } catch (e) { setGenErr(e.message || "Failed."); } setGenLoading(false);
  };

  const showSuggestions = chatHistory.length < 3;
  const useSpectrumRing = intel.recoveryScore != null && intel.recoveryScore >= 75;

  const name = data.profile?.name || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", position: "relative" }}>

      {/* Greeting — command center header */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ paddingTop: 4, paddingBottom: 16 }}
        >
          <div style={{ ...T.nano, color: intel.recoveryColor || "#515168", letterSpacing: 2, marginBottom: 5 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
          </div>
          <div style={{ ...T.display, color: "#eeeef5" }}>
            {hr() < 12 ? "Good Morning" : hr() < 18 ? "Good Afternoon" : "Good Evening"}
            {name ? `, ${name}` : ""}<span style={{ color: intel.recoveryColor || "#2dd36f" }}>.</span>
          </div>
        </motion.div>
      )}

      {/* DSOTM Prism Easter Egg */}
      <AnimatePresence>
        {prismBurst && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(4,4,8,0.96)",
            }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 80, lineHeight: 1, filter: "drop-shadow(0 0 44px rgba(180,142,255,0.75))" }}>◭</div>
            </motion.div>
            <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease: "easeOut" }}
              style={{
                width: "75%", maxWidth: 280, height: 5, borderRadius: 3,
                background: SPECTRUM,
                boxShadow: "0 0 28px rgba(180,142,255,0.55), 0 0 56px rgba(45,211,111,0.35)",
                transformOrigin: "left center",
              }} />
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.65, duration: 0.35 }}
              style={{ marginTop: 24, ...T.nano, color: "rgba(255,255,255,0.4)", letterSpacing: 3.5 }}>
              DARK SIDE OF THE MOON
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          HEADER — Ambient + Recovery
      ════════════════════════════════════════ */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, overflow: "hidden",
        borderRadius: collapsed ? 0 : 22,
        transition: "all 0.25s ease",
        marginBottom: collapsed ? 0 : 12,
      }}>
        {/* Ambient layers */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 15% 50%, ${G.ambientA}, transparent 55%),
                       radial-gradient(ellipse at 85% 50%, ${G.ambientB}, transparent 55%)`,
          backgroundSize: "200% 200%",
          animation: "ambientDrift1 14s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 55% 35%, ${G.ambientC}, transparent 55%)`,
          backgroundSize: "200% 200%",
          animation: "ambientDrift2 18s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        {/* SPECTRUM top edge */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: SPECTRUM,
          opacity: collapsed ? 0.18 : 0.35,
          transition: "opacity 0.25s ease",
        }} />
        {/* Glass base */}
        <div style={{
          position: "absolute", inset: 0,
          background: G.glass,
          backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
          border: `1px solid ${G.glassBorder}`,
          borderRadius: collapsed ? 0 : 22,
        }} />

        <div style={{ position: "relative", zIndex: 1, padding: collapsed ? "10px 16px" : "18px 18px 16px", transition: "padding 0.25s ease" }}>
          {collapsed ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ ...T.nano, color: G.dim, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {statLine}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {intel.recoveryScore != null && (
                  <PrismaticRing pct={intel.recoveryScore} size={34} stroke={3} color={intel.recoveryColor} useSpectrum={useSpectrumRing} G={G}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: intel.recoveryColor }}>{intel.recoveryScore}</div>
                  </PrismaticRing>
                )}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMoreOpen(true)}
                  style={{ background: G.glass2, border: `1px solid ${G.glassBorder}`, borderRadius: 10, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconChart size={14} color={G.sub} weight={2} />
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, paddingRight: 14 }}>
                  <div style={{ ...T.bodyMed, color: G.sub, lineHeight: 1.7 }}>{briefingText}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {intel.recoveryScore != null && (
                    <PrismaticRing pct={intel.recoveryScore} size={54} stroke={4.5} color={intel.recoveryColor} useSpectrum={useSpectrumRing} G={G}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: intel.recoveryColor, letterSpacing: -0.5 }}>{intel.recoveryScore}</div>
                    </PrismaticRing>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMoreOpen(true)}
                    style={{ background: G.glass2, border: `1px solid ${G.glassBorder}`, borderRadius: 12, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconChart size={16} color={G.sub} weight={2} />
                  </motion.button>
                </div>
              </div>
              <div style={{ ...T.nano, color: G.dim, letterSpacing: 0.5, opacity: 0.75 }}>{statLine}</div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SMART ACTION CHIPS — horizontal scroll
      ════════════════════════════════════════ */}
      {!collapsed && hasApiKey() && smartActions.length > 0 && (
        <div className="coach-chips" style={{ overflowX: "auto", display: "flex", gap: 7, paddingBottom: 12, flexShrink: 0 }}>
          {smartActions.map((a, i) => (
            <motion.button key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => tapAction(a)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 8,
                background: `${a.color}0e`,
                border: `1px solid ${a.color}28`,
                borderRadius: 24, padding: "8px 14px 8px 10px",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 15 }}>{a.icon}</span>
              <div>
                <div style={{ ...T.caption, fontWeight: 700, color: G.txt, lineHeight: 1.2 }}>{a.title}</div>
                <div style={{ ...T.nano, color: G.dim, marginTop: 1 }}>{a.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {!hasApiKey() && (
        <div style={{
          marginBottom: 12, padding: "12px 16px", borderRadius: 14, flexShrink: 0,
          background: `${G.orange}0e`, border: `1px solid ${G.orange}25`,
        }}>
          <div style={{ ...T.caption, color: G.orange, fontWeight: 600 }}>
            Add your Anthropic API key in Settings to use Coach
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MESSAGES — Panel style, no bubbles
      ════════════════════════════════════════ */}
      <div ref={msgsRef} className="coach-msgs" onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>

        {chatHistory.length === 0 && !chatLoading && (
          <div style={{ textAlign: "center", padding: "48px 16px 20px" }}>
            <div style={{ ...T.nano, color: G.dim, letterSpacing: 1, opacity: 0.45 }}>
              Ask anything — or tap a suggestion above
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => {
          const isUser = msg.role === "user";
          const isPrism = msg.prism;
          const isLog = !isUser && msg.content?.includes("✓ Logged");
          const logLine = isLog ? msg.content.match(/(✓ Logged .+)/)?.[1] : null;
          const mainContent = isLog ? msg.content.replace(/\n*✓ Logged .+/, "").trim() : msg.content;

          return (
            <div key={i}>
              {mainContent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{
                    marginBottom: 14,
                    ...(isUser
                      ? { display: "flex", justifyContent: "flex-end" }
                      : {}),
                  }}
                >
                  {isUser ? (
                    // User message — refined pill
                    <div style={{
                      maxWidth: "76%",
                      padding: "11px 16px",
                      background: G.msgUserBg,
                      border: `1px solid ${G.msgUserBorder}`,
                      borderRadius: "20px 20px 5px 20px",
                      ...T.body,
                      color: G.txt,
                      whiteSpace: "pre-wrap",
                    }}>
                      {mainContent}
                    </div>
                  ) : (
                    // AI message — panel with left accent, no bubble
                    <div style={{
                      paddingLeft: 16,
                      borderLeft: `2.5px solid ${isPrism
                        ? "transparent"
                        : intel.recoveryColor || G.moss}`,
                      ...(isPrism ? {
                        borderImage: SPECTRUM + " 1",
                        borderImageSlice: 1,
                      } : {}),
                    }}>
                      <div style={{
                        ...T.body,
                        color: G.txt,
                        lineHeight: 1.75,
                        whiteSpace: "pre-wrap",
                      }}>
                        {mainContent}
                      </div>
                      {isPrism && (
                        <div style={{ marginTop: 10, height: 2, borderRadius: 1, background: SPECTRUM, opacity: 0.55, maxWidth: 180 }} />
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {logLine && (
                <div style={{ textAlign: "center", padding: "2px 0 12px" }}>
                  <span style={{
                    ...T.nano, color: G.moss, fontWeight: 700, letterSpacing: 0.5,
                    background: `${G.moss}14`, border: `1px solid ${G.moss}28`,
                    borderRadius: 20, padding: "4px 12px",
                  }}>
                    {logLine}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking indicator — slim animated bars */}
        {chatLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ paddingLeft: 16, borderLeft: `2.5px solid ${G.muted}`, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 18 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 3, borderRadius: 2,
                  height: 14,
                  background: G.dim,
                  animation: "thinkPulse 1.1s ease infinite",
                  animationDelay: `${i * 0.13}s`,
                }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion pills */}
      {showSuggestions && hasApiKey() && !isNewUser && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", paddingBottom: 10, flexShrink: 0 }}>
          {["Should I train today?", "What should I eat?", "How's my recovery?"].map((s, i) => (
            <motion.button key={i} whileTap={{ scale: 0.94 }} onClick={() => doSend(s)}
              style={{
                background: G.glass, border: `1px solid ${G.glassBorder}`,
                borderRadius: 20, padding: "7px 15px",
                ...T.caption, fontWeight: 500, color: G.sub,
                cursor: "pointer", fontFamily: "inherit",
              }}>{s}</motion.button>
          ))}
        </div>
      )}

      {isNewUser && (
        <div style={{ textAlign: "center", paddingBottom: 10, flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => go("settings")}
            style={{
              background: `linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,
              color: "#fff", border: "none", borderRadius: 16,
              padding: "12px 24px", ...T.bodyMed,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 4px 20px ${G.moss}30`,
            }}>Set Up Profile →</motion.button>
        </div>
      )}

      {/* ═══════════════════════════════════════
          INPUT BAR — Premium
      ════════════════════════════════════════ */}
      <div style={{
        display: "flex", gap: 10, padding: "12px 0 4px",
        borderTop: `1px solid ${G.glassBorder}`,
        flexShrink: 0, alignItems: "center",
      }}>
        <input
          ref={inputRef}
          className="coach-input"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder="Ask your coach..."
          style={{
            flex: 1,
            background: G.inputBg,
            border: `1.5px solid ${G.glassBorder}`,
            borderRadius: 28,
            padding: "13px 20px",
            color: G.txt,
            ...T.bodyMed,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 440, damping: 20 }}
          onClick={sendChat}
          disabled={chatLoading || !chatInput.trim()}
          style={{
            background: chatInput.trim()
              ? `linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`
              : G.glass2,
            border: `1px solid ${chatInput.trim() ? "transparent" : G.glassBorder}`,
            borderRadius: "50%",
            width: 48, height: 48,
            cursor: chatInput.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: chatInput.trim() ? `0 4px 20px ${G.moss}45` : "none",
          }}
        >
          <IconArrowUp
            size={18}
            color={chatInput.trim() ? "#fff" : G.dim}
            weight={2.5}
          />
        </motion.button>
      </div>

      {err && <div style={{ ...T.caption, color: G.red, paddingTop: 4, flexShrink: 0 }}>{err}</div>}

      {/* ═══════════════════════════════════════
          ANALYSIS MODAL
      ════════════════════════════════════════ */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Coach Tools">
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["gen", "Analyze"], ["workout", "Workout"], ["hist", "History"], ["mem", "Memory"]].map(([k, l]) => (
            <button key={k} onClick={() => setMoreTab(k)} style={{
              flex: 1,
              background: moreTab === k ? `${G.moss}16` : G.glass2,
              border: `1px solid ${moreTab === k ? G.moss + "38" : G.glassBorder}`,
              borderRadius: 10, padding: "9px 10px",
              ...T.caption, fontWeight: 700,
              color: moreTab === k ? G.moss : G.sub,
              cursor: "pointer", fontFamily: "inherit",
            }}>{l}</button>
          ))}
        </div>

        {/* ── Workout Builder tab ─────────────────────────────────── */}
        {moreTab === "workout" && (
          <div>
            <Glass glow={`radial-gradient(circle, ${G.amber}20, transparent 70%)`} style={{ marginBottom: 14, borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.txt, marginBottom: 3 }}>AI Workout Builder</div>
              <div style={{ fontSize: 12, color: G.dim, lineHeight: 1.55, marginBottom: 14 }}>Builds a program from your PRs, recovery, pain points, and muscle freshness.</div>
              <Fld label="Focus" opts={["Full Body","Upper Body","Lower Body","Push","Pull","Legs","Chest & Triceps","Back & Biceps","Shoulders","Arms","Core","Explosive/Plyo","Active Recovery"]} value={wbF.focus} set={v => setWbF({ ...wbF, focus: v })} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Fld label="Duration (min)" opts={["30","45","60","75","90"]} value={wbF.duration} set={v => setWbF({ ...wbF, duration: v })} /></div>
                <div style={{ flex: 1 }}><Fld label="Intensity" opts={["Light","Moderate","High","Max Effort"]} value={wbF.intensity} set={v => setWbF({ ...wbF, intensity: v })} /></div>
              </div>
              <Fld label="Equipment" opts={["Full Gym","Dumbbells Only","Barbell & Rack","Bodyweight","Home Gym","Cables & Machines"]} value={wbF.equipment} set={v => setWbF({ ...wbF, equipment: v })} />
              <Fld label="Notes (optional)" type="textarea" value={wbF.notes} set={v => setWbF({ ...wbF, notes: v })} ph="e.g. Want to hit heavy squats today" />
              <Btn onClick={generateWorkout} disabled={wbLoading} sx={{ width: "100%", padding: 13, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <IconZap size={14} color="currentColor" />
                {wbLoading ? "Building workout…" : "Generate Workout"}
              </Btn>
            </Glass>
            {wbErr && <div style={{ ...T.caption, color: G.red, marginBottom: 10 }}>{wbErr}</div>}
            {wbResult && (
              <Glass style={{ borderRadius: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.txt }}>{wbF.focus}</div>
                    <div style={{ fontSize: 11, color: G.dim }}>{wbF.duration}min · {wbF.intensity}</div>
                  </div>
                  <Btn onClick={saveWorkout} v="secondary" sx={{ fontSize: 11, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}>
                    <IconSave size={12} color="currentColor" />Save
                  </Btn>
                </div>
                <div style={{ ...T.caption, color: G.sub, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{wbResult}</div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${G.glassBorder}` }}>
                  <Btn onClick={() => logWorkoutToTraining(wbResult, td())} disabled={wbLogLoading === td()} sx={{ width: "100%", padding: 11 }} v="primary">
                    {wbLogLoading === td() ? "Parsing…" : wbLogSuccess === td() ? "Logged to Training" : "Log All Exercises to Training"}
                  </Btn>
                </div>
              </Glass>
            )}
            {savedWorkouts.length > 0 && (
              <div>
                <div style={{ ...T.nano, color: G.dim, letterSpacing: 1, marginBottom: 8 }}>SAVED ({savedWorkouts.length})</div>
                {savedWorkouts.map(w => (
                  <Glass key={w.id} style={{ marginBottom: 8, borderRadius: 14, cursor: "pointer" }} onClick={() => setWbExpandedId(wbExpandedId === w.id ? null : w.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: G.txt }}>{w.focus}</div>
                        <div style={{ fontSize: 11, color: G.dim }}>{w.date} · {w.duration}min · {w.intensity}</div>
                      </div>
                      <span style={{ fontSize: 12, color: G.dim }}>{wbExpandedId === w.id ? "▲" : "▼"}</span>
                    </div>
                    {wbExpandedId === w.id && (
                      <div onClick={e => e.stopPropagation()}>
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${G.glassBorder}`, fontSize: 13, color: G.sub, lineHeight: 1.65, whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>{w.workout}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <Btn onClick={() => logWorkoutToTraining(w.workout, w.date)} disabled={wbLogLoading === w.date} sx={{ flex: 1, padding: 10, fontSize: 12 }} v="primary">
                            {wbLogLoading === w.date ? "Parsing…" : wbLogSuccess === w.date ? "Logged" : "Log to Training"}
                          </Btn>
                          <button onClick={() => deleteSavedWorkout(w.id)} style={{ background: `${G.red}15`, border: `1px solid ${G.red}20`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <IconTrash size={14} color={G.red} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Glass>
                ))}
              </div>
            )}
          </div>
        )}

        {moreTab === "gen" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Btn onClick={genAnalysis} disabled={genLoading} sx={{ padding: "12px 28px", fontSize: 14, borderRadius: 14 }}>
                {genLoading ? "Analyzing…" : "Run Full Analysis"}
              </Btn>
              {genErr && <div style={{ ...T.caption, color: G.red, marginTop: 6 }}>{genErr}</div>}
            </div>
            {data.insights.length > 0 && (
              <Glass style={{ borderRadius: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ ...T.micro, color: G.moss, letterSpacing: 1 }}>LATEST</span>
                  <span style={{ ...T.nano, color: G.dim }}>{data.insights[data.insights.length - 1].date}</span>
                </div>
                <div style={{ ...T.caption, color: G.sub, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {data.insights[data.insights.length - 1].text}
                </div>
              </Glass>
            )}
          </div>
        )}

        {moreTab === "hist" && (
          <div>
            {data.insights.length === 0
              ? <div style={{ ...T.caption, color: G.dim, textAlign: "center", padding: 20 }}>No analyses yet</div>
              : [...data.insights].reverse().map((ins, i) => (
                <Glass key={ins.id} style={{ marginBottom: 10, borderRadius: 14 }}>
                  <div style={{ ...T.nano, color: G.dim, marginBottom: 6 }}>{ins.date}</div>
                  <div style={{ ...T.caption, color: G.sub, lineHeight: 1.65 }}>{ins.text?.slice(0, 300)}…</div>
                </Glass>
              ))}
          </div>
        )}

        {moreTab === "mem" && (
          <div>
            {data.aiMemory.length === 0
              ? <div style={{ ...T.caption, color: G.dim, textAlign: "center", padding: 20 }}>No memories yet — run an analysis first</div>
              : [...data.aiMemory].reverse().map((m, i) => (
                <div key={m.id} style={{
                  paddingLeft: 14, borderLeft: `2px solid ${G.moss}40`,
                  marginBottom: 10,
                }}>
                  <div style={{ ...T.nano, color: G.dim, marginBottom: 3 }}>{m.date}</div>
                  <div style={{ ...T.caption, color: G.sub, lineHeight: 1.55 }}>{m.summary}</div>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
