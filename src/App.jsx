import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from "recharts";
import { getData, setData as setStorageData } from "./storage.js";
import { callClaude, getApiKey, setApiKey, hasApiKey } from "./api.js";

const SK="vitals-v5";const td=()=>new Date().toISOString().split("T")[0];const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);const hr=()=>new Date().getHours();
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
  {id:"ai",label:"AI Insights",icon:"🧠",color:G.moss},
  {id:"workout",label:"Workout Builder",icon:"⚡",color:G.amber},
  {id:"settings",label:"Settings",icon:"⚙️",color:G.sub},
];

const DEF={
  profile:{name:"Tristan",age:25,dairy:true,goals:["Muscle Mass","Explosiveness","Strength"],units:"imperial"},
  nutrition:[],training:[],postWorkout:[],prs:[],painLog:[],bodyMetrics:[],sleep:[],lifestyle:[],
  hydration:[],supplements:[],healthImports:[],heartRate:[],ecg:[],bloodOx:[],respiratory:[],stepsData:[],watchWorkouts:[],
  insights:[],aiMemory:[],
};
function vo2(d,t){const m=d*1609.34;return Math.round(((m*(12/t)-504.9)/44.73)*10)/10;}

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
    {id:"_track",icon:"📋",label:"Menu"},
    {id:"health",icon:"❤️",label:"Import"},
    {id:"ai",icon:"🧠",label:"AI"},
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
function HomePage({data,go}){
  const tn=data.nutrition.filter(n=>n.date===td());const tc=tn.reduce((s,n)=>s+(Number(n.calories)||0),0);const tp=tn.reduce((s,n)=>s+(Number(n.protein)||0),0);
  const todayH=data.hydration.filter(h=>h.date===td()).reduce((s,h)=>s+(Number(h.oz)||0),0);
  const rs=data.sleep.slice(-7);const avgSleep=rs.length?(rs.reduce((s,e)=>s+Number(e.hours),0)/rs.length).toFixed(1):"—";
  const lb=data.bodyMetrics.length?data.bodyMetrics[data.bodyMetrics.length-1]:null;
  const wk=data.training.filter(t=>{const d=new Date(t.date);const w=new Date();w.setDate(w.getDate()-7);return d>=w;}).length;
  const latestHR=data.heartRate.length?data.heartRate[data.heartRate.length-1]:null;
  const latestSpO2=data.bloodOx.length?data.bloodOx[data.bloodOx.length-1]:null;
  const latestSteps=data.stepsData.length?data.stepsData[data.stepsData.length-1]:null;
  const ap=data.painLog.filter(p=>!p.resolved).length;

  return <div style={{position:"relative"}}>
    {/* Ambient background glows */}
    <div style={{position:"absolute",top:-40,left:-60,width:300,height:300,background:"radial-gradient(circle,rgba(45,211,111,.15) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"absolute",top:200,right:-80,width:300,height:300,background:"radial-gradient(circle,rgba(180,142,255,.12) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"absolute",top:500,left:-40,width:250,height:250,background:"radial-gradient(circle,rgba(34,211,238,.1) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

    <div style={{position:"relative",zIndex:1}}>
      {/* Hero greeting */}
      <div style={{marginBottom:28,paddingTop:8}}>
        <div style={{fontSize:13,color:G.dim,fontWeight:500}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <div style={{fontSize:34,fontWeight:800,color:G.txt,marginTop:4,letterSpacing:-.5,lineHeight:1.1}}>
          {hr()<12?"Good Morning":"Good Afternoon"}<span style={{color:G.moss}}>.</span>
        </div>
      </div>

      {/* Hero rings card with glow */}
      <Glass glow="radial-gradient(circle at 30% 50%, rgba(45,211,111,.3), rgba(255,159,67,.2) 50%, rgba(34,211,238,.2) 100%)" style={{marginBottom:16,borderRadius:24,overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0"}}>
          {[{p:Math.round((tc/2800)*100),v:tc,u:"/2800",l:"Calories",c:G.moss,go:"nutr"},
            {p:Math.round((tp/180)*100),v:tp+"g",u:"/180g",l:"Protein",c:G.orange,go:"nutr"},
            {p:Math.round((todayH/100)*100),v:todayH,u:"/100oz",l:"Water",c:G.teal,go:"hydra"}].map((r,i)=>
            <div key={i} style={{textAlign:"center",cursor:"pointer"}} onClick={()=>go(r.go)}>
              <Ring pct={r.p} size={92} stroke={9} color={r.c} trackColor={`${r.c}25`}>
                <div style={{fontSize:21,fontWeight:800,color:r.c}}>{r.v}</div>
                <div style={{fontSize:8,color:G.dim,fontWeight:600}}>{r.u}</div>
              </Ring>
              <div style={{fontSize:11,fontWeight:700,color:r.c,marginTop:8,letterSpacing:.5}}>{r.l}</div>
            </div>)}
        </div>
      </Glass>

      {/* Vitals grid - staggered */}
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

      {/* Health vitals strip */}
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

      {/* Quick status pills */}
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

      {/* Latest insight */}
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
  const te=data.nutrition.filter(n=>n.date===td());const tc=te.reduce((s,n)=>s+(Number(n.calories)||0),0);const tp=te.reduce((s,n)=>s+(Number(n.protein)||0),0);const tcarb=te.reduce((s,n)=>s+(Number(n.carbs)||0),0);const tf=te.reduce((s,n)=>s+(Number(n.fat)||0),0);
  const add=()=>{if(!f.food)return;const nd={...data,nutrition:[...data.nutrition,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);sf({meal:"Breakfast",food:"",calories:"",protein:"",carbs:"",fat:"",date:td()});};
  const del=id=>{const nd={...data,nutrition:data.nutrition.filter(n=>n.id!==id)};setData(nd);sv(nd);};
  const snap=async(file)=>{sAL(true);sAR(null);try{const b64=await toB64(file);const bd=b64.split(",")[1];
    const txt=await callClaude({system:"Nutrition analyst. Accurate macros. Pure JSON. Flag dairy.",messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:bd}},{type:"text",text:`Food photo. DAIRY ALLERGY. JSON: {"food":"desc","calories":N,"protein":N,"carbs":N,"fat":N,"dairy_warning":bool,"notes":"obs"}`}]}]});
    const p=JSON.parse(txt.replace(/```json|```/g,"").trim());sAR(p);sf({...f,food:p.food||"",calories:String(p.calories||""),protein:String(p.protein||""),carbs:String(p.carbs||""),fat:String(p.fat||"")});
  }catch(e){sAR({error:e.message||"Failed."});}sAL(false);};
  return <div><Section title="Nutrition" action="+ Manual" onAction={()=>{sAR(null);sm(true);}}>
    <Btn onClick={()=>{sAR(null);fr.current?.click();}} v="secondary" sx={{width:"100%",marginBottom:14,padding:14}}>📸 Snap & Analyze</Btn>
    <input ref={fr} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files[0]){snap(e.target.files[0]);sm(true);}}}/></Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:18}}>
      {[{l:"Kcal",v:tc,c:G.moss},{l:"Prot",v:tp+"g",c:G.orange},{l:"Carb",v:tcarb+"g",c:G.blue},{l:"Fat",v:tf+"g",c:G.purple}].map((x,i)=>
        <Glass key={i} style={{padding:10,borderRadius:14,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:x.c}}>{x.v}</div><div style={{fontSize:9,color:G.dim,fontWeight:600}}>{x.l}</div></Glass>)}
    </div>
    <div style={{fontSize:13,fontWeight:600,color:G.dim,marginBottom:8}}>Today</div>
    {te.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>No meals</div>:te.map(n=><EI key={n.id} primary={n.food} secondary={`${n.meal} · P:${n.protein}g C:${n.carbs}g F:${n.fat}g`} tertiary={n.calories} color={G.moss} onDelete={()=>del(n.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log Meal">
      {aiL&&<div style={{textAlign:"center",padding:20,color:G.moss}}>Analyzing...</div>}
      {aiR?.error&&<Glass style={{marginBottom:14}}><div style={{color:G.red,fontSize:13}}>{aiR.error}</div></Glass>}
      {aiR&&!aiR.error&&<Glass style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:G.moss}}>✓ {aiR.food}</div>{aiR.dairy_warning&&<div style={{fontSize:12,color:G.red,fontWeight:600,marginTop:4}}>⚠ Dairy detected</div>}</Glass>}
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
  const [m,sm]=useState(false);const [f,sf]=useState({oz:"8",type:"Water",date:td(),time:new Date().toTimeString().slice(0,5)});
  const tH=data.hydration.filter(h=>h.date===td());const tot=tH.reduce((s,h)=>s+(Number(h.oz)||0),0);const goal=100;
  const qA=oz=>{const nd={...data,hydration:[...data.hydration,{oz:String(oz),type:"Water",date:td(),time:new Date().toTimeString().slice(0,5),id:uid()}]};setData(nd);sv(nd);};
  const add=()=>{const nd={...data,hydration:[...data.hydration,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};
  const del=id=>{const nd={...data,hydration:data.hydration.filter(h=>h.id!==id)};setData(nd);sv(nd);};
  let streak=0;for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];if(data.hydration.filter(h=>h.date===ds).reduce((s,h)=>s+(Number(h.oz)||0),0)>=goal)streak++;else if(i>0)break;}
  return <div><Section title="Hydration" action="+ Custom" onAction={()=>sm(true)}>
    <div style={{textAlign:"center",marginBottom:20}}><Ring pct={(tot/goal)*100} size={160} stroke={14} color={G.teal} trackColor={`${G.teal}25`}><div style={{fontSize:38,fontWeight:800,color:G.teal}}>{tot}</div><div style={{fontSize:12,color:G.dim}}>/{goal}oz</div>{tot>=goal&&<div style={{fontSize:11,color:G.moss,fontWeight:600}}>✓</div>}</Ring></div>
    <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center",flexWrap:"wrap"}}>{[8,12,16,24,32].map(oz=><button key={oz} onClick={()=>qA(oz)} style={{background:`${G.teal}15`,border:`1px solid ${G.teal}25`,borderRadius:24,padding:"8px 16px",color:G.teal,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+{oz}</button>)}</div></Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gTeal}><div style={{fontSize:11,opacity:.8}}>Streak</div><div style={{fontSize:28,fontWeight:800}}>{streak}</div><div style={{fontSize:11,opacity:.7}}>days</div></GradCard><Glass style={{padding:14,borderRadius:20}}><div style={{fontSize:9,color:G.dim,fontWeight:600}}>Remaining</div><div style={{fontSize:28,fontWeight:800,color:tot>=goal?G.moss:G.orange}}>{Math.max(0,goal-tot)}</div><div style={{fontSize:11,color:G.dim}}>oz</div></Glass></div>
    <div style={{fontSize:13,fontWeight:600,color:G.dim,marginBottom:8}}>Today</div>
    {tH.slice().reverse().map(h=><EI key={h.id} primary={`${h.oz}oz ${h.type||"Water"}`} secondary={h.time} color={G.teal} onDelete={()=>del(h.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log"><Fld label="oz" type="number" value={f.oz} set={v=>sf({...f,oz:v})}/><Fld label="Type" opts={["Water","Electrolytes","Tea","Coffee","Juice","Smoothie"]} value={f.type} set={v=>sf({...f,type:v})}/><Fld label="Time" type="time" value={f.time} set={v=>sf({...f,time:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal></div>;
}
// ─── SUPPLEMENTS ───
function SuppsPage({data,setData}){
  const [m,sm]=useState(false);const [f,sf]=useState({name:"Creatine",dosage:"",timing:"Morning",date:td()});
  const add=()=>{if(!f.name)return;const nd={...data,supplements:[...data.supplements,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};const del=id=>{const nd={...data,supplements:data.supplements.filter(s=>s.id!==id)};setData(nd);sv(nd);};
  const tS=data.supplements.filter(s=>s.date===td());const freq={};data.supplements.forEach(s=>{freq[s.name]=(freq[s.name]||0)+1;});
  return <div><Section title="Supplements" action="+ Log" onAction={()=>sm(true)}>{Object.keys(freq).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([n,c])=><span key={n} style={{background:`${G.purple}15`,color:G.purple,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,border:`1px solid ${G.purple}25`}}>{n}({c})</span>)}</div>}</Section>
    <div style={{fontSize:13,fontWeight:600,color:G.dim,marginBottom:8}}>Today</div>
    {tS.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>None</div>:tS.map(s=><EI key={s.id} primary={s.name} secondary={`${s.timing}${s.dosage?` · ${s.dosage}`:""}`} color={G.purple} onDelete={()=>del(s.id)}/>)}
    <Modal open={m} onClose={()=>sm(false)} title="Log Supplement"><Fld label="Supp" opts={SUPP_LIST} value={f.name} set={v=>sf({...f,name:v})}/><Fld label="Dose" value={f.dosage} set={v=>sf({...f,dosage:v})} ph="e.g. 5g"/><Fld label="Timing" opts={["Morning","Pre-workout","Post-workout","With meal","Evening","Before bed"]} value={f.timing} set={v=>sf({...f,timing:v})}/><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Btn onClick={add} sx={{width:"100%"}}>Log</Btn></Modal></div>;
}
// ─── SLEEP ───
function SleepPage({data,setData}){
  const [m,sm]=useState(false);const [f,sf]=useState({hours:"",quality:"Good",bedtime:"",wakeTime:"",notes:"",date:td()});
  const add=()=>{if(!f.hours)return;const nd={...data,sleep:[...data.sleep,{...f,id:uid()}]};setData(nd);sv(nd);sm(false);};const del=id=>{const nd={...data,sleep:data.sleep.filter(s=>s.id!==id)};setData(nd);sv(nd);};
  const r=data.sleep.slice(-14);const ah=r.length?(r.reduce((s,e)=>s+Number(e.hours),0)/r.length).toFixed(1):"—";
  const imp=data.sleep.filter(s=>s.source==="health_import").slice(-3).reverse();
  return <div><Section title="Sleep" action="+ Log" onAction={()=>sm(true)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gPurple}><div style={{fontSize:11,opacity:.8}}>Avg</div><div style={{fontSize:32,fontWeight:800}}>{ah}</div><div style={{fontSize:11,opacity:.7}}>hrs/night</div></GradCard><Glass style={{padding:14,borderRadius:20}}><div style={{fontSize:9,color:G.dim,fontWeight:600}}>Last</div><div style={{fontSize:32,fontWeight:800,color:G.purple}}>{data.sleep.length?data.sleep[data.sleep.length-1].hours:"—"}</div><div style={{fontSize:11,color:G.dim}}>hrs</div></Glass></div>
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
  const [m,sm]=useState(false);const [f,sf]=useState({weight:"",bodyFat:"",chest:"",waist:"",arms:"",thighs:"",cardioDistance:"",cardioDuration:"",date:td()});
  const add=()=>{let v2=null;if(f.cardioDistance&&f.cardioDuration)v2=vo2(Number(f.cardioDistance),Number(f.cardioDuration));const nd={...data,bodyMetrics:[...data.bodyMetrics,{...f,vo2max:v2,id:uid()}]};setData(nd);sv(nd);sm(false);};
  const lb=data.bodyMetrics.length?data.bodyMetrics[data.bodyMetrics.length-1]:null;
  return <div><Section title="Body" action="+ Log" onAction={()=>sm(true)}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}><GradCard colors={G.gBlue}><div style={{fontSize:11,opacity:.8}}>Weight</div><div style={{fontSize:32,fontWeight:800}}>{lb?.weight||"—"}</div><div style={{fontSize:11,opacity:.7}}>lbs</div></GradCard><GradCard colors={G.gAmber}><div style={{fontSize:11,opacity:.8}}>VO2</div><div style={{fontSize:32,fontWeight:800}}>{lb?.vo2max||"—"}</div><div style={{fontSize:11,opacity:.7}}>ml/kg</div></GradCard></div>
    {lb&&<Glass style={{marginBottom:18,padding:14,borderRadius:16}}><div style={{fontSize:12,fontWeight:600,color:G.dim,marginBottom:8}}>Latest ({lb.date})</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:14}}>{lb.bodyFat&&<div><span style={{color:G.dim}}>BF:</span> <b>{lb.bodyFat}%</b></div>}{lb.chest&&<div><span style={{color:G.dim}}>Chest:</span> <b>{lb.chest}"</b></div>}{lb.waist&&<div><span style={{color:G.dim}}>Waist:</span> <b>{lb.waist}"</b></div>}{lb.arms&&<div><span style={{color:G.dim}}>Arms:</span> <b>{lb.arms}"</b></div>}{lb.thighs&&<div><span style={{color:G.dim}}>Thighs:</span> <b>{lb.thighs}"</b></div>}</div></Glass>}
    <Modal open={m} onClose={()=>sm(false)} title="Log Body"><Fld label="Date" type="date" value={f.date} set={v=>sf({...f,date:v})}/><Fld label="Weight" type="number" value={f.weight} set={v=>sf({...f,weight:v})} step=".1"/><Fld label="BF%" type="number" value={f.bodyFat} set={v=>sf({...f,bodyFat:v})} step=".1"/><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Chest" type="number" value={f.chest} set={v=>sf({...f,chest:v})}/></div><div style={{flex:1}}><Fld label="Waist" type="number" value={f.waist} set={v=>sf({...f,waist:v})}/></div></div><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Arms" type="number" value={f.arms} set={v=>sf({...f,arms:v})}/></div><div style={{flex:1}}><Fld label="Thighs" type="number" value={f.thighs} set={v=>sf({...f,thighs:v})}/></div></div><div style={{display:"flex",gap:8}}><div style={{flex:1}}><Fld label="Run mi" type="number" value={f.cardioDistance} set={v=>sf({...f,cardioDistance:v})}/></div><div style={{flex:1}}><Fld label="Time min" type="number" value={f.cardioDuration} set={v=>sf({...f,cardioDuration:v})}/></div></div><Btn onClick={add} sx={{width:"100%"}}>Save</Btn></Modal></div>;
}

// ─── AI INSIGHTS ───
function AIPage({data,setData}){
  const [loading,setL]=useState(false);const [err,setE]=useState(null);const [tab,setTab]=useState("gen");
  const gen=async()=>{setL(true);setE(null);try{
    const mem=data.aiMemory.slice(-12).map(m=>`[${m.date}] ${m.summary}`).join("\n");
    const painH=data.painLog.map(p=>`${p.date}:${p.location}(${p.type},sev:${p.severity})${p.resolved?"[R]":"[A]"}`).join("\n");
    const prH=data.prs.slice(-25).map(p=>`${p.date}:${p.exercise} ${p.repMax}@${p.weight}lbs`).join("\n");
    const pwH=data.postWorkout.slice(-14).map(p=>`${p.date}:RPE${p.rpe} E${p.energy} ${p.mood}`).join("\n");
    const suppH=[...new Set(data.supplements.map(s=>s.name))].join(", ");
    const hydAvg=(()=>{let t=0,d=0;for(let i=0;i<14;i++){const dt=new Date();dt.setDate(dt.getDate()-i);const ds=dt.toISOString().split("T")[0];const oz=data.hydration.filter(h=>h.date===ds).reduce((s,h)=>s+(Number(h.oz)||0),0);if(oz>0){t+=oz;d++;}}return d?Math.round(t/d):0;})();
    const hrD=data.heartRate.slice(-7).map(h=>`${h.date}:rest${h.resting} HRV:${h.hrv}`).join("\n");
    const payload={profile:data.profile,recentNutrition:data.nutrition.slice(-28),recentTraining:data.training.slice(-28),recentBody:data.bodyMetrics.slice(-8),recentSleep:data.sleep.slice(-21),recentLifestyle:data.lifestyle.slice(-21),avgHydration:hydAvg+"oz",supps:suppH};
    const sys=`Elite wellness analyst for Tristan — 25yo, Canada, goals: muscle mass, explosiveness, strength. Dairy allergy. Imperial.\n\nMEMORY:\n${mem||"First."}\nPAIN:\n${painH||"None."}\nPRs:\n${prH||"None."}\nPOST-WO:\n${pwH||"None."}\nSUPPS:${suppH||"None."}\nHYDRATION:${hydAvg}oz\nHR:\n${hrD||"None."}\n\nReference previous analyses. Cross-reference data. Flag pains. Analyze PRs. PRIORITY ACTIONS (top 3). End: [MEMORY]: one-sentence takeaway.`;
    const txt=await callClaude({system:sys,messages:[{role:"user",content:`Analyze:\n${JSON.stringify(payload,null,2)}`}]});
    const mM=txt.match(/\[MEMORY\]:?\s*(.+)/);const mN=mM?mM[1].trim():txt.slice(0,120);
    const nd={...data,insights:[...data.insights,{id:uid(),date:td(),text:txt}],aiMemory:[...data.aiMemory,{id:uid(),date:td(),summary:mN}]};setData(nd);sv(nd);
  }catch(e){setE(e.message||"Failed.");}setL(false);};
  return <div><Section title="AI Insights"/>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>Analyses</div><div style={{fontSize:22,fontWeight:800,color:G.moss}}>{data.insights.length}</div></Glass>
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>AI Memory</div><div style={{fontSize:22,fontWeight:800,color:G.purple}}>{data.aiMemory.length}</div></Glass>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:18}}>{[["gen","Analyze"],["hist","History"],["mem","Memory"]].map(([k,l])=><Btn key={k} onClick={()=>setTab(k)} v={tab===k?"primary":"secondary"} sx={{flex:1,padding:10}}>{l}</Btn>)}</div>
    {tab==="gen"&&<div><div style={{textAlign:"center",marginBottom:18}}><Btn onClick={gen} disabled={loading} sx={{padding:"14px 32px",fontSize:15,borderRadius:16}}>{loading?"Analyzing...":"⬡ Generate"}</Btn>{err&&<div style={{color:G.red,fontSize:12,marginTop:6}}>{err}</div>}</div>
      {!hasApiKey()&&<Glass style={{marginBottom:14,padding:14,borderRadius:16}}><div style={{fontSize:13,color:G.orange,fontWeight:600}}>No API key — go to Settings</div></Glass>}
      {data.insights.length>0&&<Glass style={{borderRadius:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,fontWeight:700,color:G.moss}}>⬡ Latest</span><span style={{fontSize:11,color:G.dim}}>{data.insights[data.insights.length-1].date}</span></div><div style={{fontSize:13,color:G.sub,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{data.insights[data.insights.length-1].text}</div></Glass>}</div>}
    {tab==="hist"&&data.insights.slice().reverse().map(i=><Glass key={i.id} style={{marginBottom:10,borderRadius:16}}><div style={{fontSize:11,color:G.dim,marginBottom:6}}>{i.date}</div><div style={{fontSize:13,color:G.sub,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{i.text}</div></Glass>)}
    {tab==="mem"&&<div>{data.aiMemory.slice().reverse().map(m=><Glass key={m.id} style={{marginBottom:6,borderRadius:14}}><div style={{fontSize:11,color:G.dim}}>{m.date}</div><div style={{fontSize:13,color:G.sub,marginTop:2}}>{m.summary}</div></Glass>)}</div>}</div>;
}
// ─── WORKOUT BUILDER ───
function WorkoutPage({data,setData}){
  const [loading,setL]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const [f,sf]=useState({focus:"Full Body",duration:"60",equipment:"Full Gym",intensity:"Moderate",notes:""});
  const [saved,setSaved]=useState([]);

  useEffect(()=>{(async()=>{try{const s=await getData("vitals-workouts");if(s)setSaved(s);}catch{}})();},[]);

  const generate=async()=>{
    setL(true);setErr(null);setResult(null);
    try{
      const painH=data.painLog.filter(p=>!p.resolved).map(p=>`${p.location}(${p.type},sev:${p.severity}/10)`).join(", ");
      const prH=data.prs.slice(-15).map(p=>`${p.exercise} ${p.repMax}@${p.weight}lbs`).join(", ");
      const recentTrain=data.training.slice(-14).map(t=>`${t.date}:${t.name}${t.type==="Strength"?` ${t.sets}x${t.reps}@${t.weight}`:""}`).join("\n");
      const recentPW=data.postWorkout.slice(-5).map(p=>`RPE:${p.rpe} Energy:${p.energy} Pump:${p.pump} ${p.mood}${p.soreness?` Sore:${p.soreness}`:""}`).join("\n");
      const sleepAvg=data.sleep.length?(data.sleep.slice(-7).reduce((s,e)=>s+Number(e.hours),0)/Math.min(data.sleep.length,7)).toFixed(1):"unknown";

      const sys=`You are an elite strength & conditioning coach building a workout for Tristan — 25yo male, goals: muscle mass, explosiveness, strength. Dairy allergy (relevant for pre/post workout nutrition tips).

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
- Program based on his actual PRs and recent training volume
- If RPE has been consistently high, suggest a deload
- Include specific weights based on his PR data (e.g. "Squat 4x6 @ 225lbs" not "Squat 4x6 @ moderate weight")
- Include warm-up, main work, and cool-down
- Add explosive/plyometric work where appropriate given his goals
- Give pre and post workout nutrition suggestions (dairy-free)
- Format clearly with exercise name, sets, reps, weight/intensity, and rest periods`;

      const txt=await callClaude({system:sys,messages:[{role:"user",content:"Generate my workout."}],maxTokens:1500});
      setResult(txt);
    }catch(e){setErr(e.message||"Failed.");}
    setL(false);
  };

  const saveWorkout=async()=>{
    if(!result)return;
    const entry={id:uid(),date:td(),focus:f.focus,duration:f.duration,workout:result};
    const ns=[entry,...saved].slice(0,20);
    setSaved(ns);
    try{await setStorageData("vitals-workouts",ns);}catch{}
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
          <Btn onClick={saveWorkout} v="secondary" sx={{fontSize:11,padding:"6px 12px"}}>Save</Btn>
        </div>
        <div style={{fontSize:13,color:G.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{result}</div>
      </Glass>
    </Section>}

    {saved.length>0&&<Section title="Saved Workouts">
      {saved.map(w=><Glass key={w.id} style={{marginBottom:8,borderRadius:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:13,fontWeight:700,color:G.txt}}>{w.focus}</div>
          <div style={{fontSize:11,color:G.dim}}>{w.date}</div>
        </div>
        <div style={{fontSize:12,color:G.sub,lineHeight:1.5,whiteSpace:"pre-wrap",maxHeight:100,overflow:"hidden"}}>{w.workout?.slice(0,300)}...</div>
      </Glass>)}
    </Section>}
  </div>;
}
// ─── SETTINGS ───
function SettingsPage({data,setData}){
  const [key,setKey]=useState(getApiKey());const [saved,setSaved]=useState(false);const fr=useRef();
  const saveKey=()=>{setApiKey(key);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const exp=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`vitals-${td()}.json`;a.click();};
  const imp=async(file)=>{try{const t=await file.text();const d=JSON.parse(t);const nd={...DEF,...d};setData(nd);sv(nd);alert("Done!");}catch(e){alert("Error: "+e.message);}};
  return <div><Section title="Settings"/>
    <Glass style={{marginBottom:16,borderRadius:18}}><div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:12}}>API Key</div><div style={{fontSize:12,color:G.dim,marginBottom:10}}>Required for AI. Stored on device only.</div><Fld type="password" value={key} set={setKey} ph="sk-ant-..."/><div style={{display:"flex",gap:8}}><Btn onClick={saveKey} sx={{flex:1}}>Save</Btn>{saved&&<div style={{display:"flex",alignItems:"center",color:G.moss,fontSize:13,fontWeight:600}}>✓</div>}</div></Glass>
    <Glass style={{marginBottom:16,borderRadius:18}}><div style={{fontSize:15,fontWeight:700,color:G.txt,marginBottom:12}}>Data</div><div style={{display:"flex",gap:8,marginBottom:8}}><Btn onClick={exp} v="secondary" sx={{flex:1}}>Export</Btn><Btn onClick={()=>fr.current?.click()} v="secondary" sx={{flex:1}}>Import</Btn><input ref={fr} type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])imp(e.target.files[0]);}}/></div><Btn onClick={()=>{if(confirm("Delete all?")){setData(DEF);sv(DEF);}}} v="danger" sx={{width:"100%"}}>Clear All</Btn></Glass>
    <Glass style={{borderRadius:18}}><div style={{fontSize:12,color:G.dim,lineHeight:1.6}}>Vitals v5 · IndexedDB · Claude AI<br/>Data on device. AI → Anthropic.</div></Glass></div>;
}
// ─── MAIN ───
export default function App(){
  const [data,setData]=useState(DEF);const [page,setPage]=useState("home");const [ok,setOk]=useState(false);
  useEffect(()=>{(async()=>{const s=await ld();if(s)setData({...DEF,...s,profile:{...DEF.profile,...s?.profile},prs:s?.prs||[],painLog:s?.painLog||[],postWorkout:s?.postWorkout||[],aiMemory:s?.aiMemory||[],hydration:s?.hydration||[],supplements:s?.supplements||[],healthImports:s?.healthImports||[],heartRate:s?.heartRate||[],ecg:s?.ecg||[],bloodOx:s?.bloodOx||[],respiratory:s?.respiratory||[],stepsData:s?.stepsData||[],watchWorkouts:s?.watchWorkouts||[]});setOk(true);})();},[]);
  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";l.rel="stylesheet";document.head.appendChild(l);},[]);
  if(!ok)return <div style={{background:G.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:G.moss,fontSize:24,fontWeight:800}}>Vitals</div></div>;
  const pages={home:<HomePage data={data} go={setPage}/>,nutr:<NutrPage data={data} setData={setData}/>,train:<TrainPage data={data} setData={setData}/>,hydra:<HydraPage data={data} setData={setData}/>,supps:<SuppsPage data={data} setData={setData}/>,sleep:<SleepPage data={data} setData={setData}/>,life:<LifePage data={data} setData={setData}/>,health:<HealthPage data={data} setData={setData}/>,body:<BodyPage data={data} setData={setData}/>,ai:<AIPage data={data} setData={setData}/>,workout:<WorkoutPage data={data} setData={setData}/>,settings:<SettingsPage data={data} setData={setData}/>};
  return <div style={{background:G.bg,minHeight:"100vh",fontFamily:"'Inter',sans-serif",color:G.txt,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:80}}>
    <div style={{padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"center",position:"sticky",top:0,zIndex:100,background:`${G.bg}dd`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
      <div style={{fontSize:16,fontWeight:800,color:G.txt,letterSpacing:-.5}}>Vitals</div>
    </div>
    <div style={{padding:"12px 20px 40px"}}>{pages[page]}</div>
    <BottomNav current={page} onNav={setPage}/>
  </div>;
}
