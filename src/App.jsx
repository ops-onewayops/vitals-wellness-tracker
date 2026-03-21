// src/App.jsx — Shell: data loading, routing, nav, toast (v10.2)

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider, useTheme } from "./ThemeContext.jsx";
import { DEF } from "./theme.js";
import { ld, sv, td, uid, haptic, deleteEntry } from "./helpers.js";
import { T, SPECTRUM } from "./themes.js";
import Data from "./pages/Data.jsx";
import Log from "./pages/Log.jsx";
import Coach from "./pages/Coach.jsx";
import Settings from "./pages/Settings.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Toast from "./components/Toast.jsx";

function AppInner() {
  const { theme: G } = useTheme();
  const [data, setData] = useState(DEF);
  const [page, setPage] = useState("coach"); // Coach is HOME
  const [initialForm, setInitialForm] = useState(null);
  const [ok, setOk] = useState(false);
  const [toast, setToast] = useState(null);

  // Easter egg: tap "Vitals" wordmark 5× to trigger prism animation
  const wordmarkTaps = useRef(0);
  const wordmarkTimer = useRef(null);
  const [wordmarkPrism, setWordmarkPrism] = useState(false);

  const handleWordmarkTap = () => {
    wordmarkTaps.current += 1;
    clearTimeout(wordmarkTimer.current);
    if (wordmarkTaps.current >= 5) {
      wordmarkTaps.current = 0;
      setWordmarkPrism(true);
      haptic(100);
      setTimeout(() => setWordmarkPrism(false), 3000);
    } else {
      wordmarkTimer.current = setTimeout(() => { wordmarkTaps.current = 0; }, 1200);
    }
  };

  useEffect(() => {
    (async () => {
      const s = await ld();
      if (s) setData({
        ...DEF, ...s,
        profile: { ...DEF.profile, ...s?.profile, targets: { ...DEF.profile.targets, ...s?.profile?.targets } },
        prs: s?.prs || [], painLog: s?.painLog || [], postWorkout: s?.postWorkout || [], aiMemory: s?.aiMemory || [],
        hydration: s?.hydration || [], supplements: s?.supplements || [], healthImports: s?.healthImports || [],
        heartRate: s?.heartRate || [], ecg: s?.ecg || [], bloodOx: s?.bloodOx || [], respiratory: s?.respiratory || [],
        stepsData: s?.stepsData || [], watchWorkouts: s?.watchWorkouts || [], suppStacks: s?.suppStacks || [], feedback: s?.feedback || [],
      });
      setOk(true);
    })();
  }, []);

  // Load Inter font
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    l.rel = "stylesheet"; document.head.appendChild(l);
  }, []);

  // Set meta theme-color
  useEffect(() => {
    document.body.style.background = G.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = G.bg;
  }, [G.bg]);

  const quickLog = (type) => {
    if (type === "water") {
      const nd = { ...data, hydration: [...data.hydration, { oz: "16", type: "Water", date: td(), time: new Date().toTimeString().slice(0, 5), id: uid() }] };
      setData(nd); sv(nd); setToast({ message: "💧 +16oz logged", color: G.teal }); haptic();
    }
  };

  const go = (p, form) => {
    if (p === "log" && form) { setInitialForm(form); setPage("log"); }
    else { setInitialForm(null); setPage(p); }
    haptic(30);
  };

  const deleteItem = (arrayKey, entryId) => {
    const nd = deleteEntry(data, arrayKey, entryId);
    setData(nd); sv(nd); haptic(30);
    setToast({ message: "Removed", color: G.dim });
  };

  // Skeleton loading
  if (!ok) return (
    <div style={{ background: G.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ position: "relative" }}>
        <div style={{ ...T.heading, color: G.moss, letterSpacing: 1, cursor: "default" }}>Vitals</div>
        {/* Prism line under wordmark on load */}
        <div style={{ height: 2, borderRadius: 1, background: SPECTRUM, marginTop: 4, opacity: 0.5 }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => <motion.div key={i}
          style={{ width: 6, height: 6, borderRadius: 3, background: G.moss }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />)}
      </div>
    </div>
  );

  const tabTitle = { coach: "Vitals", data: "Data", log: "Log", settings: "Settings" };
  const isCoach = page === "coach";

  const renderPage = () => {
    if (page === "coach") return <Coach data={data} setData={setData} go={go} />;
    if (page === "data") return <Data data={data} go={go} onQuickLog={quickLog} onDelete={deleteItem} />;
    if (page === "log") return <Log data={data} setData={setData} initialForm={initialForm} onDelete={deleteItem} />;
    if (page === "settings") return <Settings data={data} setData={setData} />;
    return <Coach data={data} setData={setData} go={go} />;
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Inter',sans-serif", color: G.txt, maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80 }}>

      {/* Wordmark prism easter egg overlay */}
      <AnimatePresence>
        {wordmarkPrism && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.95)",
            }}>
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ fontSize: 88, lineHeight: 1, marginBottom: 24, filter: "drop-shadow(0 0 48px rgba(180,142,255,0.7))" }}>◭</motion.div>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              style={{
                width: "70%", maxWidth: 260, height: 5, borderRadius: 3,
                background: SPECTRUM,
                boxShadow: "0 0 28px rgba(180,142,255,0.55), 0 0 52px rgba(45,211,111,0.25)",
                transformOrigin: "left center",
              }} />
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              style={{ marginTop: 28, ...T.nano, color: "rgba(255,255,255,0.4)", letterSpacing: 3 }}>
              VITALS
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header — hidden on Coach page */}
      {!isCoach && (
        <div style={{
          padding: "calc(env(safe-area-inset-top) + 14px) 20px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          background: `${G.bg}e8`,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${G.glassBorder}`,
        }}>
          {/* Wordmark — tap 5x for easter egg */}
          <div onClick={handleWordmarkTap} style={{ cursor: "default", userSelect: "none" }}>
            <div style={{ ...T.subhead, color: G.txt, letterSpacing: 0.5 }}>{tabTitle[page] || "Vitals"}</div>
          </div>
          {page === "data" && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => go("log")} style={{
              background: `linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`, color: "#fff",
              border: "none", borderRadius: 20, padding: "6px 18px",
              ...T.nano, letterSpacing: 0.5,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 4px 16px ${G.moss}30`,
            }}>+ LOG</motion.button>
          )}
        </div>
      )}

      <div style={{ padding: isCoach ? "0 20px 0" : "12px 20px 40px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav current={page} onNav={p => { setInitialForm(null); setPage(p); haptic(30); }} />

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} color={toast.color} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <ThemeProvider><AppInner /></ThemeProvider>;
}
