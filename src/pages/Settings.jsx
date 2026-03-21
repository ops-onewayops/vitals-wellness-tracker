// src/pages/Settings.jsx — v10.4: Page-based navigation, SVG icons, no accordions

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";
import { DEF, GOAL_OPTS } from "../theme.js";
import { td, uid, sv } from "../helpers.js";
import { Glass, Fld, Btn, Slider, EI } from "../components/Glass.jsx";
import { getApiKey, setApiKey } from "../api.js";
import {
  IconUser, IconTarget, IconKey, IconPill, IconAlertCircle,
  IconTrophy, IconMessage, IconDatabase, IconSun, IconMoon,
  IconSave, IconDownload, IconUpload, IconTrash, IconCheck,
  IconChevronRight, IconChevronLeft, IconX,
} from "../components/Icons.jsx";

// ── Page slide variants ──────────────────────────────────────────────────────
const pageVariants = {
  enterRight:  { x: "45%", opacity: 0 },
  enterLeft:   { x: "-20%", opacity: 0 },
  center:      { x: 0, opacity: 1 },
  exitLeft:    { x: "-20%", opacity: 0 },
  exitRight:   { x: "45%", opacity: 0 },
};
const pageTrans = { duration: 0.24, ease: [0.32, 0.72, 0, 1] };

// ── Reusable sub-page wrapper ────────────────────────────────────────────────
function SubPage({ title, onBack, children }) {
  const { theme: G } = useTheme();
  return (
    <motion.div
      key="subpage"
      initial="enterRight" animate="center" exit="exitRight"
      variants={pageVariants} transition={pageTrans}
    >
      {/* Back header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 20, paddingTop: 4,
      }}>
        <button onClick={onBack} style={{
          background: G.glass, border: `1px solid ${G.glassBorder}`,
          borderRadius: 12, width: 36, height: 36, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <IconChevronLeft size={16} color={G.txt} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: G.txt }}>{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

// ── Main list row ────────────────────────────────────────────────────────────
function SettingsRow({ Icon: RowIcon, label, sub, onPress, color, last }) {
  const { theme: G } = useTheme();
  return (
    <button onClick={onPress} style={{
      width: "100%", background: G.glass, backdropFilter: G.blur,
      border: "none",
      borderBottom: last ? "none" : `1px solid ${G.glassBorder}`,
      padding: "14px 16px", cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: 14,
      textAlign: "left",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${color || G.moss}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <RowIcon size={16} color={color || G.moss} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.txt }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: G.dim, marginTop: 1 }}>{sub}</div>}
      </div>
      <IconChevronRight size={14} color={G.dim} />
    </button>
  );
}

// ── Settings rows group card ─────────────────────────────────────────────────
function RowGroup({ children }) {
  const { theme: G } = useTheme();
  return (
    <div style={{
      background: G.glass, backdropFilter: G.blur,
      border: `1px solid ${G.glassBorder}`,
      borderRadius: 16, overflow: "hidden", marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

export default function Settings({ data, setData }) {
  const { theme: G, mode, setMode } = useTheme();
  const [page, setPage] = useState(null);
  const [direction, setDirection] = useState(1);

  const [key, setKey] = useState(getApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const impRef = useRef();
  const [pf, setPf] = useState({ ...data.profile });
  const [fbF, setFbF] = useState({ type: "Bug", message: "", name: "", rating: "5" });
  const [fbSent, setFbSent] = useState(false);
  const [fbSending, setFbSending] = useState(false);

  useEffect(() => { setPf({ ...data.profile }); }, [data.profile]);

  const navigate = (dest) => { setDirection(1); setPage(dest); };
  const goBack   = () => { setDirection(-1); setPage(null); };

  const saveKey     = () => { setApiKey(key); setKeySaved(true); setTimeout(() => setKeySaved(false), 2000); };
  const saveProfile = () => { const nd = { ...data, profile: { ...pf, targets: { calories: Number(pf.targets?.calories) || 2800, protein: Number(pf.targets?.protein) || 180, water: Number(pf.targets?.water) || 100 } } }; setData(nd); sv(nd); };
  const exp = () => { const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `vitals-${td()}.json`; a.click(); };
  const imp = async (file) => { try { const t = await file.text(); const d = JSON.parse(t); const nd = { ...DEF, ...d, profile: { ...DEF.profile, ...d?.profile, targets: { ...DEF.profile.targets, ...d?.profile?.targets } } }; setData(nd); sv(nd); alert("Imported!"); } catch (e) { alert("Error: " + e.message); } };
  const sendFb = async () => {
    if (!fbF.message.trim()) return; setFbSending(true);
    const entry = { ...fbF, id: uid(), date: td(), time: new Date().toTimeString().slice(0, 5), device: navigator.userAgent.slice(0, 80) };
    const nd = { ...data, feedback: [...(data.feedback || []), entry] }; setData(nd); sv(nd);
    setFbSent(true); setFbSending(false); setFbF({ type: "Bug", message: "", name: "", rating: "5" }); setTimeout(() => setFbSent(false), 3000);
  };
  const deleteStack = (id) => { const nd = { ...data, suppStacks: (data.suppStacks || []).filter(s => s.id !== id) }; setData(nd); sv(nd); };
  const resPain  = (id) => { const nd = { ...data, painLog: data.painLog.map(p => p.id === id ? { ...p, resolved: true, resolvedDate: td() } : p) }; setData(nd); sv(nd); };
  const delPain  = (id) => { const nd = { ...data, painLog: data.painLog.filter(p => p.id !== id) }; setData(nd); sv(nd); };
  const delPR    = (id) => { const nd = { ...data, prs: data.prs.filter(p => p.id !== id) }; setData(nd); sv(nd); };

  const p = data.profile;

  // ── Shared enter/exit for main list ────────────────────────────────────────
  const mainVariants = {
    enter:  { x: direction < 0 ? "30%" : "-10%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit:   { x: direction > 0 ? "-10%" : "30%", opacity: 0 },
  };

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <AnimatePresence mode="wait" initial={false} custom={direction}>

        {/* ══════════════════════════════════════════
            MAIN SETTINGS LIST
        ═══════════════════════════════════════════ */}
        {page === null && (
          <motion.div
            key="main"
            initial="enter" animate="center" exit="exit"
            variants={mainVariants} transition={pageTrans}
          >
            {/* Appearance */}
            <Glass style={{ marginBottom: 16, padding: 16, borderRadius: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <IconSun size={15} color={G.sub} />
                <span style={{ fontSize: 13, fontWeight: 700, color: G.sub }}>Appearance</span>
              </div>
              <div style={{ display: "flex", background: G.glass2, borderRadius: 12, padding: 3, gap: 2 }}>
                {[["light", IconSun, "Light"], ["auto", null, "Auto"], ["dark", IconMoon, "Dark"]].map(([m, MIcon, l]) => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex: 1, padding: "8px 6px", border: "none", borderRadius: 10,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    background: mode === m ? `linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})` : "transparent",
                    color: mode === m ? "#fff" : G.dim, transition: "all .2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                    {MIcon && <MIcon size={12} color={mode === m ? "#fff" : G.dim} />}
                    {l}
                  </button>
                ))}
              </div>
            </Glass>

            {/* Account group */}
            <div style={{ fontSize: 11, fontWeight: 700, color: G.dim, letterSpacing: 1.2, marginBottom: 6, paddingLeft: 4 }}>ACCOUNT</div>
            <RowGroup>
              <SettingsRow Icon={IconUser} label="Profile & Goals" sub={p.name || "Not set up"} color={G.moss} onPress={() => navigate("profile")} />
              <SettingsRow Icon={IconTarget} label="Daily Targets" sub={`${p.targets?.calories || 2800} cal · ${p.targets?.protein || 180}g protein`} color={G.orange} onPress={() => navigate("targets")} />
              <SettingsRow Icon={IconKey} label="API Key" sub={getApiKey() ? "Key saved" : "Required for AI"} color={G.purple} onPress={() => navigate("apikey")} last />
            </RowGroup>

            {/* Health group */}
            <div style={{ fontSize: 11, fontWeight: 700, color: G.dim, letterSpacing: 1.2, marginBottom: 6, paddingLeft: 4 }}>HEALTH DATA</div>
            <RowGroup>
              <SettingsRow Icon={IconPill} label="Supplement Stacks" sub={`${(data.suppStacks || []).length} saved`} color={G.purple} onPress={() => navigate("stacks")} />
              <SettingsRow Icon={IconAlertCircle} label="Pain Log" sub={`${data.painLog.filter(p => !p.resolved).length} active`} color={G.red} onPress={() => navigate("pain")} />
              <SettingsRow Icon={IconTrophy} label="Personal Records" sub={`${data.prs.length} PRs`} color={G.amber} onPress={() => navigate("prs")} last />
            </RowGroup>

            {/* App group */}
            <div style={{ fontSize: 11, fontWeight: 700, color: G.dim, letterSpacing: 1.2, marginBottom: 6, paddingLeft: 4 }}>APP</div>
            <RowGroup>
              <SettingsRow Icon={IconMessage} label="Feedback" sub="Bugs, requests, ideas" color={G.teal} onPress={() => navigate("feedback")} />
              <SettingsRow Icon={IconDatabase} label="Data & Storage" sub="Export, import, clear" color={G.blue} onPress={() => navigate("data")} last />
            </RowGroup>

            <div style={{ fontSize: 11, color: G.dim, textAlign: "center", marginTop: 8, lineHeight: 1.7 }}>
              Vitals v10.4 · On-device storage · Claude AI
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            PROFILE & GOALS
        ═══════════════════════════════════════════ */}
        {page === "profile" && (
          <SubPage title="Profile & Goals" onBack={goBack}>
            {p.name && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                {[["Name", p.name], ["Age", p.age || "—"], ["Units", p.units || "imperial"], ["Restrictions", p.allergies || "None"]].map(([l, v]) => (
                  <div key={l} style={{ background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 14, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: G.dim, fontWeight: 700, letterSpacing: 0.8, marginBottom: 3 }}>{l.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.txt }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {p.goals?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
                {p.goals.map((g, i) => <span key={i} style={{ background: `${G.moss}15`, color: G.moss, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{g}</span>)}
              </div>
            )}
            <Fld label="Name" value={pf.name || ""} set={v => setPf({ ...pf, name: v })} ph="Your name" />
            <Fld label="Age" type="number" value={pf.age || ""} set={v => setPf({ ...pf, age: v })} />
            <Fld label="Allergies / Dietary Restrictions" value={pf.allergies || ""} set={v => setPf({ ...pf, allergies: v })} ph="e.g. Dairy, Gluten, Vegan" />
            <Fld label="Units" opts={["imperial", "metric"]} value={pf.units || "imperial"} set={v => setPf({ ...pf, units: v })} />
            <div style={{ fontSize: 13, fontWeight: 600, color: G.sub, marginBottom: 10 }}>Goals</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {GOAL_OPTS.map(g => {
                const isActive = (pf.goals || []).includes(g);
                return (
                  <button key={g} onClick={() => { const goals = isActive ? (pf.goals || []).filter(x => x !== g) : [...(pf.goals || []), g]; setPf({ ...pf, goals }); }} style={{
                    background: isActive ? `${G.moss}20` : G.glass, border: `1px solid ${isActive ? G.moss + "40" : G.glassBorder}`,
                    borderRadius: 20, padding: "6px 14px", color: isActive ? G.moss : G.dim,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {isActive && <IconCheck size={11} color={G.moss} />}{g}
                  </button>
                );
              })}
            </div>
            <Btn onClick={saveProfile} sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <IconSave size={14} color="currentColor" />Save Profile
            </Btn>
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            DAILY TARGETS
        ═══════════════════════════════════════════ */}
        {page === "targets" && (
          <SubPage title="Daily Targets" onBack={goBack}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{ l: "Calories", v: p.targets?.calories || 2800, c: G.moss }, { l: "Protein", v: (p.targets?.protein || 180) + "g", c: G.orange }, { l: "Water", v: (p.targets?.water || 100) + "oz", c: G.teal }].map((t, i) => (
                <div key={i} style={{ textAlign: "center", background: G.glass, border: `1px solid ${G.glassBorder}`, borderRadius: 14, padding: "14px 6px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: t.c }}>{t.v}</div>
                  <div style={{ fontSize: 10, color: G.dim, fontWeight: 700, marginTop: 3 }}>{t.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><Fld label="Calories" type="number" value={pf.targets?.calories || ""} set={v => setPf({ ...pf, targets: { ...pf.targets, calories: v } })} /></div>
              <div style={{ flex: 1 }}><Fld label="Protein (g)" type="number" value={pf.targets?.protein || ""} set={v => setPf({ ...pf, targets: { ...pf.targets, protein: v } })} /></div>
            </div>
            <Fld label="Water (oz)" type="number" value={pf.targets?.water || ""} set={v => setPf({ ...pf, targets: { ...pf.targets, water: v } })} />
            <Btn onClick={saveProfile} sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <IconSave size={14} color="currentColor" />Save Targets
            </Btn>
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            API KEY
        ═══════════════════════════════════════════ */}
        {page === "apikey" && (
          <SubPage title="API Key" onBack={goBack}>
            <Glass style={{ marginBottom: 16, borderRadius: 16, padding: 16, borderLeft: `3px solid ${G.purple}` }}>
              <div style={{ fontSize: 13, color: G.sub, lineHeight: 1.65 }}>
                Required for all AI features — coaching, macro analysis, workout generation, and health imports. Your key is stored on this device only and never sent anywhere except directly to Anthropic.
              </div>
            </Glass>
            <Fld type="password" value={key} set={setKey} ph="sk-ant-..." />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Btn onClick={saveKey} sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <IconSave size={14} color="currentColor" />Save Key
              </Btn>
              {keySaved && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: G.moss, fontSize: 13, fontWeight: 600 }}>
                  <IconCheck size={14} color={G.moss} />Saved
                </div>
              )}
            </div>
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            SUPPLEMENT STACKS
        ═══════════════════════════════════════════ */}
        {page === "stacks" && (
          <SubPage title="Supplement Stacks" onBack={goBack}>
            {(data.suppStacks || []).length === 0
              ? <div style={{ color: G.dim, fontSize: 13, lineHeight: 1.7, textAlign: "center", paddingTop: 24 }}>
                  No stacks saved yet. Log supplements in the Log tab and save them as a stack from there.
                </div>
              : (data.suppStacks || []).map(stack => (
                <Glass key={stack.id} style={{ marginBottom: 10, borderRadius: 16, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: G.purple }}>{stack.name}</span>
                    <button onClick={() => deleteStack(stack.id)} style={{
                      background: `${G.red}15`, border: `1px solid ${G.red}20`, borderRadius: 8,
                      width: 30, height: 30, color: G.red, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <IconTrash size={13} color={G.red} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {stack.items.map((item, i) => (
                      <span key={i} style={{ background: `${G.purple}12`, color: G.sub, borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>
                        {item.name}{item.dosage ? ` · ${item.dosage}` : ""}
                      </span>
                    ))}
                  </div>
                </Glass>
              ))}
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            PAIN LOG
        ═══════════════════════════════════════════ */}
        {page === "pain" && (
          <SubPage title="Pain Log" onBack={goBack}>
            {data.painLog.length === 0
              ? <div style={{ color: G.dim, fontSize: 13, textAlign: "center", paddingTop: 24 }}>No pain entries.</div>
              : <>
                {data.painLog.filter(p => !p.resolved).length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: G.red, letterSpacing: 1, marginBottom: 10 }}>ACTIVE</div>
                    {data.painLog.filter(p => !p.resolved).map(p => (
                      <Glass key={p.id} style={{ marginBottom: 8, padding: "12px 16px", borderRadius: 16, borderLeft: `3px solid ${G.red}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: G.red, fontWeight: 700 }}>{p.location}</div>
                            <div style={{ fontSize: 12, color: G.dim, marginTop: 2 }}>{p.type} · Severity {p.severity}/10 · {p.date}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn onClick={() => resPain(p.id)} v="ghost" sx={{ fontSize: 11, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, color: G.moss }}>
                              <IconCheck size={11} color={G.moss} />Resolve
                            </Btn>
                            <button onClick={() => delPain(p.id)} style={{
                              background: `${G.red}12`, border: `1px solid ${G.red}20`, borderRadius: 8,
                              width: 30, height: 30, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <IconTrash size={13} color={G.red} />
                            </button>
                          </div>
                        </div>
                      </Glass>
                    ))}
                  </div>
                )}
                {data.painLog.filter(p => p.resolved).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: G.dim, letterSpacing: 1, marginBottom: 10 }}>RESOLVED</div>
                    {data.painLog.filter(p => p.resolved).slice().reverse().slice(0, 8).map(p => (
                      <EI key={p.id} primary={`${p.location} — ${p.type}`} secondary={`${p.date} · Sev:${p.severity}/10`} color={G.moss} onDelete={() => delPain(p.id)} />
                    ))}
                  </div>
                )}
              </>}
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            PERSONAL RECORDS
        ═══════════════════════════════════════════ */}
        {page === "prs" && (
          <SubPage title="Personal Records" onBack={goBack}>
            {data.prs.length === 0
              ? <div style={{ color: G.dim, fontSize: 13, lineHeight: 1.7, textAlign: "center", paddingTop: 24 }}>
                  No PRs yet. Log exercises with sets, reps, and weight — PRs are detected automatically.
                </div>
              : data.prs.slice().reverse().map(p => (
                <EI key={p.id} primary={`${p.exercise} ${p.repMax}`} secondary={p.date} tertiary={`${p.weight}lbs`} color={G.amber} onDelete={() => delPR(p.id)} />
              ))}
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            FEEDBACK
        ═══════════════════════════════════════════ */}
        {page === "feedback" && (
          <SubPage title="Feedback" onBack={goBack}>
            <Fld label="Your Name (optional)" value={fbF.name} set={v => setFbF({ ...fbF, name: v })} ph="Anonymous" />
            <Fld label="Type" opts={["Bug", "Feature Request", "UI/Design", "Performance", "Other"]} value={fbF.type} set={v => setFbF({ ...fbF, type: v })} />
            <Slider label="Overall Rating" value={fbF.rating} set={v => setFbF({ ...fbF, rating: v })} min={1} max={10} color={Number(fbF.rating) >= 7 ? G.moss : Number(fbF.rating) >= 4 ? G.orange : G.red} />
            <Fld label="Message" type="textarea" value={fbF.message} set={v => setFbF({ ...fbF, message: v })} ph="What happened? What would you like to see?" />
            <Btn onClick={sendFb} disabled={fbSending || !fbF.message.trim()} sx={{ width: "100%", padding: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {fbSent ? <><IconCheck size={14} color="currentColor" />Sent — thank you</> : fbSending ? "Sending…" : "Send Feedback"}
            </Btn>
          </SubPage>
        )}

        {/* ══════════════════════════════════════════
            DATA & STORAGE
        ═══════════════════════════════════════════ */}
        {page === "data" && (
          <SubPage title="Data & Storage" onBack={goBack}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <Btn onClick={exp} v="secondary" sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <IconUpload size={14} color="currentColor" />Export
              </Btn>
              <Btn onClick={() => impRef.current?.click()} v="secondary" sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <IconDownload size={14} color="currentColor" />Import
              </Btn>
              <input ref={impRef} type="file" accept=".json" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) imp(e.target.files[0]); }} />
            </div>
            <Glass style={{ marginBottom: 16, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, color: G.dim, lineHeight: 1.7 }}>
                All data is stored on this device only — nothing is sent to external servers. Export regularly as a backup.
              </div>
            </Glass>
            <div style={{ height: 1, background: G.glassBorder, marginBottom: 16 }} />
            <Btn onClick={() => { if (confirm("Delete ALL data? This cannot be undone.")) { setData(DEF); sv(DEF); } }} v="danger" sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <IconTrash size={14} color="currentColor" />Clear All Data
            </Btn>
            <div style={{ marginTop: 18, fontSize: 11, color: G.dim, textAlign: "center", lineHeight: 1.7 }}>
              Vitals v10.4 · Coach-First · IndexedDB · Claude AI
            </div>
          </SubPage>
        )}

      </AnimatePresence>
    </div>
  );
}
