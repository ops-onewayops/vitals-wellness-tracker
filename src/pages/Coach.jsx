// src/pages/Coach.jsx — v10.1: The Coach IS the app. Full-screen conversational interface.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";
import { td, uid, sv, haptic } from "../helpers.js";
import { getData, setData as setStorageData } from "../storage.js";
import { useVitalsIntel } from "../intel.js";
import { generateBriefing, generateSmartActions, generateStatLine } from "../briefing.js";
import { Glass, Btn, Ring, Modal } from "../components/Glass.jsx";
import { callClaude, hasApiKey } from "../api.js";

export default function Coach({ data, setData, go }) {
  const { theme: G } = useTheme();
  const intel = useVitalsIntel(data);
  const briefingText = generateBriefing(intel, data);
  const smartActions = generateSmartActions(intel, data);
  const statLine = generateStatLine(intel);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTab, setMoreTab] = useState("gen");
  const [genLoading, setGenLoading] = useState(false);
  const [genErr, setGenErr] = useState(null);
  const chatEndRef = useRef(null);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    getData("vitals-chat").then(h => { if (Array.isArray(h) && h.length) setChatHistory(h); }).catch(() => {});
  }, []);

  // Persist chat history whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) setStorageData("vitals-chat", chatHistory).catch(() => {});
  }, [chatHistory]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, chatLoading]);

  // Inject CSS keyframes
  useEffect(() => {
    const st = document.createElement("style");
    st.id = "coach-v11-styles";
    st.textContent = `
      @keyframes ambientDrift1 {
        0%,100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes ambientDrift2 {
        0%,100% { background-position: 100% 50%; }
        50% { background-position: 0% 50%; }
      }
      @keyframes thinkDot {
        0%,80%,100% { opacity:0.25; transform:scale(0.7); }
        40% { opacity:1; transform:scale(1); }
      }
      .coach-msgs::-webkit-scrollbar { display: none; }
      .coach-msgs { -ms-overflow-style: none; scrollbar-width: none; }
      .coach-actions::-webkit-scrollbar { display: none; }
      .coach-actions { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    if (!document.getElementById("coach-v11-styles")) document.head.appendChild(st);
    return () => { document.getElementById("coach-v11-styles")?.remove(); };
  }, []);

  // Scroll detection for header collapse
  const handleScroll = useCallback(() => {
    if (msgsRef.current) {
      setCollapsed(msgsRef.current.scrollTop > 20);
    }
  }, []);

  // ── All AI prompts preserved exactly from v10 ──

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

  // ── executeLogBlock preserved exactly ──
  const executeLogBlock = (text) => {
    const match = text.match(/```vitals-log\s*([\s\S]*?)\s*```/);
    if (!match) return { cleaned: text, count: 0 };
    let logData; try { logData = JSON.parse(match[1]); } catch { return { cleaned: text, count: 0 }; }
    if (!logData?.entries) return { cleaned: text, count: 0 };
    let nd = { ...data }; let count = 0; const date = td();
    logData.entries.forEach(entry => {
      const id = uid();
      if (entry.type === "meal") { nd.nutrition = [...nd.nutrition, { meal: entry.meal || "Lunch", food: entry.food || "", calories: String(entry.calories || 0), protein: String(entry.protein || 0), carbs: String(entry.carbs || 0), fat: String(entry.fat || 0), date, id }]; count++; }
      if (entry.type === "training") { nd.training = [...nd.training, { type: entry.exerciseType || "Strength", name: entry.name || "", sets: String(entry.sets || ""), reps: String(entry.reps || ""), weight: String(entry.weight || ""), duration: String(entry.duration || ""), notes: "", date, id }]; count++; }
      if (entry.type === "water") { nd.hydration = [...nd.hydration, { oz: String(entry.oz || 16), type: "Water", date, time: new Date().toTimeString().slice(0, 5), id }]; count++; }
      if (entry.type === "supplement") { nd.supplements = [...nd.supplements, { name: entry.name || "", dosage: entry.dosage || "", timing: entry.timing || "Morning", date, id }]; count++; }
      if (entry.type === "sleep") { nd.sleep = [...nd.sleep, { hours: String(entry.hours || ""), quality: entry.quality || "Good", bedtime: entry.bedtime || "", wakeTime: entry.wakeTime || "", date, id }]; count++; }
      if (entry.type === "body") { nd.bodyMetrics = [...nd.bodyMetrics, { weight: String(entry.weight || ""), bodyFat: String(entry.bodyFat || ""), date, id }]; count++; }
      if (entry.type === "lifestyle") { nd.lifestyle = [...nd.lifestyle, { energy: String(entry.energy || 5), stress: String(entry.stress || 5), mood: entry.mood || "Good", date, id }]; count++; }
      if (entry.type === "pain") { nd.painLog = [...nd.painLog, { location: entry.location || "", type: entry.painType || "Dull/Aching", severity: String(entry.severity || 5), resolved: false, date, id }]; count++; }
    });
    if (count > 0) { setData(nd); sv(nd); haptic(); }
    const cleaned = text.replace(/```vitals-log[\s\S]*?```/g, "").trim() + (count > 0 ? `\n\n✅ Logged ${count} item${count > 1 ? "s" : ""}!` : "");
    return { cleaned, count };
  };

  const doSend = async (msg) => {
    if (!msg.trim() || chatLoading) return;
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

  const tapAction = (action) => {
    if (!action.msg) { inputRef.current?.focus(); return; }
    doSend(action.msg);
  };

  // ── Analysis ──
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", position: "relative" }}>

      {/* ── Ambient Header (sticky, collapsible) ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, overflow: "hidden",
        borderRadius: collapsed ? 0 : 20,
        transition: "all 0.25s ease",
        marginBottom: collapsed ? 0 : 12,
      }}>
        {/* Animated gradient background */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse at 20% 50%, ${G.moss}${collapsed ? "08" : "18"}, transparent 60%),
            radial-gradient(ellipse at 80% 50%, ${G.purple}${collapsed ? "05" : "12"}, transparent 60%)
          `,
          backgroundSize: "200% 200%",
          animation: "ambientDrift1 12s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 60% 40%, ${G.teal}08, transparent 60%)`,
          backgroundSize: "200% 200%",
          animation: "ambientDrift2 15s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{ position: "absolute", inset: 0, background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur, border: `1px solid ${G.glassBorder}`, borderRadius: collapsed ? 0 : 20 }} />

        <div style={{ position: "relative", zIndex: 1, padding: collapsed ? "8px 16px" : "18px 18px 14px", transition: "padding 0.25s ease" }}>

          {/* ── Collapsed: compact stat bar ── */}
          {collapsed && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, color: G.dim, fontWeight: 600, letterSpacing: 0.5, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {statLine}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {intel.recoveryScore != null && (
                  <Ring pct={intel.recoveryScore} size={32} stroke={3} color={intel.recoveryColor} trackColor={`${intel.recoveryColor}25`}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: intel.recoveryColor }}>{intel.recoveryScore}</div>
                  </Ring>
                )}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMoreOpen(true)}
                  style={{ background: G.glass2, border: `1px solid ${G.glassBorder}`, borderRadius: 10, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: G.sub }}>
                  📊
                </motion.button>
              </div>
            </div>
          )}

          {/* ── Expanded: full briefing ── */}
          {!collapsed && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1, paddingRight: 12 }}>
                  <div style={{ fontSize: 14, color: G.sub, lineHeight: 1.65, fontWeight: 500 }}>{briefingText}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {intel.recoveryScore != null && (
                    <Ring pct={intel.recoveryScore} size={48} stroke={4} color={intel.recoveryColor} trackColor={`${intel.recoveryColor}25`}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: intel.recoveryColor }}>{intel.recoveryScore}</div>
                    </Ring>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMoreOpen(true)}
                    style={{ background: G.glass2, border: `1px solid ${G.glassBorder}`, borderRadius: 12, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: G.sub }}>
                    📊
                  </motion.button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: G.dim, fontWeight: 500, letterSpacing: 0.5 }}>{statLine}</div>
            </>
          )}
        </div>
      </div>

      {/* ── Smart Action Cards (scrollable row) ── */}
      {!collapsed && hasApiKey() && smartActions.length > 0 && (
        <div className="coach-actions" style={{ overflowX: "auto", display: "flex", gap: 8, paddingBottom: 12, flexShrink: 0 }}>
          {smartActions.map((a, i) => (
            <motion.button key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => tapAction(a)}
              style={{
                flexShrink: 0, width: 130, background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
                border: `1px solid ${G.glassBorder}`, borderRadius: 16, padding: "12px 14px",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: G.txt, lineHeight: 1.25, marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: G.dim, lineHeight: 1.3 }}>{a.sub}</div>
            </motion.button>
          ))}
        </div>
      )}

      {!hasApiKey() && (
        <Glass style={{ marginBottom: 12, padding: 14, borderRadius: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: G.orange, fontWeight: 600 }}>Add your API key in Settings to use AI features</div>
        </Glass>
      )}

      {/* ── Chat Messages (fills remaining space, NO container box) ── */}
      <div ref={msgsRef} className="coach-msgs" onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>

        {chatHistory.length === 0 && !chatLoading && (
          <div style={{ textAlign: "center", padding: "40px 16px 20px", opacity: 0.6 }}>
            <div style={{ fontSize: 11, color: G.dim, lineHeight: 1.5 }}>Tap a card above or type below</div>
          </div>
        )}

        {chatHistory.map((msg, i) => {
          const isUser = msg.role === "user";
          const isLog = !isUser && msg.content?.includes("✅ Logged");
          const logLine = isLog ? msg.content.match(/(✅ Logged .+)/)?.[1] : null;
          const mainContent = isLog ? msg.content.replace(/\n*✅ Logged .+/, "").trim() : msg.content;

          return (
            <div key={i}>
              {mainContent && (
                <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                    style={{
                      maxWidth: isUser ? "80%" : "85%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                      background: isUser ? G.userBubble : G.coachBubble,
                      color: isUser ? G.userBubbleText : G.coachBubbleText,
                      fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap",
                    }}>
                    {mainContent}
                  </motion.div>
                </div>
              )}
              {logLine && (
                <div style={{ textAlign: "center", padding: "6px 0 10px" }}>
                  <span style={{ fontSize: 12, color: G.moss, fontWeight: 600 }}>{logLine}</span>
                </div>
              )}
            </div>
          );
        })}

        {chatLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
            <div style={{ padding: "12px 16px", borderRadius: "20px 20px 20px 6px", background: G.coachBubble, display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: 4, background: G.dim, animation: "thinkDot 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Suggestion Pills (shown when < 3 messages) ── */}
      {showSuggestions && hasApiKey() && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", paddingBottom: 8, flexShrink: 0 }}>
          {["Should I train today?", "What should I eat?", "How's my recovery?"].map((s, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }}
              onClick={() => doSend(s)}
              style={{
                background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 20,
                padding: "6px 14px", fontSize: 12, fontWeight: 500, color: G.sub,
                cursor: "pointer", fontFamily: "inherit",
              }}>
              {s}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Input Area (pinned at bottom) ── */}
      {chatHistory.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 4, flexShrink: 0 }}>
          <button onClick={() => { setChatHistory([]); setStorageData("vitals-chat", []); }}
            style={{ background: "none", border: "none", fontSize: 11, color: G.dim, cursor: "pointer", fontFamily: "inherit", padding: "2px 4px" }}>
            Clear chat
          </button>
        </div>
      )}

      <div style={{
        display: "flex", gap: 8, padding: "10px 0 2px",
        borderTop: `1px solid ${G.glassBorder}`, flexShrink: 0,
      }}>
        <input ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder="Ask your coach..."
          style={{
            flex: 1, background: G.inputBg, border: `1px solid ${G.glassBorder}`,
            borderRadius: 24, padding: "12px 18px", color: G.txt, fontSize: 14,
            outline: "none", fontFamily: "inherit",
          }} />
        <motion.button whileTap={{ scale: 0.9 }} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
          style={{
            background: `linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,
            border: "none", borderRadius: "50%", width: 46, height: 46, color: "#fff",
            fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, opacity: (chatLoading || !chatInput.trim()) ? 0.4 : 1,
            boxShadow: `0 4px 16px ${G.moss}30`,
          }}>↑</motion.button>
      </div>

      {err && <div style={{ color: G.red, fontSize: 12, paddingTop: 4, flexShrink: 0 }}>{err}</div>}

      {/* ── Analysis Modal (📊 button) ── */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Analysis & Memory">
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["gen", "📊 Analyze"], ["hist", "History"], ["mem", "Memory"]].map(([k, l]) =>
            <button key={k} onClick={() => setMoreTab(k)} style={{
              flex: 1, background: moreTab === k ? `${G.moss}20` : G.glass2,
              border: `1px solid ${moreTab === k ? G.moss + "40" : G.glassBorder}`,
              borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 600,
              color: moreTab === k ? G.moss : G.sub, cursor: "pointer", fontFamily: "inherit",
            }}>{l}</button>
          )}
        </div>

        {moreTab === "gen" && <div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Btn onClick={genAnalysis} disabled={genLoading} sx={{ padding: "12px 28px", fontSize: 14, borderRadius: 14 }}>
              {genLoading ? "Analyzing..." : "⬡ Full Analysis"}
            </Btn>
            {genErr && <div style={{ color: G.red, fontSize: 12, marginTop: 6 }}>{genErr}</div>}
          </div>
          {data.insights.length > 0 && <Glass style={{ borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: G.moss }}>⬡ Latest</span>
              <span style={{ fontSize: 11, color: G.dim }}>{data.insights[data.insights.length - 1].date}</span>
            </div>
            <div style={{ fontSize: 13, color: G.sub, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{data.insights[data.insights.length - 1].text}</div>
          </Glass>}
        </div>}

        {moreTab === "hist" && <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {data.insights.length === 0 ? <div style={{ textAlign: "center", padding: "20px 12px", color: G.dim }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13, color: G.sub }}>No analyses yet — run your first one above.</div>
          </div> : data.insights.slice().reverse().map(i => <Glass key={i.id} style={{ marginBottom: 8, borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: G.dim, marginBottom: 4 }}>{i.date}</div>
            <div style={{ fontSize: 13, color: G.sub, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{i.text}</div>
          </Glass>)}
        </div>}

        {moreTab === "mem" && <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {data.aiMemory.length === 0 ? <div style={{ textAlign: "center", padding: "20px 12px", color: G.dim }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 13, color: G.sub }}>No memory yet — run a full analysis to start building it.</div>
          </div> : data.aiMemory.slice().reverse().map(m => <Glass key={m.id} style={{ marginBottom: 6, borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: G.dim }}>{m.date}</div>
            <div style={{ fontSize: 13, color: G.sub, marginTop: 2, lineHeight: 1.5 }}>{m.summary}</div>
          </Glass>)}
        </div>}
      </Modal>
    </div>
  );
}
