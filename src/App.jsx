import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from "recharts";
import { getData, setData as setStorageData } from "./storage.js";
import { callClaude, getApiKey, setApiKey, hasApiKey } from "./api.js";

const SK="vitals-v5";const td=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);const hr=()=>new Date().getHours();
async function ld(){try{return await getData(SK);}catch{return null;}}
async function sv(d){try{await setStorageData(SK,d);}catch(e){console.error(e);}}
function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

const G={
  bg:"#06070b",surface:"rgba(255,255,255,0.03)",
  glass:"rgba(255,255,255,0.06)",glass2:"rgba(255,255,255,0.09)",glass3:"rgba(255,255,255,0.12)",
  glassBorder:"rgba(255,255,255,0.08)",glassBorder2:"rgba(255,255,255,0.12)",
  blur:"blur(24px)",blur2:"blur(40px)",
  txt:"#f2f2f8",sub:"#a0a0b8",dim:"#606078",muted:"#38384a",
  gMoss:["#2dd36f","#0d9e4f"],gBlue:["#4dc9f6","#2979ff"],gPurple:["#b48eff","#7c4dff"],
  gOrange:["#ff9f43","#ff6b35"],gRed:["#ff4d6a","#e02050"],gTeal:["#22d3ee","#0891b2"],
  gPink:["#f472b6","#db2777"],gAmber:["#fbbf24","#d97706"],gIndigo:["#818cf8","#4f46e5"],
  moss:"#2dd36f",blue:"#4dc9f6",purple:"#b48eff",orange:"#ff9f43",
  red:"#ff4d6a",teal:"#22d3ee",pink:"#f472b6",amber:"#fbbf24",indigo:"#818cf8",
};

const PAIN_LOCS=["Neck","Shoulder L","Shoulder R","Upper Back","Lower Back","Elbow L","Elbow R","Wrist L","Wrist R","Hip L","Hip R","Knee L","Knee R","Ankle L","Ankle R","Chest","Glute L","Glute R","Hamstring L","Hamstring R","Quad L","Quad R","Calf L","Calf R"];
const PAIN_TYPES=["Sharp","Dull/Aching","Burning","Stiffness","Tingling","Cramping","Throbbing"];
const SUPP_LIST=["Creatine","Vitamin D","Omega-3","Magnesium","Zinc","Vitamin C","B Complex","Ashwagandha","Iron","Protein Powder","Pre-Workout","Multivitamin","Turmeric","Collagen","L-Glutamine","Beta-Alanine","Caffeine","Melatonin","Other"];

const NAV_PAGES=[
  {id:"nutr",label:"Nutrition",icon:"🍽️",color:G.moss},
  {id:"train",label:"Training",icon:"💪",color:G.orange},
  {id:"hydra",label:"Hydration",icon:"💧",color:G.teal},
  {id:"supps",label:"Supps",icon:"💊",color:G.purple},
  {id:"sleep",label:"Sleep",icon:"🌙",color:G.indigo},
  {id:"life",label:"Lifestyle",icon:"🧘",color:G.pink},
  {id:"health",label:"Health Import",icon:"❤️",color:G.red},
  {id:"body",label:"Body",icon:"📏",color:G.blue},
  {id:"workout",label:"Workout Builder",icon:"⚡",color:G.amber},
  {id:"feedback",label:"Feedback",icon:"💬",color:G.blue},
  {id:"settings",label:"Settings",icon:"⚙️",color:G.sub},
];

const DEF={
  profile:{name:"",age:"",allergies:"",goals:["Muscle Mass","Strength"],units:"imperial",
    targets:{calories:2800,protein:180,water:100},
    customAllergies:""},
  nutrition:[],training:[],postWorkout:[],prs:[],painLog:[],bodyMetrics:[],sleep:[],lifestyle:[],
  hydration:[],supplements:[],healthImports:[],heartRate:[],ecg:[],bloodOx:[],respiratory:[],stepsData:[],watchWorkouts:[],
  insights:[],aiMemory:[],suppStacks:[],feedback:[],
};
function vo2(d,t){const m=d*1609.34;return Math.round(((m*(12/t)-504.9)/44.73)*10)/10;}

// ─── CROSS-DOMAIN INTELLIGENCE ENGINE ───
// Computes connected signals from all data domains. Every page reads from this.
function useVitalsIntel(data){
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
  // Weighted composite: sleep 30%, RPE inverse 20%, pain 15%, HRV 15%, stress inverse 10%, hydration 10%
  let recoveryScore=null;
  const components=[];
  if(sleepScore!=null){components.push({w:30,v:sleepScore});}
  if(avgRPE!=null){components.push({w:20,v:Math.max(0,100-((avgRPE-5)*20))});}// RPE 5=100, 10=0
  if(activePains.length>=0){components.push({w:15,v:Math.max(0,100-(activePains.length*20)-(highSevPains.length*15))});}
  if(latestHR?.hrv){components.push({w:15,v:Math.min(100,Number(latestHR.hrv)*1.5)});}// HRV 60+=good
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
  // Sleep → Training
  if(avgSleepHrs!=null&&avgSleepHrs<6.5&&workoutsThisWeek>=4)signals.push({type:"caution",text:"Your sleep has been lighter this week — a rest day might help you bounce back stronger.",icon:"🌙",color:G.purple,go:"sleep"});
  if(sleepTrend<-1)signals.push({type:"trend",text:"Sleep has been trending down — try keeping a consistent bedtime this week.",icon:"📉",color:G.purple,go:"sleep"});
  // Nutrition → Training
  if(protDeficit!=null&&protDeficit>30)signals.push({type:"nudge",text:`Protein has been about ${Math.round(protDeficit)}g below your target lately — a post-workout shake could help close the gap.`,icon:"🍗",color:G.orange,go:"nutr"});
  if(calDeficit!=null&&calDeficit>500&&workoutsThisWeek>=3)signals.push({type:"nudge",text:"You're training consistently but eating a bit under your calorie target — that might slow your progress.",icon:"🍽️",color:G.moss,go:"nutr"});
  // RPE → Recovery
  if(highRPE)signals.push({type:"caution",text:"Your effort levels have been high recently — a deload or lighter session could help you recover.",icon:"🔋",color:G.amber,go:"train"});
  // Pain → Training
  if(highSevPains.length>0)signals.push({type:"caution",text:`${highSevPains.map(p=>p.location).join(", ")} — worth being mindful of this during training.`,icon:"🩹",color:G.red,go:"train"});
  // Muscle staleness
  if(staleMuscles.length>0&&staleMuscles.length<=3)signals.push({type:"nudge",text:`${staleMuscles.join(" and ")} haven't been trained in a while — might be good to work them in soon.`,icon:"💪",color:G.orange,go:"train"});
  // Hydration → everything
  if(avgWater!=null&&avgWater<tgt.water*0.6)signals.push({type:"nudge",text:"Hydration has been on the lower side — even a little more water can help energy and recovery.",icon:"💧",color:G.teal,go:"hydra"});
  // Stress → Sleep connection
  if(avgStress!=null&&avgStress>=7&&avgSleepHrs!=null&&avgSleepHrs<7)signals.push({type:"pattern",text:"Higher stress and shorter sleep tend to go together — winding down earlier might help both.",icon:"🧘",color:G.pink,go:"life"});
  // Training after poor sleep
  if(lastSleep&&Number(lastSleep.hours)<6&&lastSleep.date===today)signals.push({type:"today",text:"Short night — listen to your body today. Lighter training or active recovery could be a smart call.",icon:"⚡",color:G.amber,go:"workout"});
  // Supplement reminder
  const todaySupps=data.supplements.filter(s=>s.date===today);
  if(todaySupps.length===0&&data.suppStacks?.length>0&&hr()>=9)signals.push({type:"reminder",text:"Haven't logged supplements yet — your saved stack is just one tap away.",icon:"💊",color:G.purple,go:"supps"});

  // ── DAILY BRIEFING (computed, no AI needed) ──
  const briefing=[];
  if(recoveryScore!=null)briefing.push(`Recovery: ${recoveryScore}/100 (${recoveryLabel})`);
  if(todayCal>0)briefing.push(`${todayCal}/${tgt.calories} cal · ${todayProt}/${tgt.protein}g protein so far`);
  if(todayWater>0)briefing.push(`${todayWater}/${tgt.water}oz water`);
  if(workoutsThisWeek>0)briefing.push(`${workoutsThisWeek} workout${workoutsThisWeek>1?"s":""} this week`);

  return {
    // Scores
    recoveryScore,recoveryLabel,recoveryColor,sleepScore,nutritionScore,hydrationScore,
    // Averages
    avgSleepHrs,avgRPE,avgCal,avgProt,avgWater,avgStress,avgEnergy,
    // Deficits
    calDeficit,protDeficit,sleepDebt,
    // Training
    workoutsThisWeek,muscleFreshness,staleMuscles,freshMuscles,highRPE,
    // Today
    todayCal,todayProt,todayWater,
    // Pain
    activePains,highSevPains,painAreas,
    // Heart
    latestHR,hrvTrend,
    // Targets
    tgt,
    // Cross-domain
    signals,briefing,
  };
}

// ─── GLASS PRIMITIVES ───
function Glass({children,style:sx={},onClick,glow}){
  return <div style={{position:"relative",overflow:"hidden",...sx}} onClick={onClick}>
    {glow&&<div style={{position:"absolute",top:"-40%",left:"-20%",width:"140%",height:"140%",background:glow,filter:"blur(60px)",opacity:.35,pointerEvents:"none",zIndex:0}}/>}
    <div style={{position:"relative",zIndex:1,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderRadius:sx.borderRadius||20,border:`1px solid ${G.glassBorder}`,padding:sx.padding||18,height:"100%",boxSizing:"border-box"}}>
      {children}
    </div>
  </div>;
}
function GradCard({children,colors,style:sx={},onClick}){
  return <div style={{position:"relative",borderRadius:20,overflow:"hidden",cursor:onClick?"pointer":"default",...sx}} onClick={onClick}>
    <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,opacity:.85}}/>
    <div style={{position:"absolute",inset:0,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}/>
    <div style={{position:"relative",zIndex:1,padding:18,color:"#fff"}}>{children}</div>
  </div>;
}
function Ring({pct,size=100,stroke=10,color,trackColor,children}){
  const r=(size-stroke)/2;const circ=2*Math.PI*r;const off=circ-(Math.min(pct||0,100)/100)*circ;
  return <div style={{position:"relative",width:size,height:size}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",filter:`drop-shadow(0 0 8px ${color}40)`}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor||G.muted} strokeWidth={stroke} opacity={.3}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||G.moss} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease"}}/>
    </svg>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{children}</div>
  </div>;
}
function Fld({label,type="text",value,set,opts,ph,min,max,step}){
  const s={width:"100%",background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:14,padding:"12px 14px",color:G.txt,fontSize:15,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  return <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:13,color:G.sub,marginBottom:6,fontWeight:600}}>{label}</label>}
    {opts?<select style={s} value={value} onChange={e=>set(e.target.value)}><option value="">Select...</option>{opts.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select>
      :type==="textarea"?<textarea style={{...s,minHeight:60,resize:"vertical"}} value={value} onChange={e=>set(e.target.value)} placeholder={ph}/>
        :<input style={s} type={type} value={value} onChange={e=>set(e.target.value)} placeholder={ph} min={min} max={max} step={step}/>}
  </div>;
}
function Btn({children,onClick,v="primary",sx={},disabled}){
  const vs={primary:{background:`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,color:"#fff",border:"none",boxShadow:`0 4px 20px ${G.moss}30`},secondary:{background:G.glass2,color:G.txt,border:`1px solid ${G.glassBorder2}`,backdropFilter:G.blur},danger:{background:"rgba(255,77,106,0.12)",color:G.red,border:`1px solid rgba(255,77,106,0.15)`},ghost:{background:"transparent",color:G.moss,border:"none"}};
  return <button style={{padding:"12px 20px",borderRadius:14,fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?.5:1,...vs[v],...sx}} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Slider({label,value,set,min=1,max=10,color}){
  return <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <span style={{fontSize:13,color:G.sub,fontWeight:600}}>{label}</span>
      <span style={{fontSize:18,fontWeight:700,color:color||G.moss}}>{value}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e=>set(e.target.value)} style={{width:"100%",accentColor:color||G.moss,height:6}}/>
  </div>;
}
function Modal({open,onClose,title,children}){
  if(!open)return null;
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1100,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",background:"#111218",borderRadius:"24px 24px 0 0",padding:"20px 22px 34px",border:`1px solid ${G.glassBorder2}`,borderBottom:"none",boxShadow:"0 -8px 40px rgba(0,0,0,.4)"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:40,height:4,borderRadius:2,background:G.muted,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:20,fontWeight:700,color:G.txt}}>{title}</h3>
        <button onClick={onClose} style={{background:G.glass2,border:`1px solid ${G.glassBorder}`,width:32,height:32,borderRadius:16,color:G.sub,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>{children}
    </div>
  </div>;
}
function EI({primary,secondary,tertiary,onDelete,color}){
  return <div style={{display:"flex",alignItems:"center",padding:"12px 14px",background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderRadius:14,marginBottom:6,border:`1px solid ${G.glassBorder}`,borderLeft:color?`3px solid ${color}`:undefined}}>
    <div style={{flex:1}}><div style={{fontSize:14,color:G.txt,fontWeight:500}}>{primary}</div>{secondary&&<div style={{fontSize:12,color:G.dim,marginTop:2}}>{secondary}</div>}</div>
    {tertiary&&<div style={{fontSize:17,fontWeight:700,color:color||G.moss,marginRight:onDelete?10:0}}>{tertiary}</div>}
    {onDelete&&<button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:G.glass2,border:"none",width:26,height:26,borderRadius:13,color:G.dim,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
  </div>;
}
function Section({title,action,onAction,children}){
  return <div style={{marginBottom:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <h2 style={{fontSize:22,fontWeight:700,color:G.txt,margin:0}}>{title}</h2>
    {action&&<Btn onClick={onAction} v="ghost" sx={{fontSize:13,padding:"6px 14px"}}>{action}</Btn>}</div>{children}</div>;
}

// ─── BOTTOM NAV + MENU OVERLAY ───
function BottomNav({current,onNav}){
  const [menuOpen,setMenuOpen]=useState(false);
  const mainTabs=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"_track",icon:"➕",label:"Log"},
    {id:"ai",icon:"🧠",label:"Coach"},
    {id:"settings",icon:"⚙️",label:"More"},
  ];
  return <>
    {/* Full screen menu overlay */}
    {menuOpen&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1050,background:"rgba(6,7,11,0.85)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:24}} onClick={()=>setMenuOpen(false)}>
      <div style={{fontSize:12,fontWeight:700,color:G.dim,letterSpacing:2,marginBottom:24}}>NAVIGATE</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,maxWidth:360,width:"100%"}}>
        {NAV_PAGES.map(p=><button key={p.id} onClick={e=>{e.stopPropagation();onNav(p.id);setMenuOpen(false);}}
          style={{background:current===p.id?G.glass3:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,border:`1px solid ${current===p.id?G.glassBorder2:G.glassBorder}`,borderRadius:20,padding:"20px 8px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .2s"}}>
          <span style={{fontSize:28,filter:`drop-shadow(0 0 10px ${p.color}60)`}}>{p.icon}</span>
          <span style={{fontSize:11,fontWeight:600,color:current===p.id?G.txt:G.sub}}>{p.label}</span>
        </button>)}
      </div>
      <button onClick={()=>setMenuOpen(false)} style={{marginTop:32,background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:20,padding:"12px 32px",color:G.txt,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",backdropFilter:G.blur}}>Close</button>
    </div>}

    {/* Pill bottom bar */}
    <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:1000,width:"auto",maxWidth:320}}>
      <div style={{background:"rgba(18,19,26,0.8)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:28,border:`1px solid ${G.glassBorder2}`,padding:"6px 8px",display:"flex",gap:4,boxShadow:"0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.05) inset"}}>
        {mainTabs.map(t=>{
          const isActive=t.id==="_track"?menuOpen:(current===t.id);
          return <button key={t.id} onClick={()=>{if(t.id==="_track")setMenuOpen(!menuOpen);else{setMenuOpen(false);onNav(t.id);}}}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 16px",border:"none",borderRadius:22,cursor:"pointer",fontFamily:"inherit",
              background:isActive?G.glass3:"transparent",transition:"all .2s"}}>
            <span style={{fontSize:20,color:isActive?G.moss:G.dim,transition:"color .2s",filter:isActive?`drop-shadow(0 0 8px ${G.moss}60)`:"none"}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:isActive?700:500,color:isActive?G.moss:G.dim}}>{t.label}</span>
          </button>;
        })}
      </div>
    </div>
  </>;
}

// ─── HOME PAGE ───
function HomePage({data,go,onQuickLog}){
  const intel=useVitalsIntel(data);
  const p=data.profile;const tgt=intel.tgt;
  const tc=intel.todayCal;const tp=intel.todayProt;const todayH=intel.todayWater;
  const rs=data.sleep.slice(-7);const avgSleep=intel.avgSleepHrs!=null?intel.avgSleepHrs.toFixed(1):"—";
  const lb=data.bodyMetrics.length?data.bodyMetrics[data.bodyMetrics.length-1]:null;
  const wk=intel.workoutsThisWeek;
  const latestHR=intel.latestHR;
  const latestSpO2=data.bloodOx.length?data.bloodOx[data.bloodOx.length-1]:null;
  const latestSteps=data.stepsData.length?data.stepsData[data.stepsData.length-1]:null;
  const ap=intel.activePains.length;
  const name=p.name||"";
  const needsSetup=!p.name;

  return <div style={{position:"relative"}}>
    <div style={{position:"absolute",top:-40,left:-60,width:300,height:300,background:"radial-gradient(circle,rgba(45,211,111,.15) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"absolute",top:200,right:-80,width:300,height:300,background:"radial-gradient(circle,rgba(180,142,255,.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"absolute",top:500,left:-40,width:250,height:250,background:"radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

    <div style={{position:"relative",zIndex:1}}>
      <div style={{marginBottom:28,paddingTop:8}}>
        <div style={{fontSize:13,color:G.dim,fontWeight:500}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <div style={{fontSize:34,fontWeight:800,color:G.txt,marginTop:4,letterSpacing:-.5,lineHeight:1.1}}>
          {hr()<12?"Good Morning":hr()<18?"Good Afternoon":"Good Evening"}{name?`, ${name}`:""}<span style={{color:G.moss}}>.</span>
        </div>
      </div>

      {needsSetup&&<Glass glow={`radial-gradient(circle,${G.amber}25,transparent 70%)`} style={{marginBottom:16,borderRadius:20,cursor:"pointer"}} onClick={()=>go("settings")}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>👋</span>
          <div><div style={{fontSize:14,fontWeight:700,color:G.txt}}>Welcome to Vitals</div>
          <div style={{fontSize:12,color:G.dim,marginTop:2}}>Tap here to set up your profile, goals, and macro targets.</div></div>
        </div>
      </Glass>}

      {/* Recovery Score + Rings */}
      <Glass glow="radial-gradient(circle at 30% 50%, rgba(45,211,111,.3), rgba(255,159,67,.2) 50%, rgba(34,211,238,.2) 100%)" style={{marginBottom:16,borderRadius:24,overflow:"hidden"}}>
        {/* Recovery score banner */}
        {intel.recoveryScore!=null&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${G.glassBorder}`}}>
          <Ring pct={intel.recoveryScore} size={52} stroke={5} color={intel.recoveryColor} trackColor={`${intel.recoveryColor}25`}>
            <div style={{fontSize:16,fontWeight:800,color:intel.recoveryColor}}>{intel.recoveryScore}</div>
          </Ring>
          <div><div style={{fontSize:13,fontWeight:700,color:intel.recoveryColor}}>Recovery: {intel.recoveryLabel}</div>
          <div style={{fontSize:10,color:G.dim}}>Sleep · RPE · Pain · Stress · Hydration</div></div>
        </div>}
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0"}}>
          {[{p:Math.round((tc/tgt.calories)*100),v:tc,u:`/${tgt.calories}`,l:"Calories",c:G.moss,go:"nutr"},
            {p:Math.round((tp/tgt.protein)*100),v:tp+"g",u:`/${tgt.protein}g`,l:"Protein",c:G.orange,go:"nutr"},
            {p:Math.round((todayH/tgt.water)*100),v:todayH,u:`/${tgt.water}oz`,l:"Water",c:G.teal,go:"hydra"}].map((r,i)=>
            <div key={i} style={{textAlign:"center",cursor:"pointer"}} onClick={()=>go(r.go)}>
              <Ring pct={r.p} size={92} stroke={9} color={r.c} trackColor={`${r.c}25`}>
                <div style={{fontSize:21,fontWeight:800,color:r.c}}>{r.v}</div>
                <div style={{fontSize:8,color:G.dim,fontWeight:600}}>{r.u}</div>
              </Ring>
              <div style={{fontSize:11,fontWeight:700,color:r.c,marginTop:8,letterSpacing:.5}}>{r.l}</div>
            </div>)}
        </div>
      </Glass>

      {/* Smart Signals — cross-domain intelligence */}
      {intel.signals.length>0&&<div style={{marginBottom:14}}>
        {intel.signals.slice(0,3).map((s,i)=><div key={i} onClick={()=>go(s.go)} style={{background:`${s.color}08`,border:`1px solid ${s.color}18`,borderRadius:14,padding:"10px 14px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"flex-start",gap:10}}>
          <span style={{fontSize:18,marginTop:1,flexShrink:0}}>{s.icon}</span>
          <span style={{fontSize:12,color:G.sub,lineHeight:1.5,fontWeight:500}}>{s.text}</span>
        </div>)}
      </div>}

      {/* Quick-log actions */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{l:"+ Meal",icon:"🍽️",c:G.moss,go:"nutr"},{l:"+ Water",icon:"💧",c:G.teal,action:"water"},{l:"+ Workout",icon:"💪",c:G.orange,go:"train"},{l:"+ Sleep",icon:"🌙",c:G.purple,go:"sleep"}].map((a,i)=>
          <button key={i} onClick={()=>{if(a.action==="water"){onQuickLog("water");}else go(a.go);}}
            style={{flex:1,background:`${a.c}12`,border:`1px solid ${a.c}25`,borderRadius:14,padding:"10px 4px",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:16}}>{a.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:a.c}}>{a.l}</span>
          </button>)}
      </div>

      {/* Vitals grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <GradCard colors={G.gPurple} style={{gridRow:"span 2",minHeight:160}} onClick={()=>go("health")}>
          <div style={{fontSize:11,opacity:.8,fontWeight:700,letterSpacing:.5}}>Heart Rate</div>
          <div style={{fontSize:48,fontWeight:800,marginTop:8,lineHeight:1}}>{latestHR?.resting||"—"}</div>
          <div style={{fontSize:12,opacity:.7,marginTop:4}}>bpm resting</div>
          {latestHR?.hrv&&<div style={{marginTop:12,padding:"6px 10px",background:"rgba(255,255,255,.12)",borderRadius:10,display:"inline-block"}}>
            <span style={{fontSize:11,opacity:.8}}>HRV: </span><span style={{fontSize:14,fontWeight:700}}>{latestHR.hrv}ms</span>
          </div>}
        </GradCard>
        <GradCard colors={G.gMoss} onClick={()=>go("train")}>
          <div style={{fontSize:11,opacity:.8,fontWeight:700}}>Workouts</div>
          <div style={{fontSize:36,fontWeight:800,marginTop:4}}>{wk}</div>
          <div style={{fontSize:11,opacity:.7}}>this week</div>
        </GradCard>
        <GradCard colors={G.gTeal} onClick={()=>go("sleep")}>
          <div style={{fontSize:11,opacity:.8,fontWeight:700}}>Sleep</div>
          <div style={{fontSize:36,fontWeight:800,marginTop:4}}>{avgSleep}</div>
          <div style={{fontSize:11,opacity:.7}}>hrs avg</div>
        </GradCard>
      </div>

      <div style={{marginBottom:10}}>
        <Glass glow={`radial-gradient(circle,${G.orange}30,transparent 70%)`} style={{borderRadius:20}} onClick={()=>go("body")}>
          <div style={{fontSize:10,color:G.dim,fontWeight:700}}>Weight</div>
          <div style={{fontSize:30,fontWeight:800,color:G.txt,marginTop:4}}>{lb?.weight||"—"}<span style={{fontSize:12,color:G.dim}}> lbs</span></div>
        </Glass>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Glass glow={`radial-gradient(circle,${G.blue}20,transparent 70%)`} style={{borderRadius:18,padding:14}} onClick={()=>go("health")}>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700,letterSpacing:.5}}>SpO2</div>
          <div style={{fontSize:24,fontWeight:800,color:G.blue,marginTop:4}}>{latestSpO2?.value||"—"}<span style={{fontSize:10}}>%</span></div></div>
        </Glass>
        <Glass glow={`radial-gradient(circle,${G.pink}20,transparent 70%)`} style={{borderRadius:18,padding:14}} onClick={()=>go("health")}>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700,letterSpacing:.5}}>Steps</div>
          <div style={{fontSize:20,fontWeight:800,color:G.pink,marginTop:4}}>{latestSteps?.count||"—"}</div></div>
        </Glass>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{background:G.glass2,backdropFilter:G.blur,borderRadius:20,padding:"6px 14px",border:`1px solid ${G.glassBorder}`,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:3,background:G.purple}}/>
          <span style={{fontSize:11,color:G.sub,fontWeight:600}}>PRs: {data.prs.length}</span>
        </div>
        {ap>0&&<div style={{background:"rgba(255,77,106,.1)",borderRadius:20,padding:"6px 14px",border:`1px solid rgba(255,77,106,.2)`,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:3,background:G.red}}/>
          <span style={{fontSize:11,color:G.red,fontWeight:600}}>{ap} Pain{ap>1?"s":""}</span>
        </div>}
      </div>

      {data.insights.length>0&&<Glass glow={`radial-gradient(circle at 0% 50%,${G.moss}20,transparent 60%)`} style={{marginBottom:16,borderRadius:20}} onClick={()=>go("ai")}>
        <div style={{fontSize:10,fontWeight:700,color:G.moss,letterSpacing:1.5,marginBottom:8}}>⬡ AI INSIGHT</div>
        <div style={{fontSize:13,color:G.sub,lineHeight:1.6}}>{data.insights[data.insights.length-1].text?.slice(0,200)}...</div>
      </Glass>}
    </div>
  </div>;
}

// ─── HEALTH IMPORT ───
function HealthPage({data,setData}){
  const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const fileRef=useRef();
  const analyze=async(file)=>{setLoading(true);setResult(null);try{const b64=await toB64(file);const bd=b64.split(",")[1];
    const txt=await callClaude({system:`Extract health data from Apple Health screenshots. JSON only:
{"type":"sleep|heart_rate|ecg|blood_oxygen|respiratory|steps|vo2max|workout|other","data":{...},"date":"YYYY-MM-DD","summary":"brief"}
sleep:{"hours":N,"deep":N,"rem":N,"core":N,"awake":N,"bedtime":"HH:MM","wakeTime":"HH:MM"} heart_rate:{"resting":N,"average":N,"high":N,"low":N,"hrv":N} ecg:{"rhythm":"Sinus|AFib|Inconclusive","bpm":N} blood_oxygen:{"value":N} respiratory:{"rate":N} steps:{"count":N,"distance":N,"flights":N} vo2max:{"value":N} workout:{"type":"...","duration":N,"calories":N,"avgHR":N}`,
      messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:bd}},{type:"text",text:"Extract health data from this Apple Health screenshot."}]}]});
    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());setResult(parsed);
    const nd={...data};const date=parsed.date||td();const entry={...parsed.data,id:uid(),date,source:"health_import"};
    if(parsed.type==="sleep")nd.sleep=[...nd.sleep,{hours:String(parsed.data.hours||""),quality:parsed.data.deep>1.5?"Good":"Fair",bedtime:parsed.data.bedtime||"",wakeTime:parsed.data.wakeTime||"",deep:parsed.data.deep,rem:parsed.data.rem,core:parsed.data.core,awake:parsed.data.awake,date,id:uid(),source:"health_import"}];
    else if(parsed.type==="heart_rate")nd.heartRate=[...nd.heartRate,entry];
    else if(parsed.type==="ecg")nd.ecg=[...nd.ecg,entry];
    else if(parsed.type==="blood_oxygen")nd.bloodOx=[...nd.bloodOx,entry];
    else if(parsed.type==="respiratory")nd.respiratory=[...nd.respiratory,entry];
    else if(parsed.type==="steps")nd.stepsData=[...nd.stepsData,entry];
    else if(parsed.type==="workout")nd.watchWorkouts=[...nd.watchWorkouts,entry];
    nd.healthImports=[...nd.healthImports,{id:uid(),date:td(),type:parsed.type,summary:parsed.summary}];setData(nd);sv(nd);
  }catch(e){setResult({error:e.message||"Failed."});}setLoading(false);};
  return <div><Section title="Health Import">
    <Glass glow="radial-gradient(circle,rgba(255,77,106,.15),transparent 70%)" style={{marginBottom:16,textAlign:"center",borderRadius:24,padding:28}}>
      <div style={{fontSize:44,marginBottom:10,filter:`drop-shadow(0 0 12px ${G.red}40)`}}>❤️</div>
      <div style={{fontSize:16,color:G.txt,fontWeight:700,marginBottom:6}}>Import from Apple Health</div>
      <div style={{fontSize:12,color:G.dim,lineHeight:1.5,marginBottom:18}}>Screenshot any Apple Health screen and AI extracts the data automatically.</div>
      <Btn onClick={()=>fileRef.current?.click()} disabled={loading} sx={{padding:"14px 32px",fontSize:15}}>{loading?"Analyzing...":"📸 Upload Screenshot"}</Btn>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analyze(e.target.files[0]);}}/>
    </Glass>
    {result?.error&&<Glass style={{marginBottom:14,borderRadius:16}}><div style={{color:G.red,fontSize:13}}>{result.error}</div></Glass>}
    {result&&!result.error&&<Glass style={{marginBottom:16,borderRadius:16}}>
      <div style={{fontSize:13,fontWeight:700,color:G.moss,marginBottom:6}}>✓ Imported: {result.type?.replace("_"," ")}</div>
      <div style={{fontSize:12,color:G.sub,marginBottom:8}}>{result.summary}</div>
      <div style={{background:G.glass,borderRadius:12,padding:12}}>{Object.entries(result.data||{}).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${G.glassBorder}`}}>
        <span style={{fontSize:12,color:G.dim}}>{k.replace(/([A-Z])/g," $1")}</span><span style={{fontSize:13,fontWeight:700,color:G.txt}}>{v}</span></div>)}</div>
    </Glass>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
      {[{l:"Sleep",i:"🌙",c:G.purple},{l:"Heart Rate",i:"❤️",c:G.red},{l:"ECG",i:"⚡",c:G.orange},{l:"SpO2",i:"🫁",c:G.blue},{l:"Respiratory",i:"💨",c:G.teal},{l:"Steps",i:"👟",c:G.pink},{l:"VO2 Max",i:"🏃",c:G.amber},{l:"Workouts",i:"💪",c:G.moss}].map(t=>
        <Glass key={t.l} style={{padding:"10px 12px",borderRadius:14,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,color:t.c,filter:`drop-shadow(0 0 6px ${t.c}40)`}}>{t.i}</span><span style={{fontSize:12,color:G.sub,fontWeight:500}}>{t.l}</span></Glass>)}
    </div></Section>
    {data.healthImports.length>0&&<Section title="History">{data.healthImports.slice().reverse().slice(0,15).map(h=><EI key={h.id} primary={h.type?.replace("_"," ")} secondary={`${h.date} · ${h.summary?.slice(0,50)}`} color={G.teal}/>)}</Section>}
    {data.heartRate.length>0&&<Section title="Heart Rate">{data.heartRate.slice().reverse().slice(0,5).map(h=><EI key={h.id} primary={`Resting: ${h.resting||"—"} bpm`} secondary={`${h.date}${h.hrv?` · HRV: ${h.hrv}ms`:""}`} color={G.red}/>)}</Section>}
    {data.ecg.length>0&&<Section title="ECG">{data.ecg.slice().reverse().slice(0,5).map(e=><EI key={e.id} primary={`${e.rhythm||"—"} Rhythm`} secondary={`${e.date} · ${e.bpm||"—"} bpm`} color={e.rhythm==="Sinus"?G.moss:G.orange}/>)}</Section>}
  </div>;
}
// ─── NUTRITION ───
function NutrPage({data,setData}){
  const [m,sm]=useState(false);const [aiL,sAL]=useState(false);const [aiR,sAR]=useState(null);
  const [f,sf]=useState({meal:"Breakfast",food:"",calories:"",protein:"",carbs:"",fat:"",date:td()});const fr=useRef();
  const [aiText,setAiText]=useState("");const [aiTextL,setAiTextL]=useState(false);const [aiTextItems,setAiTextItems]=useState([]);
  const [viewDate,setViewDate]=useState(td());const [showChart,setShowChart]=useState(false);
  const te=data.nutrition.filter(n=>n.date===viewDate);const tc=te.reduce((s,n)=>s+(Number(n.calories)||0),0);const tp=te.reduce((s,n)=>s+(Number(n.protein)||0),0);const tcarb=te.reduce((s,n)=>s+(Number(n.carbs)||0),0);const tf=te.reduce((s,n)=>s+(Number(n.fat)||0),0);
  const add=()=>{if(!f.food)return;const nd={...data,nutrition:[...data.nutrition,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);sf({meal:"Breakfast",food:"",calories:"",protein:"",carbs:"",fat:"",date:td()});};
  const del=id=>{const nd={...data,nutrition:data.nutrition.filter(n=>n.id!==id)};setData(nd);sv(nd);};
  const snap=async(file)=>{sAL(true);sAR(null);try{const b64=await toB64(file);const bd=b64.split(",")[1];
    const txt=await callClaude({system:`Nutrition analyst. Accurate macros. Pure JSON.${data.profile.allergies?` Flag these allergens/restrictions: ${data.profile.allergies}.`:""}`,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:bd}},{type:"text",text:`Food photo.${data.profile.allergies?` ALLERGIES: ${data.profile.allergies}.`:""} JSON: {"food":"desc","calories":N,"protein":N,"carbs":N,"fat":N,"dairy_warning":bool,"notes":"obs"}`}]}]});
    const p=JSON.parse(txt.replace(/```json|```/g,"").trim());sAR(p);sf({...f,food:p.food||"",calories:String(p.calories||""),protein:String(p.protein||""),carbs:String(p.carbs||""),fat:String(p.fat||"")});
  }catch(e){sAR({error:e.message||"Failed."});}sAL(false);};

  // AI text-based food analysis
  const analyzeText=async()=>{if(!aiText.trim())return;setAiTextL(true);setAiTextItems([]);try{
    const txt=await callClaude({system:`You are a precise nutrition analyst. The user will describe food items with approximate portions. Return accurate macros for EACH item separately. Be precise about portion sizes — use USDA data as reference.${data.profile.allergies?` Flag any items containing: ${data.profile.allergies}.`:""}
Return ONLY valid JSON array, no markdown: [{"food":"item description with portion","calories":N,"protein":N,"carbs":N,"fat":N,"dairy_warning":false}]
Example: "half avocado, 150g chicken breast, cup of rice" → 3 separate items with accurate per-item macros.
Be specific: "half avocado (~68g)" not just "avocado". Round to whole numbers.`,
      messages:[{role:"user",content:`Analyze these foods and give me accurate macros for each item: ${aiText}`}]});
    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
    const items=Array.isArray(parsed)?parsed:[parsed];
    setAiTextItems(items);
  }catch(e){setAiTextItems([{error:e.message||"Failed to analyze."}]);}setAiTextL(false);};

  const addAiItem=(item)=>{const entry={meal:f.meal,food:item.food,calories:String(item.calories||0),protein:String(item.protein||0),carbs:String(item.carbs||0),fat:String(item.fat||0),date:f.date,id:uid()};const nd={...data,nutrition:[...data.nutrition,entry]};setData(nd);sv(nd);};
  const addAllAiItems=()=>{const entries=aiTextItems.filter(i=>!i.error).map(item=>({meal:f.meal,food:item.food,calories:String(item.calories||0),protein:String(item.protein||0),carbs:String(item.carbs||0),fat:String(item.fat||0),date:f.date,id:uid()}));const nd={...data,nutrition:[...data.nutrition,...entries]};setData(nd);sv(nd);setAiText("");setAiTextItems([]);sm(false);};

  // 7-day chart data
  const chartData=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=d.toISOString().split("T")[0];const dn=data.nutrition.filter(n=>n.date===ds);return{day:d.toLocaleDateString("en-US",{weekday:"short"}),cal:dn.reduce((s,n)=>s+(Number(n.calories)||0),0),prot:dn.reduce((s,n)=>s+(Number(n.protein)||0),0)};});

  // Date navigation
  const shiftDate=(dir)=>{const d=new Date(viewDate+"T12:00");d.setDate(d.getDate()+dir);setViewDate(d.toISOString().split("T")[0]);};

  return <div><Section title="Nutrition" action="+ Manual" onAction={()=>{sAR(null);setAiTextItems([]);sm(true);}}>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <Btn onClick={()=>{sAR(null);setAiTextItems([]);fr.current?.click();}} v="secondary" sx={{flex:1,padding:12}}>📸 Photo</Btn>
      <Btn onClick={()=>{sAR(null);setAiTextItems([]);sm(true);}} v="secondary" sx={{flex:1,padding:12,background:`${G.moss}18`,color:G.moss,border:`1px solid ${G.moss}30`}}>✍️ AI Text</Btn>
    </div>
    <input ref={fr} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files[0]){snap(e.target.files[0]);sm(true);}}}/></Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:18}}>
      {[{l:"Kcal",v:tc,c:G.moss},{l:"Prot",v:tp+"g",c:G.orange},{l:"Carb",v:tcarb+"g",c:G.blue},{l:"Fat",v:tf+"g",c:G.purple}].map((x,i)=>
        <Glass key={i} style={{padding:10,borderRadius:14,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:x.c}}>{x.v}</div><div style={{fontSize:9,color:G.dim,fontWeight:600}}>{x.l}</div></Glass>)}
    </div>

    {/* 7-day trend toggle */}
    <div style={{marginBottom:14}}>
      <Btn onClick={()=>setShowChart(!showChart)} v="ghost" sx={{fontSize:12,padding:"4px 0",color:G.dim}}>
        {showChart?"Hide":"Show"} 7-Day Trend {showChart?"▲":"▼"}
      </Btn>
      {showChart&&<Glass style={{marginTop:8,borderRadius:16,padding:"14px 8px 6px"}}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barGap={2}>
            <XAxis dataKey="day" tick={{fill:G.dim,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#1a1b26",border:`1px solid ${G.glassBorder2}`,borderRadius:12,fontSize:12}} labelStyle={{color:G.txt}} itemStyle={{color:G.sub}}/>
            <Bar dataKey="cal" fill={G.moss} radius={[4,4,0,0]} name="Calories"/>
            <Bar dataKey="prot" fill={G.orange} radius={[4,4,0,0]} name="Protein (g)"/>
          </BarChart>
        </ResponsiveContainer>
      </Glass>}
    </div>

    {/* Date nav */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <button onClick={()=>shiftDate(-1)} style={{background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:10,width:32,height:32,color:G.sub,cursor:"pointer",fontSize:14}}>‹</button>
      <span style={{fontSize:13,fontWeight:600,color:viewDate===td()?G.moss:G.sub}}>{viewDate===td()?"Today":new Date(viewDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",weekday:"short"})}</span>
      <button onClick={()=>shiftDate(1)} style={{background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:10,width:32,height:32,color:G.sub,cursor:"pointer",fontSize:14}}>›</button>
    </div>

    {te.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>No meals logged</div>:te.map(n=><EI key={n.id} primary={n.food} secondary={`${n.meal} · P:${n.protein}g C:${n.carbs}g F:${n.fat}g`} tertiary={n.calories} color={G.moss} onDelete={()=>del(n.id)}/>)}
    <Modal open={m} onClose={()=>{sm(false);setAiTextItems([]);}} title="Log Meal">
      {aiL&&<div style={{textAlign:"center",padding:20,color:G.moss}}>Analyzing photo...</div>}
      {aiR?.error&&<Glass style={{marginBottom:14}}><div style={{color:G.red,fontSize:13}}>{aiR.error}</div></Glass>}
      {aiR&&!aiR.error&&<Glass style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:G.moss}}>✓ {aiR.food}</div>{aiR.dairy_warning&&<div style={{fontSize:12,color:G.red,fontWeight:600,marginTop:4}}>⚠ Dairy detected</div>}</Glass>}

      {/* AI Text Entry */}
      <Glass style={{marginBottom:16,borderRadius:16,padding:14,borderLeft:`3px solid ${G.moss}`}}>
        <div style={{fontSize:13,fontWeight:700,color:G.moss,marginBottom:8}}>✍️ Describe Your Food</div>
        <div style={{fontSize:11,color:G.dim,marginBottom:10,lineHeight:1.5}}>Type what you ate with portions — AI returns accurate macros for each item.</div>
        <textarea value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="e.g. half an avocado, 150g chicken breast, cup of brown rice, tbsp olive oil" style={{width:"100%",background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:12,padding:"12px 14px",color:G.txt,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:60,resize:"vertical"}}/>
        <Btn onClick={analyzeText} disabled={aiTextL||!aiText.trim()} sx={{width:"100%",marginTop:8,padding:12}} v={aiText.trim()?"primary":"secondary"}>
          {aiTextL?"Analyzing...":"🧠 Get Macros"}
        </Btn>
      </Glass>

      {/* AI Text Results */}
      {aiTextItems.length>0&&!aiTextItems[0]?.error&&<div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700,color:G.moss}}>✓ {aiTextItems.length} item{aiTextItems.length>1?"s":""} found</span>
          <Btn onClick={addAllAiItems} v="primary" sx={{fontSize:11,padding:"6px 14px"}}>Log All</Btn>
        </div>
        {aiTextItems.map((item,i)=>{
          const totC=Number(item.calories)||0;
          return <div key={i} style={{background:G.glass,borderRadius:14,padding:"10px 14px",marginBottom:6,border:`1px solid ${G.glassBorder}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:G.txt,fontWeight:600}}>{item.food}</div>
              <div style={{fontSize:11,color:G.dim,marginTop:2}}>P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g</div>
              {item.dairy_warning&&<div style={{fontSize:10,color:G.red,fontWeight:600,marginTop:2}}>⚠ Dairy</div>}
            </div>
            <div style={{fontSize:16,fontWeight:800,color:G.moss,minWidth:40,textAlign:"right"}}>{totC}</div>
            <button onClick={()=>addAiItem(item)} style={{background:`${G.moss}20`,border:`1px solid ${G.moss}30`,borderRadius:10,width:28,height:28,color:G.moss,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>;
        })}
      </div>}
      {aiTextItems[0]?.error&&<Glass style={{marginBottom:14}}><div style={{color:G.red,fontSize:13}}>{aiTextItems[0].error}</div></Glass>}

      <div style={{height:1,background:G.glassBorder,margin:"8px 0 16px"}}/>
      <div style={{fontSize:12,fontWeight:700,color:G.dim,marginBottom:10}}>OR ENTER MANUALLY</div>
      <Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Fld label="Meal" opts={["Breakfast","Lunch","Dinner","Snack","Pre-workout","Post-workout"]} value={f.meal} set={v=>sf({...f,meal:v})}/><Fld label="Food" value={f.food} set={v=>sf({...f,food:v})} ph="e.g. Chicken & rice"/>
      <div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Cal" type="number" value={f.calories} set={v=>sf({...f,calories:v})}/></div><div style={{flex:1}}><Fld label="Prot" type="number" value={f.protein} set={v=>sf({...f,protein:v})}/></div></div>
      <div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Carb" type="number" value={f.carbs} set={v=>sf({...f,carbs:v})}/></div><div style={{flex:1}}><Fld label="Fat" type="number" value={f.fat} set={v=>sf({...f,fat:v})}/></div></div>
      <Btn onClick={add} sx={{width:"100%"}}>Log Meal</Btn></Modal></div>;
}

// ─── TRAINING ───
function TrainPage({data,setData}){
  const [m,sm]=useState(false);const [pw,spw]=useState(false);const [pm,spm]=useState(false);const [prm,sprm]=useState(false);
  const [f,sf]=useState({type:"Strength",name:"",sets:"",reps:"",weight:"",duration:"",distance:"",notes:"",date:td()});
  const [pwf,spwf]=useState({rpe:"7",mood:"Good",energy:"7",pump:"7",soreness:"",notes:"",date:td()});
  const [pf,spf]=useState({location:"",type:"Dull/Aching",severity:"5",during:"",trigger:"",notes:"",date:td()});
  const [prf,sprf]=useState({exercise:"",repMax:"1RM",weight:"",date:td(),notes:""});
  const addEx=()=>{if(!f.name)return;const e={...f,id:uid()};const nd={...data,training:[...data.training,e]};
    if(f.type==="Strength"&&f.weight&&f.reps){const reps=Number(f.reps);const w=Number(f.weight);const rmK=reps<=1?"1RM":reps<=3?"3RM":reps<=5?"5RM":null;
      if(rmK){const prev=data.prs.filter(p=>p.exercise.toLowerCase()===f.name.toLowerCase()&&p.repMax===rmK);const best=prev.length?Math.max(...prev.map(p=>Number(p.weight))):0;if(w>best)nd.prs=[...(nd.prs||[]),{id:uid(),exercise:f.name,repMax:rmK,weight:String(w),date:f.date,notes:`Auto`,auto:true}];}}
    setData(nd);sv(nd);sm(false);sf({type:"Strength",name:"",sets:"",reps:"",weight:"",duration:"",distance:"",notes:"",date:td()});};
  const addPW=()=>{setData(d=>{const nd={...d,postWorkout:[...d.postWorkout,{...pwf,id:uid()}]};sv(nd);return nd;});spw(false);};
  const addPain=()=>{if(!pf.location)return;setData(d=>{const nd={...d,painLog:[...d.painLog,{...pf,id:uid(),resolved:false}]};sv(nd);return nd;});spm(false);};
  const addPR=()=>{if(!prf.exercise||!prf.weight)return;setData(d=>{const nd={...d,prs:[...d.prs,{...prf,id:uid()}]};sv(nd);return nd;});sprm(false);};
  const del=id=>{const nd={...data,training:data.training.filter(t=>t.id!==id)};setData(nd);sv(nd);};
  const resPain=id=>{const nd={...data,painLog:data.painLog.map(p=>p.id===id?{...p,resolved:true,resolvedDate:td()}:p)};setData(nd);sv(nd);};
  const aP=data.painLog.filter(p=>!p.resolved);const byDate={};data.training.forEach(t=>{if(!byDate[t.date])byDate[t.date]=[];byDate[t.date].push(t);});const dates=Object.keys(byDate).sort().reverse().slice(0,10);
  return <div><Section title="Training"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><Btn onClick={()=>sm(true)} sx={{padding:12}}>+ Exercise</Btn><Btn onClick={()=>spw(true)} v="secondary" sx={{padding:12}}>+ Post-WO</Btn></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}><Btn onClick={()=>spm(true)} v="secondary" sx={{padding:12,color:G.red}}>+ Pain</Btn><Btn onClick={()=>sprm(true)} v="secondary" sx={{padding:12,color:G.moss}}>+ PR</Btn></div></Section>
    {aP.length>0&&<Section title="Active Pains">{aP.map(p=><Glass key={p.id} style={{marginBottom:6,padding:"10px 14px",borderRadius:14,display:"flex",alignItems:"center"}}><div style={{flex:1}}><div style={{fontSize:13,color:G.red,fontWeight:600}}>{p.location} — {p.type}</div><div style={{fontSize:11,color:G.dim}}>{p.date} · Sev:{p.severity}/10</div></div><Btn onClick={()=>resPain(p.id)} v="ghost" sx={{fontSize:11}}>✓</Btn></Glass>)}</Section>}
    {data.prs.length>0&&<Section title="PRs">{data.prs.slice(-4).reverse().map(p=><EI key={p.id} primary={`${p.exercise} ${p.repMax}`} secondary={p.date} tertiary={`${p.weight}lbs`} color={G.moss}/>)}</Section>}
    <Section title="History">{dates.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>No workouts</div>:dates.map(d=><div key={d} style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:600,color:G.dim,marginBottom:6}}>{new Date(d+"T12:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>{byDate[d].map(t=><EI key={t.id} primary={t.name} secondary={t.type==="Strength"?`${t.sets}×${t.reps}@${t.weight}lbs`:`${t.type}·${t.duration}min`} tertiary={t.type==="Strength"?`${(Number(t.sets)||0)*(Number(t.reps)||0)*(Number(t.weight)||0)}`:t.duration+"m"} color={t.type==="Strength"?G.moss:G.teal} onDelete={()=>del(t.id)}/>)}</div>)}</Section>
    <Modal open={m} onClose={()=>sm(false)} title="Log Exercise"><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Fld label="Type" opts={["Strength","Cardio","Plyometrics","Mobility","Sport"]} value={f.type} set={v=>sf({...f,type:v})}/><Fld label="Exercise" value={f.name} set={v=>sf({...f,name:v})} ph="e.g. Squat"/>{f.type==="Strength"&&<div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Sets" type="number" value={f.sets} set={v=>sf({...f,sets:v})}/></div><div style={{flex:1}}><Fld label="Reps" type="number" value={f.reps} set={v=>sf({...f,reps:v})}/></div><div style={{flex:1}}><Fld label="Wt" type="number" value={f.weight} set={v=>sf({...f,weight:v})}/></div></div>}{(f.type==="Cardio"||f.type==="Sport")&&<div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Dur" type="number" value={f.duration} set={v=>sf({...f,duration:v})}/></div><div style={{flex:1}}><Fld label="Dist" type="number" value={f.distance} set={v=>sf({...f,distance:v})}/></div></div>}<Fld label="Notes" type="textarea" value={f.notes} set={v=>sf({...f,notes:v})}/><Btn onClick={addEx} sx={{width:"100%"}}>Log</Btn></Modal>
    <Modal open={pw} onClose={()=>spw(false)} title="Post-Workout"><Fld label="Date" type="date" value={pwf.date} set={v=>spwf({...pwf,date:v})}/><Slider label="RPE" value={pwf.rpe} set={v=>spwf({...pwf,rpe:v})} color={G.orange}/><Slider label="Energy" value={pwf.energy} set={v=>spwf({...pwf,energy:v})} color={G.moss}/><Slider label="Pump" value={pwf.pump} set={v=>spwf({...pwf,pump:v})} color={G.purple}/><Fld label="Mood" opts={["Fired Up","Strong","Good","Okay","Drained","Frustrated"]} value={pwf.mood} set={v=>spwf({...pwf,mood:v})}/><Fld label="Soreness" value={pwf.soreness} set={v=>spwf({...pwf,soreness:v})}/><Btn onClick={addPW} sx={{width:"100%"}}>Save</Btn></Modal>
    <Modal open={pm} onClose={()=>spm(false)} title="Log Pain"><Fld label="Date" type="date" value={pf.date} set={v=>spf({...pf,date:v})}/><Fld label="Location" opts={PAIN_LOCS} value={pf.location} set={v=>spf({...pf,location:v})}/><Fld label="Type" opts={PAIN_TYPES} value={pf.type} set={v=>spf({...pf,type:v})}/><Slider label="Severity" value={pf.severity} set={v=>spf({...pf,severity:v})} color={G.red}/><Fld label="During" value={pf.during} set={v=>spf({...pf,during:v})}/><Btn onClick={addPain} sx={{width:"100%"}}>Log</Btn></Modal>
    <Modal open={prm} onClose={()=>sprm(false)} title="PR"><Fld label="Date" type="date" value={prf.date} set={v=>sprf({...prf,date:v})}/><Fld label="Exercise" value={prf.exercise} set={v=>sprf({...prf,exercise:v})}/><Fld label="Rep Max" opts={["1RM","2RM","3RM","5RM","8RM","10RM"]} value={prf.repMax} set={v=>sprf({...prf,repMax:v})}/><Fld label="Weight" type="number" value={prf.weight} set={v=>sprf({...prf,weight:v})}/><Btn onClick={addPR} sx={{width:"100%"}}>Save</Btn></Modal></div>;
}
// ─── HYDRATION ───
function HydraPage({data,setData}){
  const [m,sm]=useState(false);const [showChart,setShowChart]=useState(false);
  const [f,sf]=useState({oz:"8",type:"Water",date:td(),time:new Date().toTimeString().slice(0,5)});
  const tH=data.hydration.filter(h=>h.date===td());const tot=tH.reduce((s,h)=>s+(Number(h.oz)||0),0);const goal=data.profile?.targets?.water||100;
  const qA=oz=>{const nd={...data,hydration:[...data.hydration,{oz:String(oz),type:"Water",date:td(),time:new Date().toTimeString().slice(0,5),id:uid()}]};setData(nd);sv(nd);};
  const add=()=>{const nd={...data,hydration:[...data.hydration,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};
  const del=id=>{const nd={...data,hydration:data.hydration.filter(h=>h.id!==id)};setData(nd);sv(nd);};
  let streak=0;for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];if(data.hydration.filter(h=>h.date===ds).reduce((s,h)=>s+(Number(h.oz)||0),0)>=goal)streak++;else if(i>0)break;}
  const chartData=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=d.toISOString().split("T")[0];return{day:d.toLocaleDateString("en-US",{weekday:"short"}),oz:data.hydration.filter(h=>h.date===ds).reduce((s,h)=>s+(Number(h.oz)||0),0)};});
  return <div><Section title="Hydration" action="+ Custom" onAction={()=>sm(true)}>
    <div style={{textAlign:"center",marginBottom:20}}><Ring pct={(tot/goal)*100} size={160} stroke={14} color={G.teal} trackColor={`${G.teal}25`}><div style={{fontSize:38,fontWeight:800,color:G.teal}}>{tot}</div><div style={{fontSize:12,color:G.dim}}>/{goal}oz</div>{tot>=goal&&<div style={{fontSize:11,color:G.moss,fontWeight:600}}>✓</div>}</Ring></div>
    <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center",flexWrap:"wrap"}}>{[8,12,16,24,32].map(oz=><button key={oz} onClick={()=>qA(oz)} style={{background:`${G.teal}15`,border:`1px solid ${G.teal}25`,borderRadius:24,padding:"8px 16px",color:G.teal,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+{oz}</button>)}</div></Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gTeal}><div style={{fontSize:11,opacity:.8}}>Streak</div><div style={{fontSize:28,fontWeight:800}}>{streak}</div><div style={{fontSize:11,opacity:.7}}>days</div></GradCard><Glass style={{padding:14,borderRadius:20}}><div style={{fontSize:9,color:G.dim,fontWeight:600}}>Remaining</div><div style={{fontSize:28,fontWeight:800,color:tot>=goal?G.moss:G.orange}}>{Math.max(0,goal-tot)}</div><div style={{fontSize:11,color:G.dim}}>oz</div></Glass></div>
    {/* 7-day trend */}
    <div style={{marginBottom:14}}>
      <Btn onClick={()=>setShowChart(!showChart)} v="ghost" sx={{fontSize:12,padding:"4px 0",color:G.dim}}>
        {showChart?"Hide":"Show"} 7-Day Intake {showChart?"▲":"▼"}
      </Btn>
      {showChart&&<Glass style={{marginTop:8,borderRadius:16,padding:"14px 8px 6px"}}>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{fill:G.dim,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#1a1b26",border:`1px solid ${G.glassBorder2}`,borderRadius:12,fontSize:12}} labelStyle={{color:G.txt}}/>
            <Bar dataKey="oz" radius={[4,4,0,0]} name="oz">
              {chartData.map((entry,i)=><Cell key={i} fill={entry.oz>=goal?G.teal:entry.oz>=60?G.orange:G.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Glass>}
    </div>
    <div style={{fontSize:13,fontWeight:600,color:G.dim,marginBottom:8}}>Today</div>
    {tH.slice().reverse().map(h=><EI key={h.id} primary={`${h.oz}oz ${h.type||"Water"}`} secondary={h.time} color={G.teal} onDelete={()=>del(h.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log"><Fld label="oz" type="number" value={f.oz} set={v=>sf({...f,oz:v})}/><Fld label="Type" opts={["Water","Electrolytes","Tea","Coffee","Juice","Smoothie"]} value={f.type} set={v=>sf({...f,type:v})}/><Fld label="Time" type="time" value={f.time} set={v=>sf({...f,time:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal></div>;
}
// ─── SUPPLEMENTS ───
function SuppsPage({data,setData}){
  const [m,sm]=useState(false);const [stackM,setStackM]=useState(false);const [stackName,setStackName]=useState("");
  const [f,sf]=useState({name:"Creatine",dosage:"",timing:"Morning",date:td()});
  const add=()=>{if(!f.name)return;const nd={...data,supplements:[...data.supplements,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};
  const del=id=>{const nd={...data,supplements:data.supplements.filter(s=>s.id!==id)};setData(nd);sv(nd);};
  const tS=data.supplements.filter(s=>s.date===td());const freq={};data.supplements.forEach(s=>{freq[s.name]=(freq[s.name]||0)+1;});
  const stacks=data.suppStacks||[];

  // Log entire stack
  const logStack=(stack)=>{const entries=stack.items.map(item=>({...item,date:td(),id:uid()}));const nd={...data,supplements:[...data.supplements,...entries]};setData(nd);sv(nd);};

  // Save current day's supps as a stack
  const saveStack=()=>{if(!stackName.trim()||tS.length===0)return;
    const items=tS.map(s=>({name:s.name,dosage:s.dosage,timing:s.timing}));
    const stack={id:uid(),name:stackName,items};
    const nd={...data,suppStacks:[...stacks,stack]};setData(nd);sv(nd);setStackM(false);setStackName("");};

  const deleteStack=(id)=>{const nd={...data,suppStacks:stacks.filter(s=>s.id!==id)};setData(nd);sv(nd);};

  return <div><Section title="Supplements" action="+ Log" onAction={()=>sm(true)}>
    {/* Daily Stacks */}
    {stacks.length>0&&<div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color:G.dim,letterSpacing:1,marginBottom:8}}>MY STACKS</div>
      {stacks.map(stack=><Glass key={stack.id} style={{marginBottom:8,borderRadius:16,padding:"12px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:14,fontWeight:700,color:G.purple}}>{stack.name}</div>
          <div style={{display:"flex",gap:6}}>
            <Btn onClick={()=>logStack(stack)} v="primary" sx={{fontSize:11,padding:"5px 12px",borderRadius:10}}>Log All</Btn>
            <button onClick={()=>deleteStack(stack.id)} style={{background:G.glass2,border:"none",width:26,height:26,borderRadius:13,color:G.dim,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{stack.items.map((item,i)=>
          <span key={i} style={{background:`${G.purple}12`,color:G.sub,borderRadius:8,padding:"3px 8px",fontSize:11}}>{item.name}{item.dosage?` ${item.dosage}`:""}</span>
        )}</div>
      </Glass>)}
    </div>}

    {Object.keys(freq).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([n,c])=><span key={n} style={{background:`${G.purple}15`,color:G.purple,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,border:`1px solid ${G.purple}25`}}>{n}({c})</span>)}</div>}
  </Section>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <span style={{fontSize:13,fontWeight:600,color:G.dim}}>Today</span>
      {tS.length>0&&<Btn onClick={()=>setStackM(true)} v="ghost" sx={{fontSize:11,padding:"4px 10px",color:G.purple}}>Save as Stack</Btn>}
    </div>
    {tS.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>None logged</div>:tS.map(s=><EI key={s.id} primary={s.name} secondary={`${s.timing}${s.dosage?` · ${s.dosage}`:""}`} color={G.purple} onDelete={()=>del(s.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log Supplement"><Fld label="Supp" opts={SUPP_LIST} value={f.name} set={v=>sf({...f,name:v})}/><Fld label="Dose" value={f.dosage} set={v=>sf({...f,dosage:v})} ph="e.g. 5g"/><Fld label="Timing" opts={["Morning","Pre-workout","Post-workout","With meal","Evening","Before bed"]} value={f.timing} set={v=>sf({...f,timing:v})}/><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal>
    <Modal open={stackM} onClose={()=>setStackM(false)} title="Save Stack">
      <div style={{fontSize:12,color:G.dim,marginBottom:12}}>Save today's {tS.length} supplements as a reusable stack for one-tap logging.</div>
      <Fld label="Stack Name" value={stackName} set={setStackName} ph="e.g. Morning Stack"/>
      <div style={{marginBottom:12}}>{tS.map((s,i)=><div key={i} style={{fontSize:12,color:G.sub,padding:"4px 0"}}>{s.name}{s.dosage?` — ${s.dosage}`:""} ({s.timing})</div>)}</div>
      <Btn onClick={saveStack} sx={{width:"100%"}} disabled={!stackName.trim()}>Save Stack</Btn>
    </Modal></div>;
}
// ─── SLEEP ───
function SleepPage({data,setData}){
  const [m,sm]=useState(false);const [showChart,setShowChart]=useState(false);
  const [f,sf]=useState({hours:"",quality:"Good",bedtime:"",wakeTime:"",notes:"",date:td()});
  const add=()=>{if(!f.hours)return;const nd={...data,sleep:[...data.sleep,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};const del=id=>{const nd={...data,sleep:data.sleep.filter(s=>s.id!==id)};setData(nd);sv(nd);};
  const r=data.sleep.slice(-14);const ah=r.length?(r.reduce((s,e)=>s+Number(e.hours),0)/r.length).toFixed(1):"—";
  const imp=data.sleep.filter(s=>s.source==="health_import").slice(-3).reverse();
  const chartData=data.sleep.slice(-14).map(s=>({date:new Date(s.date+"T12:00").toLocaleDateString("en-US",{weekday:"short"}),hours:Number(s.hours),q:s.quality==="Excellent"?4:s.quality==="Good"?3:s.quality==="Fair"?2:1}));
  return <div><Section title="Sleep" action="+ Log" onAction={()=>sm(true)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gPurple}><div style={{fontSize:11,opacity:.8}}>Avg</div><div style={{fontSize:32,fontWeight:800}}>{ah}</div><div style={{fontSize:11,opacity:.7}}>hrs/night</div></GradCard><Glass style={{padding:14,borderRadius:20}}><div style={{fontSize:9,color:G.dim,fontWeight:600}}>Last</div><div style={{fontSize:32,fontWeight:800,color:G.purple}}>{data.sleep.length?data.sleep[data.sleep.length-1].hours:"—"}</div><div style={{fontSize:11,color:G.dim}}>hrs</div></Glass></div>
    {chartData.length>2&&<div style={{marginBottom:16}}>
      <Btn onClick={()=>setShowChart(!showChart)} v="ghost" sx={{fontSize:12,padding:"4px 0",color:G.dim}}>
        {showChart?"Hide":"Show"} Sleep Trend {showChart?"▲":"▼"}
      </Btn>
      {showChart&&<Glass style={{marginTop:8,borderRadius:16,padding:"14px 8px 6px"}}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{fill:G.dim,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#1a1b26",border:`1px solid ${G.glassBorder2}`,borderRadius:12,fontSize:12}} labelStyle={{color:G.txt}}/>
            <Bar dataKey="hours" radius={[4,4,0,0]} name="Hours">
              {chartData.map((entry,i)=><Cell key={i} fill={entry.hours>=7?G.purple:entry.hours>=6?G.orange:G.red}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Glass>}
    </div>}
    {imp.length>0&&<Section title="Sleep Stages">{imp.map(s=><Glass key={s.id} style={{marginBottom:8,padding:14,borderRadius:16}}><div style={{fontSize:11,color:G.dim,marginBottom:6}}>{s.date}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{s.deep!=null&&<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:G.indigo}}>{s.deep}h</div><div style={{fontSize:9,color:G.dim}}>Deep</div></div>}{s.rem!=null&&<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:G.teal}}>{s.rem}h</div><div style={{fontSize:9,color:G.dim}}>REM</div></div>}{s.core!=null&&<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:G.blue}}>{s.core}h</div><div style={{fontSize:9,color:G.dim}}>Core</div></div>}{s.awake!=null&&<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:G.orange}}>{s.awake}h</div><div style={{fontSize:9,color:G.dim}}>Awake</div></div>}</div></Glass>)}</Section>}
    {data.sleep.slice().reverse().slice(0,10).map(s=><EI key={s.id} primary={`${s.hours}hrs · ${s.quality}`} secondary={`${s.date}${s.bedtime?` · ${s.bedtime}→${s.wakeTime}`:""}`} color={G.purple} onDelete={()=>del(s.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log Sleep"><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Fld label="Hours" type="number" value={f.hours} set={v=>sf({...f,hours:v})} step=".25"/><Fld label="Quality" opts={["Excellent","Good","Fair","Poor"]} value={f.quality} set={v=>sf({...f,quality:v})}/><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Bed" type="time" value={f.bedtime} set={v=>sf({...f,bedtime:v})}/></div><div style={{flex:1}}><Fld label="Wake" type="time" value={f.wakeTime} set={v=>sf({...f,wakeTime:v})}/></div></div><Fld label="Notes" type="textarea" value={f.notes} set={v=>sf({...f,notes:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal></div>;
}
// ─── LIFESTYLE ───
function LifePage({data,setData}){
  const [m,sm]=useState(false);const [f,sf]=useState({energy:"7",stress:"4",mood:"Good",steps:"",notes:"",date:td()});
  const add=()=>{const nd={...data,lifestyle:[...data.lifestyle,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};const del=id=>{const nd={...data,lifestyle:data.lifestyle.filter(l=>l.id!==id)};setData(nd);sv(nd);};
  return <div><Section title="Lifestyle" action="+ Log" onAction={()=>sm(true)}/>
    {data.lifestyle.slice().reverse().slice(0,10).map(l=><EI key={l.id} primary={`E:${l.energy}/10 · S:${l.stress}/10 · ${l.mood}`} secondary={`${l.date}${l.steps?` · ${l.steps}steps`:""}`} color={G.teal} onDelete={()=>del(l.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log"><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Slider label="Energy" value={f.energy} set={v=>sf({...f,energy:v})} color={G.moss}/><Slider label="Stress" value={f.stress} set={v=>sf({...f,stress:v})} color={G.red}/><Fld label="Mood" opts={["Excellent","Good","Okay","Low","Bad"]} value={f.mood} set={v=>sf({...f,mood:v})}/><Fld label="Steps" type="number" value={f.steps} set={v=>sf({...f,steps:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal></div>;
}
// ─── BODY ───
function BodyPage({data,setData}){
  const [m,sm]=useState(false);const [showChart,setShowChart]=useState(false);
  const [f,sf]=useState({weight:"",bodyFat:"",chest:"",waist:"",arms:"",thighs:"",cardioDistance:"",cardioDuration:"",date:td()});
  const add=()=>{let v2=null;if(f.cardioDistance&&f.cardioDuration)v2=vo2(Number(f.cardioDistance),Number(f.cardioDuration));const nd={...data,bodyMetrics:[...data.bodyMetrics,{...f,vo2max:v2,id:uid()}]};setData(nd);sv(nd);sm(false);};
  const lb=data.bodyMetrics.length?data.bodyMetrics[data.bodyMetrics.length-1]:null;
  const chartData=data.bodyMetrics.slice(-20).filter(b=>b.weight).map(b=>({date:new Date(b.date+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}),weight:Number(b.weight),bf:b.bodyFat?Number(b.bodyFat):null}));
  return <div><Section title="Body" action="+ Log" onAction={()=>sm(true)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gBlue}><div style={{fontSize:11,opacity:.8}}>Weight</div><div style={{fontSize:32,fontWeight:800}}>{lb?.weight||"—"}</div><div style={{fontSize:11,opacity:.7}}>lbs</div></GradCard><GradCard colors={G.gAmber}><div style={{fontSize:11,opacity:.8}}>VO2</div><div style={{fontSize:32,fontWeight:800}}>{lb?.vo2max||"—"}</div><div style={{fontSize:11,opacity:.7}}>ml/kg</div></GradCard></div>
    {chartData.length>2&&<div style={{marginBottom:16}}>
      <Btn onClick={()=>setShowChart(!showChart)} v="ghost" sx={{fontSize:12,padding:"4px 0",color:G.dim}}>
        {showChart?"Hide":"Show"} Weight Trend {showChart?"▲":"▼"}
      </Btn>
      {showChart&&<Glass style={{marginTop:8,borderRadius:16,padding:"14px 8px 6px"}}>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData}>
            <defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G.blue} stopOpacity={0.3}/><stop offset="95%" stopColor={G.blue} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="date" tick={{fill:G.dim,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:"#1a1b26",border:`1px solid ${G.glassBorder2}`,borderRadius:12,fontSize:12}} labelStyle={{color:G.txt}}/>
            <Area type="monotone" dataKey="weight" stroke={G.blue} fill="url(#wGrad)" strokeWidth={2} dot={{fill:G.blue,r:3}} name="Weight (lbs)"/>
          </AreaChart>
        </ResponsiveContainer>
      </Glass>}
    </div>}
    {lb&&<Glass style={{marginBottom:18,padding:14,borderRadius:16}}><div style={{fontSize:12,fontWeight:600,color:G.dim,marginBottom:8}}>Latest ({lb.date})</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:14}}>{lb.bodyFat&&<div><span style={{color:G.dim}}>BF:</span> <b>{lb.bodyFat}%</b></div>}{lb.chest&&<div><span style={{color:G.dim}}>Chest:</span> <b>{lb.chest}"</b></div>}{lb.waist&&<div><span style={{color:G.dim}}>Waist:</span> <b>{lb.waist}"</b></div>}{lb.arms&&<div><span style={{color:G.dim}}>Arms:</span> <b>{lb.arms}"</b></div>}{lb.thighs&&<div><span style={{color:G.dim}}>Thighs:</span> <b>{lb.thighs}"</b></div>}</div></Glass>}
    <Modal open={m} onClose={()=>sm(false)} title="Log Body"><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Fld label="Weight" type="number" value={f.weight} set={v=>sf({...f,weight:v})} step=".1"/><Fld label="BF%" type="number" value={f.bodyFat} set={v=>sf({...f,bodyFat:v})} step=".1"/><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Chest" type="number" value={f.chest} set={v=>sf({...f,chest:v})}/></div><div style={{flex:1}}><Fld label="Waist" type="number" value={f.waist} set={v=>sf({...f,waist:v})}/></div></div><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Arms" type="number" value={f.arms} set={v=>sf({...f,arms:v})}/></div><div style={{flex:1}}><Fld label="Thighs" type="number" value={f.thighs} set={v=>sf({...f,thighs:v})}/></div></div><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Run mi" type="number" value={f.cardioDistance} set={v=>sf({...f,cardioDistance:v})}/></div><div style={{flex:1}}><Fld label="Time min" type="number" value={f.cardioDuration} set={v=>sf({...f,cardioDuration:v})}/></div></div><Btn onClick={add} sx={{width:"100%"}}>Save</Btn></Modal></div>;
}

// ─── AI INSIGHTS + COACH CHAT ───
function AIPage({data,setData}){
  const intel=useVitalsIntel(data);
  const [loading,setL]=useState(false);const [err,setE]=useState(null);const [tab,setTab]=useState("chat");
  const [chatInput,setChatInput]=useState("");const [chatHistory,setChatHistory]=useState([]);const [chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);

  // Shared context builder for all AI calls
  const buildContext=()=>{
    const mem=data.aiMemory.slice(-12).map(m=>`[${m.date}] ${m.summary}`).join("\n");
    const painH=data.painLog.map(p=>`${p.date}:${p.location}(${p.type},sev:${p.severity})${p.resolved?"[resolved]":"[active]"}`).join("\n");
    const prH=data.prs.slice(-25).map(p=>`${p.date}:${p.exercise} ${p.repMax}@${p.weight}lbs`).join("\n");
    const pwH=data.postWorkout.slice(-14).map(p=>`${p.date}:RPE${p.rpe} Energy${p.energy} ${p.mood}`).join("\n");
    const suppH=[...new Set(data.supplements.map(s=>s.name))].join(", ");
    const hydAvg=intel.avgWater!=null?Math.round(intel.avgWater):0;
    const hrD=data.heartRate.slice(-7).map(h=>`${h.date}:rest${h.resting} HRV:${h.hrv}`).join("\n");
    return {mem,painH,prH,pwH,suppH,hydAvg,hrD};
  };

  const coachPersonality=`You are a knowledgeable, supportive wellness coach — think of yourself as a good training partner who's also well-read on nutrition and recovery. Your tone is:
- Warm and encouraging, never clinical or alarming
- Conversational — talk like a friend, not a textbook
- Specific to the user's actual data — reference their real numbers, not generic advice
- Honest but constructive — if something needs attention, frame it as an opportunity, not a problem
- Concise — get to the point, no filler paragraphs

NEVER use words like: CRITICAL, DEFICIENCY, ALARMING, WARNING, DANGER, SEVERE, URGENT, CONCERNING (in caps or otherwise alarmist framing).
Instead of "CRITICAL PROTEIN DEFICIENCY" say something like "Your protein has been running a bit low — around ${Math.round(intel.avgProt||0)}g vs your ${intel.tgt.protein}g target. An extra shake or some chicken would close that gap."
Instead of "WARNING: Overtraining detected" say "You've been going hard — your body might appreciate a lighter day."

When referencing data, be specific: use actual numbers, dates, and exercise names from their log. Don't generalize.`;

  // Coach personality system prompt
  const buildCoachSys=()=>{
    const ctx=buildContext();
    return `${coachPersonality}

ABOUT THIS PERSON:
${data.profile.name||"User"}, ${data.profile.age||""}yo. Goals: ${(data.profile.goals||[]).join(", ")||"general wellness"}. ${data.profile.allergies?`Allergies/restrictions: ${data.profile.allergies}.`:""} ${data.profile.units||"imperial"} units.
Targets: ${intel.tgt.calories}cal, ${intel.tgt.protein}g protein, ${intel.tgt.water}oz water.
Recovery score: ${intel.recoveryScore!=null?intel.recoveryScore+"/100 ("+intel.recoveryLabel+")":"not enough data yet"}.

CURRENT DATA SNAPSHOT:
Today: ${intel.todayCal}cal, ${intel.todayProt}g protein, ${intel.todayWater}oz water.
7-day averages: ${Math.round(intel.avgCal||0)}cal, ${Math.round(intel.avgProt||0)}g protein, ${Math.round(intel.avgWater||0)}oz water.
Sleep: avg ${intel.avgSleepHrs!=null?intel.avgSleepHrs.toFixed(1):"?"}hrs. Workouts this week: ${intel.workoutsThisWeek}.
${intel.avgRPE!=null?"Avg RPE: "+intel.avgRPE.toFixed(1)+"/10. ":""}${intel.avgStress!=null?"Avg stress: "+intel.avgStress.toFixed(1)+"/10. ":""}
Stale muscle groups (5+ days): ${intel.staleMuscles.join(", ")||"none"}.
Active pains: ${intel.activePains.map(p=>p.location+" ("+p.type+", "+p.severity+"/10)").join(", ")||"none"}.

MEMORY (past analyses):
${ctx.mem||"First session."}
PAIN HISTORY: ${ctx.painH||"None."}
PRs: ${ctx.prH||"None."}
POST-WORKOUT: ${ctx.pwH||"None."}
SUPPLEMENTS: ${ctx.suppH||"None."}
HYDRATION avg: ${ctx.hydAvg}oz/day
HEART RATE: ${ctx.hrD||"None."}

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

  // ── Full Analysis ──
  const gen=async()=>{setL(true);setE(null);try{
    const sys=buildCoachSys()+`\n\nGive a comprehensive but readable analysis. Structure it naturally — don't use headers like "NUTRITION ANALYSIS" or clinical formatting. Instead, flow through what's going well, what could use attention, and 2-3 specific action items. Keep it to about 300 words. Reference their actual numbers.

Cross-reference domains: connect sleep to training performance, nutrition to recovery, hydration to energy, pain to exercise selection. Spot patterns.

End with: [MEMORY]: one-sentence key takeaway for next time.`;
    const payload={recentNutrition:data.nutrition.slice(-28),recentTraining:data.training.slice(-28),recentBody:data.bodyMetrics.slice(-8),recentSleep:data.sleep.slice(-21),recentLifestyle:data.lifestyle.slice(-21)};
    const txt=await callClaude({system:sys,messages:[{role:"user",content:`Here's my recent data — give me your take:\n${JSON.stringify(payload,null,2)}`}]});
    const mM=txt.match(/\[MEMORY\]:?\s*(.+)/);const mN=mM?mM[1].trim():txt.slice(0,120);
    const nd={...data,insights:[...data.insights,{id:uid(),date:td(),text:txt}],aiMemory:[...data.aiMemory,{id:uid(),date:td(),summary:mN}]};setData(nd);sv(nd);
  }catch(e){setE(e.message||"Failed.");}setL(false);};

  // ── Log parser — extracts and executes vitals-log blocks from AI responses ──
  const executeLogBlock=(text)=>{
    const match=text.match(/```vitals-log\s*([\s\S]*?)\s*```/);
    if(!match)return{cleaned:text,count:0};
    let logData;try{logData=JSON.parse(match[1]);}catch{return{cleaned:text,count:0};}
    if(!logData?.entries)return{cleaned:text,count:0};
    let nd={...data};let count=0;const date=td();
    logData.entries.forEach(entry=>{const id=uid();
      if(entry.type==="meal"){nd.nutrition=[...nd.nutrition,{meal:entry.meal||"Lunch",food:entry.food||"",calories:String(entry.calories||0),protein:String(entry.protein||0),carbs:String(entry.carbs||0),fat:String(entry.fat||0),date,id}];count++;}
      if(entry.type==="training"){nd.training=[...nd.training,{type:entry.exerciseType||"Strength",name:entry.name||"",sets:String(entry.sets||""),reps:String(entry.reps||""),weight:String(entry.weight||""),duration:String(entry.duration||""),notes:"",date,id}];count++;}
      if(entry.type==="water"){nd.hydration=[...nd.hydration,{oz:String(entry.oz||16),type:"Water",date,time:new Date().toTimeString().slice(0,5),id}];count++;}
      if(entry.type==="supplement"){nd.supplements=[...nd.supplements,{name:entry.name||"",dosage:entry.dosage||"",timing:entry.timing||"Morning",date,id}];count++;}
      if(entry.type==="sleep"){nd.sleep=[...nd.sleep,{hours:String(entry.hours||""),quality:entry.quality||"Good",bedtime:entry.bedtime||"",wakeTime:entry.wakeTime||"",date,id}];count++;}
      if(entry.type==="body"){nd.bodyMetrics=[...nd.bodyMetrics,{weight:String(entry.weight||""),bodyFat:String(entry.bodyFat||""),date,id}];count++;}
      if(entry.type==="lifestyle"){nd.lifestyle=[...nd.lifestyle,{energy:String(entry.energy||5),stress:String(entry.stress||5),mood:entry.mood||"Good",date,id}];count++;}
      if(entry.type==="pain"){nd.painLog=[...nd.painLog,{location:entry.location||"",type:entry.painType||"Dull/Aching",severity:String(entry.severity||5),resolved:false,date,id}];count++;}
    });
    if(count>0){setData(nd);sv(nd);}
    const cleaned=text.replace(/```vitals-log[\s\S]*?```/g,"").trim()+(count>0?`\n\n✅ Logged ${count} item${count>1?"s":""}!`:"");
    return{cleaned,count};
  };

  // ── Coach Chat ──
  const sendChat=async()=>{if(!chatInput.trim()||chatLoading)return;
    const userMsg={role:"user",content:chatInput};
    const newHistory=[...chatHistory,userMsg];
    setChatHistory(newHistory);setChatInput("");setChatLoading(true);setE(null);
    try{
      const sys=buildCoachSys()+`\n\nThis is a conversation. Answer the user's specific question using their data. Be concise (1-3 short paragraphs max). If they mention food they ate, exercises, sleep, supplements etc — offer to log it or log it directly if they ask. Always be specific, never generic.`;
      const messages=newHistory.slice(-10);
      const txt=await callClaude({system:sys,messages,maxTokens:1000});
      const {cleaned}=executeLogBlock(txt);
      setChatHistory([...newHistory,{role:"assistant",content:cleaned}]);
    }catch(e){setE(e.message||"Failed.");setChatHistory(newHistory);}
    setChatLoading(false);
  };

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatHistory]);

  return <div><Section title="AI Coach"/>
    {/* Recovery + stats bar */}
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {intel.recoveryScore!=null&&<Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}>
        <div style={{fontSize:9,color:G.dim,fontWeight:700}}>Recovery</div>
        <div style={{fontSize:22,fontWeight:800,color:intel.recoveryColor}}>{intel.recoveryScore}</div>
      </Glass>}
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>Analyses</div><div style={{fontSize:22,fontWeight:800,color:G.moss}}>{data.insights.length}</div></Glass>
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>Memory</div><div style={{fontSize:22,fontWeight:800,color:G.purple}}>{data.aiMemory.length}</div></Glass>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:8,marginBottom:18}}>{[["chat","💬 Coach"],["gen","📊 Analyze"],["hist","History"],["mem","Memory"]].map(([k,l])=><Btn key={k} onClick={()=>setTab(k)} v={tab===k?"primary":"secondary"} sx={{flex:1,padding:10,fontSize:12}}>{l}</Btn>)}</div>

    {!hasApiKey()&&<Glass style={{marginBottom:14,padding:14,borderRadius:16}}><div style={{fontSize:13,color:G.orange,fontWeight:600}}>Add your API key in Settings to use AI features</div></Glass>}

    {/* Coach Chat */}
    {tab==="chat"&&<div>
      <Glass style={{borderRadius:20,padding:0,overflow:"hidden",marginBottom:12}}>
        {/* Chat messages */}
        <div style={{maxHeight:360,overflowY:"auto",padding:"16px 14px 8px"}}>
          {chatHistory.length===0&&<div style={{textAlign:"center",padding:"24px 12px",color:G.dim}}>
            <div style={{fontSize:28,marginBottom:10}}>💬</div>
            <div style={{fontSize:14,fontWeight:600,color:G.sub,marginBottom:6}}>Ask your coach anything</div>
            <div style={{fontSize:12,lineHeight:1.5}}>Try: "Should I train today?" or "What should I eat for dinner?" or "Why am I so tired lately?"</div>
          </div>}
          {chatHistory.map((msg,i)=><div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
              background:msg.role==="user"?`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`:G.glass2,
              color:msg.role==="user"?"#fff":G.sub,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {msg.content}
            </div>
          </div>)}
          {chatLoading&&<div style={{display:"flex",justifyContent:"flex-start",marginBottom:10}}>
            <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:G.glass2,color:G.dim,fontSize:13}}>Thinking...</div>
          </div>}
          <div ref={chatEndRef}/>
        </div>
        {/* Input */}
        <div style={{display:"flex",gap:8,padding:"8px 12px 12px",borderTop:`1px solid ${G.glassBorder}`}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}}
            placeholder="Ask your coach..." style={{flex:1,background:G.glass,border:`1px solid ${G.glassBorder}`,borderRadius:20,padding:"10px 16px",color:G.txt,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{background:`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,border:"none",borderRadius:20,width:44,height:44,color:"#fff",fontSize:18,cursor:"pointer",opacity:chatLoading||!chatInput.trim()?.5:1,display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
        </div>
      </Glass>
      {/* Quick questions */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {["Should I train today?","I had chicken rice and avocado for lunch","What should I eat for dinner?","Build me a push workout","Log 7.5 hours of sleep, good quality","How's my recovery looking?"].map((q,i)=>
          <button key={i} onClick={()=>{setChatInput(q);}} style={{background:G.glass,border:`1px solid ${G.glassBorder}`,borderRadius:20,padding:"6px 12px",color:G.sub,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{q}</button>)}
      </div>
    </div>}

    {/* Full Analysis */}
    {tab==="gen"&&<div><div style={{textAlign:"center",marginBottom:18}}><Btn onClick={gen} disabled={loading} sx={{padding:"14px 32px",fontSize:15,borderRadius:16}}>{loading?"Analyzing...":"⬡ Full Analysis"}</Btn>{err&&<div style={{color:G.red,fontSize:12,marginTop:6}}>{err}</div>}</div>
      {data.insights.length>0&&<Glass style={{borderRadius:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,fontWeight:700,color:G.moss}}>⬡ Latest</span><span style={{fontSize:11,color:G.dim}}>{data.insights[data.insights.length-1].date}</span></div><div style={{fontSize:13,color:G.sub,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{data.insights[data.insights.length-1].text}</div></Glass>}</div>}
    {tab==="hist"&&data.insights.slice().reverse().map(i=><Glass key={i.id} style={{marginBottom:10,borderRadius:16}}><div style={{fontSize:11,color:G.dim,marginBottom:6}}>{i.date}</div><div style={{fontSize:13,color:G.sub,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{i.text}</div></Glass>)}
    {tab==="mem"&&<div>{data.aiMemory.slice().reverse().map(m=><Glass key={m.id} style={{marginBottom:6,borderRadius:14}}><div style={{fontSize:11,color:G.dim}}>{m.date}</div><div style={{fontSize:13,color:G.sub,marginTop:2}}>{m.summary}</div></Glass>)}</div>}
  </div>;
}
// ─── WORKOUT BUILDER ───
function WorkoutPage({data,setData}){
  const intel=useVitalsIntel(data);
  const [loading,setL]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const [f,sf]=useState({focus:"Full Body",duration:"60",equipment:"Full Gym",intensity:"Moderate",notes:""});
  const [saved,setSaved]=useState([]);const [expandedId,setExpandedId]=useState(null);const [logLoading,setLogLoading]=useState(null);const [logSuccess,setLogSuccess]=useState(null);

  useEffect(()=>{(async()=>{try{const s=await getData("vitals-workouts");if(s)setSaved(s);}catch{}})();},[]);

  const generate=async()=>{
    setL(true);setErr(null);setResult(null);
    try{
      const painH=data.painLog.filter(p=>!p.resolved).map(p=>`${p.location}(${p.type},sev:${p.severity}/10)`).join(", ");
      const prH=data.prs.slice(-15).map(p=>`${p.exercise} ${p.repMax}@${p.weight}lbs`).join(", ");
      const recentTrain=data.training.slice(-14).map(t=>`${t.date}:${t.name}${t.type==="Strength"?` ${t.sets}x${t.reps}@${t.weight}`:""}`).join("\n");
      const recentPW=data.postWorkout.slice(-5).map(p=>`RPE:${p.rpe} Energy:${p.energy} Pump:${p.pump} ${p.mood}${p.soreness?` Sore:${p.soreness}`:""}`).join("\n");
      const sleepAvg=data.sleep.length?(data.sleep.slice(-7).reduce((s,e)=>s+Number(e.hours),0)/Math.min(data.sleep.length,7)).toFixed(1):"unknown";

      const sys=`You are a knowledgeable, supportive strength & conditioning coach building a workout for ${data.profile.name||"the user"} — ${data.profile.age||""}yo, goals: ${(data.profile.goals||[]).join(", ")||"general fitness"}. ${data.profile.allergies?`Dietary restrictions: ${data.profile.allergies} (relevant for pre/post workout nutrition tips).`:""}

Be encouraging and specific — use their actual numbers and names. Never use alarming language.

RECOVERY STATUS:
Recovery score: ${intel.recoveryScore!=null?intel.recoveryScore+"/100 ("+intel.recoveryLabel+")":"unknown"}
${intel.recoveryScore!=null&&intel.recoveryScore<50?"Their recovery is on the lower side — suggest scaling back intensity or volume.":""}

MUSCLE FRESHNESS (days since last trained):
${Object.entries(intel.muscleFreshness).map(([g,v])=>`${g}: ${v.days<999?v.days+"d ago":"not tracked"}`).join(", ")}
Stale groups (good to hit): ${intel.staleMuscles.join(", ")||"none"}
Recently trained (might need rest): ${intel.freshMuscles.join(", ")||"none"}

CURRENT STATUS:
Active pains: ${painH||"None"}
Recent PRs: ${prH||"None"}
Recent training (last 2 weeks): ${recentTrain||"None logged"}
Recent post-workout feedback: ${recentPW||"None"}
Average sleep: ${sleepAvg}hrs/night
Supplement stack: ${[...new Set(data.supplements.map(s=>s.name))].join(", ")||"None"}

WORKOUT REQUEST:
Focus: ${f.focus}
Duration: ${f.duration} minutes
Equipment: ${f.equipment}
Intensity: ${f.intensity}
${f.notes?`Notes: ${f.notes}`:""}

RULES:
- AVOID exercises that would aggravate active pain points
- PRIORITIZE stale muscle groups when the focus allows
- Program based on their actual PRs and recent training volume
- If RPE has been consistently high or recovery is low, suggest lighter work
- Include specific weights based on PR data (e.g. "Squat 4x6 @ 225lbs" not "Squat 4x6 @ moderate weight")
- Include warm-up, main work, and cool-down
- Add explosive/plyometric work where appropriate given their goals
- Give pre and post workout nutrition suggestions${data.profile.allergies?` (avoid: ${data.profile.allergies})`:""} 
- Format clearly with exercise name, sets, reps, weight/intensity, and rest periods
- Be encouraging and specific — use a coaching tone, not a clinical one`;

      const txt=await callClaude({system:sys,messages:[{role:"user",content:"Generate my workout."}],maxTokens:1500});
      setResult(txt);
    }catch(e){setErr(e.message||"Failed.");}
    setL(false);
  };

  const saveWorkout=async()=>{
    if(!result)return;
    const entry={id:uid(),date:td(),focus:f.focus,duration:f.duration,intensity:f.intensity,equipment:f.equipment,workout:result};
    const ns=[entry,...saved].slice(0,20);
    setSaved(ns);
    try{await setStorageData("vitals-workouts",ns);}catch{}
  };

  const deleteSaved=async(id)=>{
    const ns=saved.filter(w=>w.id!==id);
    setSaved(ns);
    if(expandedId===id)setExpandedId(null);
    try{await setStorageData("vitals-workouts",ns);}catch{}
  };

  // Parse workout text into training entries using AI
  const logWorkoutToTraining=async(workoutText,workoutDate)=>{
    setLogLoading(workoutDate);setLogSuccess(null);
    try{
      const txt=await callClaude({system:`Parse this workout plan into individual exercises. Return ONLY a JSON array of exercises. For strength exercises include sets, reps, and weight. For cardio/plyo include duration.
Format: [{"name":"Exercise Name","type":"Strength"|"Cardio"|"Plyometrics"|"Mobility","sets":"N","reps":"N","weight":"N","duration":"N","notes":"any relevant notes like rest period or tempo"}]
- Extract EVERY exercise from the workout (skip warm-up stretches and cool-down stretches unless they are specific exercises)
- For weights, use the number only (no "lbs")
- If no specific weight is given, leave weight empty
- Include warm-up sets if they have specific weights
- Be thorough — capture every working set`,
        messages:[{role:"user",content:`Parse into exercises:\n${workoutText}`}]});
      const exercises=JSON.parse(txt.replace(/```json|```/g,"").trim());
      if(!Array.isArray(exercises)||exercises.length===0)throw new Error("No exercises parsed");
      const entries=exercises.map(ex=>({
        id:uid(),type:ex.type||"Strength",name:ex.name,sets:String(ex.sets||""),reps:String(ex.reps||""),
        weight:String(ex.weight||""),duration:String(ex.duration||""),distance:"",notes:ex.notes||"",date:workoutDate||td()
      }));
      const nd={...data,training:[...data.training,...entries]};
      setData(nd);sv(nd);
      setLogSuccess(workoutDate);setTimeout(()=>setLogSuccess(null),3000);
    }catch(e){setErr("Failed to parse workout: "+(e.message||""));}
    setLogLoading(null);
  };

  return <div>
    <Section title="Workout Builder">
      <Glass glow={`radial-gradient(circle,${G.amber}20,transparent 70%)`} style={{marginBottom:16,borderRadius:24,padding:24}}>
        <div style={{fontSize:15,color:G.txt,fontWeight:700,marginBottom:4}}>AI-Powered Programming</div>
        <div style={{fontSize:12,color:G.dim,lineHeight:1.5,marginBottom:16}}>Builds workouts using your PRs, pain points, recent training volume, recovery data, and sleep quality.</div>
        <Fld label="Focus" opts={["Full Body","Upper Body","Lower Body","Push","Pull","Legs","Chest & Triceps","Back & Biceps","Shoulders","Arms","Core","Explosive/Plyo","Active Recovery"]} value={f.focus} set={v=>sf({...f,focus:v})}/>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}><Fld label="Duration (min)" opts={["30","45","60","75","90"]} value={f.duration} set={v=>sf({...f,duration:v})}/></div>
          <div style={{flex:1}}><Fld label="Intensity" opts={["Light","Moderate","High","Max Effort"]} value={f.intensity} set={v=>sf({...f,intensity:v})}/></div>
        </div>
        <Fld label="Equipment" opts={["Full Gym","Dumbbells Only","Barbell & Rack","Bodyweight","Home Gym","Cables & Machines"]} value={f.equipment} set={v=>sf({...f,equipment:v})}/>
        <Fld label="Notes (optional)" type="textarea" value={f.notes} set={v=>sf({...f,notes:v})} ph="e.g. Want to hit heavy squats today, feeling good"/>
        <Btn onClick={generate} disabled={loading} sx={{width:"100%",padding:14,fontSize:15}}>{loading?"Building workout...":"⚡ Generate Workout"}</Btn>
      </Glass>
    </Section>

    {err&&<Glass style={{marginBottom:14,borderRadius:16}}><div style={{color:G.red,fontSize:13}}>{err}</div></Glass>}

    {result&&<Section title="Your Workout">
      <Glass style={{borderRadius:20,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:14,fontWeight:700,color:G.txt}}>{f.focus}</div><div style={{fontSize:11,color:G.dim}}>{f.duration}min · {f.intensity} · {f.equipment}</div></div>
          <div style={{display:"flex",gap:6}}>
            <Btn onClick={saveWorkout} v="secondary" sx={{fontSize:11,padding:"6px 12px"}}>💾 Save</Btn>
          </div>
        </div>
        <div style={{fontSize:13,color:G.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{result}</div>
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${G.glassBorder}`}}>
          <Btn onClick={()=>logWorkoutToTraining(result,td())} disabled={logLoading===td()} sx={{width:"100%",padding:12}} v="primary">
            {logLoading===td()?"⏳ Parsing exercises...":logSuccess===td()?"✓ Logged to Training!":"📋 Log All Exercises to Training"}
          </Btn>
        </div>
      </Glass>
    </Section>}

    {saved.length>0&&<Section title={`Saved Workouts (${saved.length})`}>
      {saved.map(w=>{
        const isExpanded=expandedId===w.id;
        return <Glass key={w.id} style={{marginBottom:10,borderRadius:16,cursor:"pointer"}} onClick={()=>setExpandedId(isExpanded?null:w.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,fontWeight:700,color:G.txt}}>{w.focus}</span>
                <span style={{fontSize:10,color:G.dim,background:G.glass2,padding:"2px 8px",borderRadius:8}}>{w.duration}min</span>
                {w.intensity&&<span style={{fontSize:10,color:G.amber,background:`${G.amber}15`,padding:"2px 8px",borderRadius:8}}>{w.intensity}</span>}
              </div>
              <div style={{fontSize:11,color:G.dim,marginTop:4}}>{w.date}{w.equipment?` · ${w.equipment}`:""}</div>
            </div>
            <span style={{fontSize:16,color:G.dim,transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
          </div>
          {isExpanded&&<div onClick={e=>e.stopPropagation()}>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${G.glassBorder}`,fontSize:13,color:G.sub,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:400,overflow:"auto"}}>{w.workout}</div>
            <div style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${G.glassBorder}`}}>
              <Btn onClick={()=>logWorkoutToTraining(w.workout,w.date)} disabled={logLoading===w.date} sx={{flex:1,padding:10,fontSize:12}} v="primary">
                {logLoading===w.date?"Parsing...":logSuccess===w.date?"✓ Logged!":"📋 Log to Training"}
              </Btn>
              <Btn onClick={()=>deleteSaved(w.id)} v="danger" sx={{padding:"10px 14px",fontSize:12}}>🗑</Btn>
            </div>
          </div>}
        </Glass>;
      })}
    </Section>}
  </div>;
}
// ─── FEEDBACK ───
function FeedbackPage({data,setData}){
  const WEBHOOK_URL=""; // Set your webhook URL here (Slack, Zapier, Make, etc.)
  const [f,sf]=useState({type:"Bug",message:"",name:"",rating:"5"});
  const [sent,setSent]=useState(false);const [sending,setSending]=useState(false);const [showHist,setShowHist]=useState(false);
  const fb=data.feedback||[];

  const send=async()=>{if(!f.message.trim())return;setSending(true);
    const entry={...f,id:uid(),date:td(),time:new Date().toTimeString().slice(0,5),device:navigator.userAgent.slice(0,80)};
    // Try webhook if configured
    if(WEBHOOK_URL){try{await fetch(WEBHOOK_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(entry)});}catch(e){console.warn("Webhook failed, saved locally:",e);}}
    // Always save locally
    const nd={...data,feedback:[...fb,entry]};setData(nd);sv(nd);
    setSent(true);setSending(false);sf({type:"Bug",message:"",name:"",rating:"5"});setTimeout(()=>setSent(false),3000);};

  const exportFeedback=()=>{const b=new Blob([JSON.stringify(fb,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`vitals-feedback-${td()}.json`;a.click();};

  return <div><Section title="Feedback"/>
    <Glass glow={`radial-gradient(circle,${G.blue}20,transparent 70%)`} style={{marginBottom:16,borderRadius:20,padding:20}}>
      <div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:4}}>Help Us Improve</div>
      <div style={{fontSize:12,color:G.dim,lineHeight:1.5,marginBottom:16}}>Found a bug? Have a feature idea? Your feedback shapes what we build next.</div>
      <Fld label="Your Name (optional)" value={f.name} set={v=>sf({...f,name:v})} ph="Anonymous"/>
      <Fld label="Type" opts={["Bug","Feature Request","UI/Design","Performance","Other"]} value={f.type} set={v=>sf({...f,type:v})}/>
      <Slider label="Overall Rating" value={f.rating} set={v=>sf({...f,rating:v})} min={1} max={10} color={Number(f.rating)>=7?G.moss:Number(f.rating)>=4?G.orange:G.red}/>
      <Fld label="Message" type="textarea" value={f.message} set={v=>sf({...f,message:v})} ph="What happened? What would you like to see?"/>
      <Btn onClick={send} disabled={sending||!f.message.trim()} sx={{width:"100%",padding:14}}>
        {sending?"Sending...":sent?"✓ Sent! Thank you":"Send Feedback"}
      </Btn>
    </Glass>
    {fb.length>0&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Btn onClick={()=>setShowHist(!showHist)} v="ghost" sx={{fontSize:12,padding:"4px 0",color:G.dim}}>{showHist?"Hide":"Show"} History ({fb.length})</Btn>
        <Btn onClick={exportFeedback} v="ghost" sx={{fontSize:11,padding:"4px 10px",color:G.blue}}>Export All</Btn>
      </div>
      {showHist&&fb.slice().reverse().map(item=><Glass key={item.id} style={{marginBottom:6,borderRadius:14,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:700,color:item.type==="Bug"?G.red:item.type==="Feature Request"?G.moss:G.blue}}>{item.type}</span>
          <span style={{fontSize:10,color:G.dim}}>{item.date} {item.time}</span>
        </div>
        <div style={{fontSize:12,color:G.sub,lineHeight:1.5}}>{item.message}</div>
        {item.name&&<div style={{fontSize:10,color:G.dim,marginTop:4}}>— {item.name} · Rating: {item.rating}/10</div>}
      </Glass>)}
    </div>}
  </div>;
}
// ─── SETTINGS ───
function SettingsPage({data,setData}){
  const [key,setKey]=useState(getApiKey());const [saved,setSaved]=useState(false);const fr=useRef();
  const [profileOpen,setProfileOpen]=useState(false);
  const [pf,setPf]=useState({...data.profile});

  // Sync pf when data.profile changes
  useEffect(()=>{setPf({...data.profile});},[data.profile]);

  const saveKey=()=>{setApiKey(key);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const saveProfile=()=>{const nd={...data,profile:{...pf,targets:{calories:Number(pf.targets?.calories)||2800,protein:Number(pf.targets?.protein)||180,water:Number(pf.targets?.water)||100}}};setData(nd);sv(nd);setProfileOpen(false);};
  const exp=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`vitals-${td()}.json`;a.click();};
  const imp=async(file)=>{try{const t=await file.text();const d=JSON.parse(t);const nd={...DEF,...d,profile:{...DEF.profile,...d?.profile,targets:{...DEF.profile.targets,...d?.profile?.targets}}};setData(nd);sv(nd);alert("Done!");}catch(e){alert("Error: "+e.message);}};
  const p=data.profile;
  const GOAL_OPTS=["Muscle Mass","Strength","Explosiveness","Fat Loss","Endurance","Flexibility","General Health","Athletic Performance"];

  return <div><Section title="Settings"/>
    {/* Profile Card */}
    <Glass glow={`radial-gradient(circle,${G.moss}15,transparent 70%)`} style={{marginBottom:16,borderRadius:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:700,color:G.txt}}>Profile</div>
        <Btn onClick={()=>setProfileOpen(true)} v="ghost" sx={{fontSize:12,padding:"4px 12px"}}>Edit</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
        <div><span style={{color:G.dim}}>Name:</span> <span style={{color:G.txt,fontWeight:600}}>{p.name||"Not set"}</span></div>
        <div><span style={{color:G.dim}}>Age:</span> <span style={{color:G.txt,fontWeight:600}}>{p.age||"—"}</span></div>
        <div><span style={{color:G.dim}}>Allergies:</span> <span style={{color:G.txt,fontWeight:600}}>{p.allergies||"None"}</span></div>
        <div><span style={{color:G.dim}}>Units:</span> <span style={{color:G.txt,fontWeight:600}}>{p.units||"imperial"}</span></div>
      </div>
      {p.goals?.length>0&&<div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:4}}>
        {p.goals.map((g,i)=><span key={i} style={{background:`${G.moss}15`,color:G.moss,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:600}}>{g}</span>)}
      </div>}
    </Glass>

    {/* Targets Card */}
    <Glass style={{marginBottom:16,borderRadius:20}}>
      <div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:12}}>Daily Targets</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{l:"Calories",v:p.targets?.calories||2800,c:G.moss},{l:"Protein",v:(p.targets?.protein||180)+"g",c:G.orange},{l:"Water",v:(p.targets?.water||100)+"oz",c:G.teal}].map((t,i)=>
          <div key={i} style={{textAlign:"center",background:G.glass,borderRadius:12,padding:"10px 6px"}}>
            <div style={{fontSize:20,fontWeight:800,color:t.c}}>{t.v}</div>
            <div style={{fontSize:10,color:G.dim,fontWeight:600}}>{t.l}</div>
          </div>)}
      </div>
    </Glass>

    {/* API Key */}
    <Glass style={{marginBottom:16,borderRadius:18}}><div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:12}}>API Key</div><div style={{fontSize:12,color:G.dim,marginBottom:10}}>Required for AI features. Stored on device only.</div><Fld type="password" value={key} set={setKey} ph="sk-ant-..."/><div style={{display:"flex",gap:8}}><Btn onClick={saveKey} sx={{flex:1}}>Save</Btn>{saved&&<div style={{display:"flex",alignItems:"center",color:G.moss,fontSize:13,fontWeight:600}}>✓</div>}</div></Glass>

    {/* Data */}
    <Glass style={{marginBottom:16,borderRadius:18}}><div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:12}}>Data</div><div style={{display:"flex",gap:8,marginBottom:8}}><Btn onClick={exp} v="secondary" sx={{flex:1}}>Export</Btn><Btn onClick={()=>fr.current?.click()} v="secondary" sx={{flex:1}}>Import</Btn><input ref={fr} type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])imp(e.target.files[0]);}}/></div><Btn onClick={()=>{if(confirm("Delete all data? This cannot be undone.")){setData(DEF);sv(DEF);}}} v="danger" sx={{width:"100%"}}>Clear All Data</Btn></Glass>
    <Glass style={{borderRadius:18}}><div style={{fontSize:12,color:G.dim,lineHeight:1.6}}>Vitals v7 · IndexedDB · Claude AI<br/>Profile · Targets · Stacks · Feedback<br/>Data on device. AI → Anthropic.</div></Glass>

    {/* Profile Editor Modal */}
    <Modal open={profileOpen} onClose={()=>setProfileOpen(false)} title="Edit Profile">
      <Fld label="Name" value={pf.name||""} set={v=>setPf({...pf,name:v})} ph="Your name"/>
      <Fld label="Age" type="number" value={pf.age||""} set={v=>setPf({...pf,age:v})}/>
      <Fld label="Allergies / Dietary Restrictions" value={pf.allergies||""} set={v=>setPf({...pf,allergies:v})} ph="e.g. Dairy, Gluten, Vegan"/>
      <Fld label="Units" opts={["imperial","metric"]} value={pf.units||"imperial"} set={v=>setPf({...pf,units:v})}/>

      <div style={{fontSize:13,fontWeight:600,color:G.sub,marginBottom:8,marginTop:8}}>Goals</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {GOAL_OPTS.map(g=>{const active=(pf.goals||[]).includes(g);return <button key={g} onClick={()=>{const goals=active?(pf.goals||[]).filter(x=>x!==g):[...(pf.goals||[]),g];setPf({...pf,goals});}}
          style={{background:active?`${G.moss}20`:G.glass,border:`1px solid ${active?G.moss+"40":G.glassBorder}`,borderRadius:20,padding:"6px 14px",color:active?G.moss:G.dim,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{active?"✓ ":""}{g}</button>;})}
      </div>

      <div style={{fontSize:13,fontWeight:600,color:G.sub,marginBottom:8}}>Daily Targets</div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Calories" type="number" value={pf.targets?.calories||""} set={v=>setPf({...pf,targets:{...pf.targets,calories:v}})}/></div>
        <div style={{flex:1}}><Fld label="Protein (g)" type="number" value={pf.targets?.protein||""} set={v=>setPf({...pf,targets:{...pf.targets,protein:v}})}/></div>
      </div>
      <Fld label="Water (oz)" type="number" value={pf.targets?.water||""} set={v=>setPf({...pf,targets:{...pf.targets,water:v}})}/>

      <Btn onClick={saveProfile} sx={{width:"100%",marginTop:8}}>Save Profile</Btn>
    </Modal>
  </div>;
}
// ─── TOAST ───
function Toast({message,color,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:1200,background:color||G.moss,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",animation:"toastIn .3s ease",pointerEvents:"none"}}>{message}</div>;
}
// ─── MAIN ───
export default function App(){
  const [data,setData]=useState(DEF);const [page,setPage]=useState("home");const [ok,setOk]=useState(false);
  const [toast,setToast]=useState(null);
  useEffect(()=>{(async()=>{const s=await ld();if(s)setData({...DEF,...s,
    profile:{...DEF.profile,...s?.profile,targets:{...DEF.profile.targets,...s?.profile?.targets}},
    prs:s?.prs||[],painLog:s?.painLog||[],postWorkout:s?.postWorkout||[],aiMemory:s?.aiMemory||[],
    hydration:s?.hydration||[],supplements:s?.supplements||[],healthImports:s?.healthImports||[],
    heartRate:s?.heartRate||[],ecg:s?.ecg||[],bloodOx:s?.bloodOx||[],respiratory:s?.respiratory||[],
    stepsData:s?.stepsData||[],watchWorkouts:s?.watchWorkouts||[],suppStacks:s?.suppStacks||[],feedback:s?.feedback||[]});setOk(true);})();},[]);
  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";l.rel="stylesheet";document.head.appendChild(l);
    // Add toast animation
    const st=document.createElement("style");st.textContent=`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;document.head.appendChild(st);},[]);

  const quickLog=(type)=>{
    if(type==="water"){
      const nd={...data,hydration:[...data.hydration,{oz:"16",type:"Water",date:td(),time:new Date().toTimeString().slice(0,5),id:uid()}]};
      setData(nd);sv(nd);setToast({message:"💧 +16oz logged",color:G.teal});
      try{navigator.vibrate?.(50);}catch{}
    }
  };

  if(!ok)return <div style={{background:G.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:G.moss,fontSize:24,fontWeight:800}}>Vitals</div></div>;
  const pages={home:<HomePage data={data} go={setPage} onQuickLog={quickLog}/>,nutr:<NutrPage data={data} setData={setData}/>,train:<TrainPage data={data} setData={setData}/>,hydra:<HydraPage data={data} setData={setData}/>,supps:<SuppsPage data={data} setData={setData}/>,sleep:<SleepPage data={data} setData={setData}/>,life:<LifePage data={data} setData={setData}/>,health:<HealthPage data={data} setData={setData}/>,body:<BodyPage data={data} setData={setData}/>,ai:<AIPage data={data} setData={setData}/>,workout:<WorkoutPage data={data} setData={setData}/>,feedback:<FeedbackPage data={data} setData={setData}/>,settings:<SettingsPage data={data} setData={setData}/>};
  return <div style={{background:G.bg,minHeight:"100vh",fontFamily:"'Inter',sans-serif",color:G.txt,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:80}}>
    <div style={{padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"center",position:"sticky",top:0,zIndex:100,background:`${G.bg}dd`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
      <div style={{fontSize:16,fontWeight:800,color:G.txt,letterSpacing:-.5}}>Vitals</div>
    </div>
    <div style={{padding:"12px 20px 40px"}}>{pages[page]}</div>
    <BottomNav current={page} onNav={setPage}/>
    {toast&&<Toast message={toast.message} color={toast.color} onDone={()=>setToast(null)}/>}
  </div>;
}
