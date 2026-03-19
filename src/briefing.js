// src/briefing.js — Ambient briefing + smart action cards (v10.1 spec)

import { td } from "./helpers.js";

export function generateBriefing(intel, data) {
  const hr = new Date().getHours();
  const name = data.profile?.name?.split(" ")[0] || "";
  const parts = [];

  // Opener
  const greet = hr < 12 ? "Morning" : hr < 18 ? "Afternoon" : "Evening";
  parts.push(greet + (name ? ` ${name}` : "") + ".");

  // Most relevant observation (pick ONE, priority order)
  // 1. Sleep (morning only)
  if (hr < 12) {
    const last = data.sleep.length ? data.sleep[data.sleep.length - 1] : null;
    if (last?.hours) {
      parts.push(
        Number(last.hours) >= 7
          ? `${last.hours} hours last night — you're good to go.`
          : `Only ${last.hours} hours — take it easy if you need to.`
      );
    }
  }

  // 2. Nutrition gap
  if (parts.length <= 1 && hr >= 11 && intel.todayCal === 0) {
    parts.push("No food logged yet — let me know what you've had.");
  } else if (parts.length <= 1 && hr >= 14 && intel.todayProt < intel.tgt.protein * 0.4) {
    parts.push(`Protein's at ${intel.todayProt}g of ${intel.tgt.protein}g — worth front-loading.`);
  }

  // 3. Training opportunity
  if (parts.length <= 1 && intel.staleMuscles.length > 0 && (!intel.recoveryScore || intel.recoveryScore > 55)) {
    parts.push(`${intel.staleMuscles.slice(0, 2).join(" & ")} could use some work.`);
  } else if (parts.length <= 1 && intel.recoveryScore && intel.recoveryScore < 50) {
    parts.push("Recovery's low — might be a rest day.");
  }

  // 4. Hydration
  if (parts.length <= 1 && hr >= 13 && intel.todayWater < intel.tgt.water * 0.35) {
    parts.push(`${intel.todayWater}oz water so far — drink up.`);
  }

  // Fallback
  if (parts.length <= 1) parts.push("You're on track. What's on your mind?");

  return parts.slice(0, 3).join(" ");
}

export function generateSmartActions(intel, data) {
  const hr = new Date().getHours();
  const today = td();
  const actions = [];

  // 1. No food logged + after 10am
  if (intel.todayCal === 0 && hr >= 10) {
    actions.push({ icon: "🍽️", title: "Log a meal", sub: "Nothing logged yet", msg: "I just had ", color: intel.moss || "#2dd36f" });
  }

  // 2. Stale muscles + recovery > 55
  if (intel.staleMuscles.length > 0 && (!intel.recoveryScore || intel.recoveryScore > 55)) {
    const m = intel.staleMuscles[0];
    const d = intel.muscleFreshness?.[m]?.days || "?";
    actions.push({ icon: "💪", title: `Train ${m}`, sub: `${d} days since last`, msg: `Build me a ${m} workout`, color: "#ff9f43" });
  }

  // 3. Low water + after noon
  if (intel.todayWater < intel.tgt.water * 0.5 && hr >= 12) {
    actions.push({ icon: "💧", title: "Hydrate", sub: `${intel.todayWater}oz of ${intel.tgt.water}oz`, msg: "Log 16oz of water", color: "#22d3ee" });
  }

  // 4. Low protein + after 2pm
  if (intel.todayProt < intel.tgt.protein * 0.4 && hr >= 14 && intel.todayCal > 0) {
    actions.push({ icon: "🥩", title: "Hit protein", sub: `${intel.todayProt}g of ${intel.tgt.protein}g`, msg: "What should I eat to hit my protein target?", color: "#ff9f43" });
  }

  // 5. Low recovery
  if (intel.recoveryScore != null && intel.recoveryScore < 50) {
    actions.push({ icon: "🧘", title: "Rest day", sub: `Recovery at ${intel.recoveryScore}`, msg: "What should I do on a low recovery day?", color: "#fbbf24" });
  }

  // 6. Supplements not logged + stacks exist + after 8am
  const todaySupps = data.supplements.filter(s => s.date === today);
  if (todaySupps.length === 0 && (data.suppStacks || []).length > 0 && hr >= 8) {
    actions.push({ icon: "💊", title: "Supplements", sub: "Not logged today", msg: "Log my morning stack", color: "#b48eff" });
  }

  // 7. Active pain
  const activePains = data.painLog.filter(p => !p.resolved);
  if (activePains.length > 0) {
    const loc = activePains[0].location;
    actions.push({ icon: "⚠️", title: `${loc} pain`, sub: "Still active", msg: `How should I work around my ${loc} pain?`, color: "#ff4d6a" });
  }

  // 8. After 8pm + enough data for day review
  if (hr >= 20 && intel.todayCal > 0) {
    actions.push({ icon: "📊", title: "Day review", sub: "How'd today go?", msg: "Give me a quick review of my day", color: "#4dc9f6" });
  }

  // Fallback if nothing relevant
  if (actions.length === 0) {
    actions.push({ icon: "💬", title: "Check in", sub: "Ask me anything", msg: "", color: "#a0a0b8" });
  }

  return actions.slice(0, 4);
}

export function generateStatLine(intel) {
  const parts = [];
  if (intel.todayCal > 0) parts.push(`${intel.todayCal} cal`);
  if (intel.todayProt > 0) parts.push(`${intel.todayProt}g protein`);
  if (intel.todayWater > 0) parts.push(`${intel.todayWater}oz water`);
  if (intel.workoutsThisWeek > 0) parts.push(`${intel.workoutsThisWeek} workout${intel.workoutsThisWeek > 1 ? "s" : ""} this week`);
  return parts.join(" · ") || "Start logging to see your stats here";
}
