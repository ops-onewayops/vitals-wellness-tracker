// src/briefing.js — Ambient briefing + smart action cards from intel (no API calls)

export function generateBriefing(intel, data) {
  const { recoveryScore, recoveryLabel, avgSleepHrs, workoutsThisWeek, todayCal, tgt } = intel;
  const hour = new Date().getHours();
  const name = data.profile?.name ? `, ${data.profile.name}` : "";

  if (recoveryScore == null) {
    return "Log your first workout, meal, and sleep to unlock your recovery picture.";
  }
  if (recoveryScore >= 80) {
    const sleepNote = avgSleepHrs != null ? ` ${avgSleepHrs.toFixed(1)}hrs sleep average is solid.` : "";
    const wkNote = workoutsThisWeek >= 3 ? ` ${workoutsThisWeek} workouts in — keep the momentum.` : "";
    return `You're in great shape today${name} — recovery at ${recoveryScore}.${sleepNote}${wkNote}`;
  }
  if (recoveryScore >= 60) {
    const timeNote = hour < 12 ? "a solid morning to build on" : "keep it steady today";
    const calNote = todayCal > 0 ? ` ${todayCal}/${tgt.calories}cal so far.` : "";
    return `Recovery is ${recoveryLabel} at ${recoveryScore} — ${timeNote}.${calNote}`;
  }
  if (recoveryScore >= 40) {
    return `Recovery is at ${recoveryScore}. Consider going lighter today — more fuel and rest will turn this around.`;
  }
  return `Recovery is low at ${recoveryScore}. A rest day or light active recovery is the smart call right now.`;
}

export function generateSmartActions(intel, data) {
  const actions = [];
  const { staleMuscles, avgProt, tgt, todayWater, workoutsThisWeek, recoveryScore } = intel;

  if (staleMuscles.length > 0) {
    actions.push({ text: `Build me a ${staleMuscles[0]} workout`, icon: "💪", color: "#ff9f43" });
  }
  if (avgProt != null && tgt.protein - avgProt > 30) {
    actions.push({ text: `How can I hit my ${tgt.protein}g protein target?`, icon: "🍗", color: "#2dd36f" });
  }
  if (todayWater < tgt.water * 0.5 && new Date().getHours() >= 12) {
    actions.push({ text: "How much water should I be drinking?", icon: "💧", color: "#22d3ee" });
  }
  if (recoveryScore != null && recoveryScore < 50) {
    actions.push({ text: "What should I do on a low recovery day?", icon: "🔋", color: "#fbbf24" });
  }
  if (workoutsThisWeek === 0) {
    actions.push({ text: "I haven't trained this week — make me a plan", icon: "🏋️", color: "#b48eff" });
  }
  if (actions.length < 3) actions.push({ text: "How's my recovery looking?", icon: "📊", color: "#4dc9f6" });
  if (actions.length < 4) actions.push({ text: "What should I eat for dinner?", icon: "🍽️", color: "#2dd36f" });
  if (actions.length < 5) actions.push({ text: "Should I train today?", icon: "⚡", color: "#ff9f43" });

  return actions.slice(0, 5);
}
