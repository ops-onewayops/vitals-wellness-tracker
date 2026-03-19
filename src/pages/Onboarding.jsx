// src/pages/Onboarding.jsx — First-launch setup flow

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeContext.jsx";
import { GOAL_OPTS } from "../theme.js";
import { Btn } from "../components/Glass.jsx";

export default function Onboarding({ onComplete }) {
  const { theme: G } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [goals, setGoals] = useState(["Muscle Mass", "Strength"]);
  const [targets, setTargets] = useState({ calories: "2800", protein: "180", water: "100" });

  const toggleGoal = (g) => setGoals(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);

  const finish = () => onComplete({
    name: name.trim(),
    age: age.trim(),
    goals,
    targets: {
      calories: Number(targets.calories) || 2800,
      protein: Number(targets.protein) || 180,
      water: Number(targets.water) || 100,
    },
  });

  const inp = (extra = {}) => ({
    background: G.glass2, border: `1px solid ${G.glassBorder}`, borderRadius: 14,
    padding: "14px 16px", color: G.txt, fontSize: 16, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", width: "100%", ...extra,
  });

  const steps = [
    /* 0 — Welcome */
    <div key="welcome" style={{ textAlign: "center", paddingTop: 20 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        style={{ fontSize: 72, marginBottom: 28 }}>🧠</motion.div>
      <div style={{ fontSize: 30, fontWeight: 800, color: G.txt, marginBottom: 12, letterSpacing: -0.5 }}>Welcome to Vitals</div>
      <div style={{ fontSize: 15, color: G.sub, lineHeight: 1.7, marginBottom: 48, maxWidth: 320, margin: "0 auto 48px" }}>
        Your AI wellness coach — tracks nutrition, training, sleep, and recovery in one place.
      </div>
      <Btn onClick={() => setStep(1)} sx={{ width: "100%", padding: "16px 0", fontSize: 16, borderRadius: 18 }}>
        Get Started →
      </Btn>
    </div>,

    /* 1 — Name + Age */
    <div key="about">
      <div style={{ fontSize: 24, fontWeight: 800, color: G.txt, marginBottom: 6 }}>Tell me about yourself</div>
      <div style={{ fontSize: 14, color: G.dim, marginBottom: 28, lineHeight: 1.5 }}>So I can personalize everything for you.</div>
      <label style={{ display: "block", fontSize: 13, color: G.sub, marginBottom: 6, fontWeight: 600 }}>Your first name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex"
        autoFocus onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
        style={{ ...inp(), marginBottom: 16 }} />
      <label style={{ display: "block", fontSize: 13, color: G.sub, marginBottom: 6, fontWeight: 600 }}>Age</label>
      <input value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" type="number"
        style={{ ...inp(), marginBottom: 36 }} />
      <Btn onClick={() => setStep(2)} disabled={!name.trim()} sx={{ width: "100%", padding: "16px 0", fontSize: 15, borderRadius: 18 }}>
        Continue →
      </Btn>
    </div>,

    /* 2 — Goals */
    <div key="goals">
      <div style={{ fontSize: 24, fontWeight: 800, color: G.txt, marginBottom: 6 }}>What are you training for?</div>
      <div style={{ fontSize: 14, color: G.dim, marginBottom: 24, lineHeight: 1.5 }}>Pick everything that applies.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
        {GOAL_OPTS.map(g => {
          const active = goals.includes(g);
          return <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => toggleGoal(g)}
            style={{ background: active ? `${G.moss}20` : G.glass, border: `1px solid ${active ? G.moss + "50" : G.glassBorder}`, borderRadius: 20, padding: "10px 18px", color: active ? G.moss : G.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
            {active ? "✓ " : ""}{g}
          </motion.button>;
        })}
      </div>
      <Btn onClick={() => setStep(3)} disabled={goals.length === 0} sx={{ width: "100%", padding: "16px 0", fontSize: 15, borderRadius: 18 }}>
        Continue →
      </Btn>
    </div>,

    /* 3 — Targets */
    <div key="targets">
      <div style={{ fontSize: 24, fontWeight: 800, color: G.txt, marginBottom: 6 }}>Daily targets</div>
      <div style={{ fontSize: 14, color: G.dim, marginBottom: 24, lineHeight: 1.5 }}>We'll use these to track your progress. Change them anytime in Settings.</div>
      {[
        { label: "Calories", key: "calories", unit: "kcal", ph: "2800" },
        { label: "Protein", key: "protein", unit: "g", ph: "180" },
        { label: "Water", key: "water", unit: "oz", ph: "100" },
      ].map(f => <div key={f.key} style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, color: G.sub, marginBottom: 6, fontWeight: 600 }}>
          {f.label} <span style={{ color: G.dim, fontWeight: 400 }}>({f.unit})</span>
        </label>
        <input value={targets[f.key]} onChange={e => setTargets(t => ({ ...t, [f.key]: e.target.value }))}
          type="number" placeholder={f.ph} style={inp()} />
      </div>)}
      <div style={{ height: 28 }} />
      <Btn onClick={finish} sx={{ width: "100%", padding: "16px 0", fontSize: 15, borderRadius: 18 }}>
        Let's go →
      </Btn>
    </div>,
  ];

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: G.txt, maxWidth: 480, margin: "0 auto", padding: "56px 28px 40px", display: "flex", flexDirection: "column" }}>
      {/* Progress bar */}
      {step > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 40, justifyContent: "center" }}>
          {[1, 2, 3].map(i => (
            <motion.div key={i} animate={{ width: i <= step ? 28 : 8, background: i <= step ? G.moss : G.muted }}
              style={{ height: 8, borderRadius: 4 }} transition={{ duration: 0.3 }} />
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)}
          style={{ background: "none", border: "none", color: G.dim, fontSize: 13, cursor: "pointer", marginTop: 24, fontFamily: "inherit", padding: 0, alignSelf: "flex-start" }}>
          ← Back
        </button>
      )}
    </div>
  );
}
