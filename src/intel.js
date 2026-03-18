// src/intel.js — Cross-domain intelligence engine

import { G } from "./theme.js";
import { td, hr } from "./helpers.js";

export function useVitalsIntel(data){
  const p=data.profile;const tgt=p.targets||{calories:2800,protein:180,water:100};
  const today=td();

  // ── Sleep signals ──
  const recentSleep=data.sleep.slice(-7);
  const avgSleepHrs=recentSleep.length?(recentSleep.reduce((s,e)=>s+Number(e.hours||0),0)/recentSleep.length):null;
  const lastSleep=data.sleep.length?data.sleep[data.sleep.length-1]:null;
  const sleepDebt=avgSleepHrs!=null?Math.max(0,7-avgSleepHrs)*recentSleep.length:0;
  const sleepTrend=recentSleep.length>=3?(Number(recentSleep[recentSleep.length-1]?.hours||0)-Number(recentSleep[0]?.hours||0)):0;
  const sleepScore=avgSleepHrs!=null?Math.min(100,Math.round((avgSleepHrs/8)*100)):null;

  // ── Training signals ──
  const last14=data.training.filter(t=>{const d=new Date(t.date);const w=new Date();w.setDate(w.getDate()-14);return d>=w;});
  const last7=data.training.filter(t=>{const d=new Date(t.date);const w=new Date();w.setDate(w.getDate()-7);return d>=w;});
  const workoutsThisWeek=last7.length;
  // Muscle group freshness (days since last hit)
  const muscleMap={
    "Chest":["bench","chest","push up","pushup","fly","pec","dumbbell press","incline press","decline press"],
    "Back":["row","pull","lat","deadlift","pullup","chin up","back"],
    "Shoulders":["shoulder","ohp","press","lateral raise","front raise","delt","military"],
    "Legs":["squat","leg","lunge","calf","hamstring","quad","glute","hip thrust","rdl","bulgarian"],
    "Arms":["curl","bicep","tricep","extension","skull crush","hammer","arm"],
    "Core":["ab","plank","crunch","core","sit up","oblique"]
  };
  const muscleFreshness={};
  Object.keys(muscleMap).forEach(group=>{
    const keywords=muscleMap[group];
    const hits=data.training.filter(t=>keywords.some(k=>t.name?.toLowerCase().includes(k))).sort((a,b)=>b.date.localeCompare(a.date));
    const lastHit=hits.length?hits[0].date:null;
    const days=lastHit?Math.floor((new Date()-new Date(lastHit+"T12:00"))/86400000):999;
    muscleFreshness[group]={days,lastDate:lastHit,fresh:days>=2,stale:days>=5};
  });
  const staleMuscles=Object.entries(muscleFreshness).filter(([_,v])=>v.stale&&v.days<999).map(([k])=>k);
  const freshMuscles=Object.entries(muscleFreshness).filter(([_,v])=>!v.fresh&&v.days<999).map(([k])=>k);

  // RPE trend
  const recentPW=data.postWorkout.slice(-7);
  const avgRPE=recentPW.length?(recentPW.reduce((s,p)=>s+Number(p.rpe||5),0)/recentPW.length):null;
  const highRPE=avgRPE!=null&&avgRPE>=8;

  // ── Nutrition signals ──
  const todayNutr=data.nutrition.filter(n=>n.date===today);
  const todayCal=todayNutr.reduce((s,n)=>s+(Number(n.calories)||0),0);
  const todayProt=todayNutr.reduce((s,n)=>s+(Number(n.protein)||0),0);
  const last7Nutr=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const dn=data.nutrition.filter(n=>n.date===ds);return{cal:dn.reduce((s,n)=>s+(Number(n.calories)||0),0),prot:dn.reduce((s,n)=>s+(Number(n.protein)||0),0)};}).filter(d=>d.cal>0);
  const avgCal=last7Nutr.length?(last7Nutr.reduce((s,d)=>s+d.cal,0)/last7Nutr.length):null;
  const avgProt=last7Nutr.length?(last7Nutr.reduce((s,d)=>s+d.prot,0)/last7Nutr.length):null;
  const calDeficit=avgCal!=null?tgt.calories-avgCal:null;
  const protDeficit=avgProt!=null?tgt.protein-avgProt:null;
  const nutritionScore=avgCal!=null&&avgProt!=null?Math.min(100,Math.round(((Math.min(avgCal/tgt.calories,1)+Math.min(avgProt/tgt.protein,1))/2)*100)):null;

  // ── Hydration signals ──
  const todayWater=data.hydration.filter(h=>h.date===today).reduce((s,h)=>s+(Number(h.oz)||0),0);
  const last7Water=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return data.hydration.filter(h=>h.date===ds).reduce((s,h)=>s+(Number(h.oz)||0),0);}).filter(v=>v>0);
  const avgWater=last7Water.length?(last7Water.reduce((s,v)=>s+v,0)/last7Water.length):null;
  const hydrationScore=avgWater!=null?Math.min(100,Math.round((avgWater/tgt.water)*100)):null;

  // ── Pain signals ──
  const activePains=data.painLog.filter(p=>!p.resolved);
  const highSevPains=activePains.filter(p=>Number(p.severity)>=7);
  const painAreas=activePains.map(p=>p.location);

  // ── HRV / Heart signals ──
  const latestHR=data.heartRate.length?data.heartRate[data.heartRate.length-1]:null;
  const hrvTrend=data.heartRate.length>=3?(Number(data.heartRate[data.heartRate.length-1]?.hrv||0)-Number(data.heartRate[data.heartRate.length-3]?.hrv||0)):0;

  // ── Lifestyle signals ──
  const recentLife=data.lifestyle.slice(-7);
  const avgStress=recentLife.length?(recentLife.reduce((s,l)=>s+Number(l.stress||5),0)/recentLife.length):null;
  const avgEnergy=recentLife.length?(recentLife.reduce((s,l)=>s+Number(l.energy||5),0)/recentLife.length):null;

  // ── RECOVERY SCORE (1-100) ──
  let recoveryScore=null;
  const components=[];
  if(sleepScore!=null){components.push({w:30,v:sleepScore});}
  if(avgRPE!=null){components.push({w:20,v:Math.max(0,100-((avgRPE-5)*20))});}
  if(activePains.length>=0){components.push({w:15,v:Math.max(0,100-(activePains.length*20)-(highSevPains.length*15))});}
  if(latestHR?.hrv){components.push({w:15,v:Math.min(100,Number(latestHR.hrv)*1.5)});}
  if(avgStress!=null){components.push({w:10,v:Math.max(0,100-((avgStress-3)*15))});}
  if(hydrationScore!=null){components.push({w:10,v:hydrationScore});}
  if(components.length>=2){
    const totalW=components.reduce((s,c)=>s+c.w,0);
    recoveryScore=Math.round(components.reduce((s,c)=>s+(c.v*(c.w/totalW)),0));
    recoveryScore=Math.max(0,Math.min(100,recoveryScore));
  }
  const recoveryLabel=recoveryScore==null?"—":recoveryScore>=80?"Great":recoveryScore>=60?"Good":recoveryScore>=40?"Moderate":"Low";
  const recoveryColor=recoveryScore==null?G.dim:recoveryScore>=80?G.moss:recoveryScore>=60?G.blue:recoveryScore>=40?G.orange:G.red;

  // ── SMART SIGNALS (cross-domain connections) ──
  const signals=[];
  if(avgSleepHrs!=null&&avgSleepHrs<6.5&&workoutsThisWeek>=4)signals.push({type:"caution",text:"Your sleep has been lighter this week — a rest day might help you bounce back stronger.",icon:"🌙",color:G.purple,go:"sleep"});
  if(sleepTrend<-1)signals.push({type:"trend",text:"Sleep has been trending down — try keeping a consistent bedtime this week.",icon:"📉",color:G.purple,go:"sleep"});
  if(protDeficit!=null&&protDeficit>30)signals.push({type:"nudge",text:`Protein has been about ${Math.round(protDeficit)}g below your target lately — a post-workout shake could help close the gap.`,icon:"🍗",color:G.orange,go:"nutr"});
  if(calDeficit!=null&&calDeficit>500&&workoutsThisWeek>=3)signals.push({type:"nudge",text:"You're training consistently but eating a bit under your calorie target — that might slow your progress.",icon:"🍽️",color:G.moss,go:"nutr"});
  if(highRPE)signals.push({type:"caution",text:"Your effort levels have been high recently — a deload or lighter session could help you recover.",icon:"🔋",color:G.amber,go:"train"});
  if(highSevPains.length>0)signals.push({type:"caution",text:`${highSevPains.map(p=>p.location).join(", ")} — worth being mindful of this during training.`,icon:"🩹",color:G.red,go:"train"});
  if(staleMuscles.length>0&&staleMuscles.length<=3)signals.push({type:"nudge",text:`${staleMuscles.join(" and ")} haven't been trained in a while — might be good to work them in soon.`,icon:"💪",color:G.orange,go:"train"});
  if(avgWater!=null&&avgWater<tgt.water*0.6)signals.push({type:"nudge",text:"Hydration has been on the lower side — even a little more water can help energy and recovery.",icon:"💧",color:G.teal,go:"hydra"});
  if(avgStress!=null&&avgStress>=7&&avgSleepHrs!=null&&avgSleepHrs<7)signals.push({type:"pattern",text:"Higher stress and shorter sleep tend to go together — winding down earlier might help both.",icon:"🧘",color:G.pink,go:"life"});
  if(lastSleep&&Number(lastSleep.hours)<6&&lastSleep.date===today)signals.push({type:"today",text:"Short night — listen to your body today. Lighter training or active recovery could be a smart call.",icon:"⚡",color:G.amber,go:"workout"});
  const todaySupps=data.supplements.filter(s=>s.date===today);
  if(todaySupps.length===0&&data.suppStacks?.length>0&&hr()>=9)signals.push({type:"reminder",text:"Haven't logged supplements yet — your saved stack is just one tap away.",icon:"💊",color:G.purple,go:"supps"});

  // ── DAILY BRIEFING ──
  const briefing=[];
  if(recoveryScore!=null)briefing.push(`Recovery: ${recoveryScore}/100 (${recoveryLabel})`);
  if(todayCal>0)briefing.push(`${todayCal}/${tgt.calories} cal · ${todayProt}/${tgt.protein}g protein so far`);
  if(todayWater>0)briefing.push(`${todayWater}/${tgt.water}oz water`);
  if(workoutsThisWeek>0)briefing.push(`${workoutsThisWeek} workout${workoutsThisWeek>1?"s":""} this week`);

  return {
    recoveryScore,recoveryLabel,recoveryColor,sleepScore,nutritionScore,hydrationScore,
    avgSleepHrs,avgRPE,avgCal,avgProt,avgWater,avgStress,avgEnergy,
    calDeficit,protDeficit,sleepDebt,
    workoutsThisWeek,muscleFreshness,staleMuscles,freshMuscles,highRPE,
    todayCal,todayProt,todayWater,
    activePains,highSevPains,painAreas,
    latestHR,hrvTrend,
    tgt,
    signals,briefing,
  };
}
