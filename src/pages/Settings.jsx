// src/pages/Settings.jsx — Profile, API Key, Workout Builder, Stacks, Pain, PRs, Feedback, Data

import { useState, useEffect, useRef } from "react";
import { G, DEF, GOAL_OPTS } from "../theme.js";
import { td, uid, sv } from "../helpers.js";
import { useVitalsIntel } from "../intel.js";
import { Glass, Fld, Btn, Slider, EI } from "../components/Glass.jsx";
import { callClaude, getApiKey, setApiKey } from "../api.js";
import { getData, setData as setStorageData } from "../storage.js";

export default function Settings({data,setData}){
  const intel=useVitalsIntel(data);
  const [open,setOpen]=useState({profile:false,targets:false,apikey:false,workout:false,stacks:false,pain:false,prs:false,feedback:false,data:false});
  const tog=(k)=>setOpen(o=>({...o,[k]:!o[k]}));
  const [key,setKey]=useState(getApiKey());const [keySaved,setKeySaved]=useState(false);const impRef=useRef();
  const [pf,setPf]=useState({...data.profile});
  const [fbF,setFbF]=useState({type:"Bug",message:"",name:"",rating:"5"});const [fbSent,setFbSent]=useState(false);const [fbSending,setFbSending]=useState(false);

  // Workout builder state
  const [wbF,setWbF]=useState({focus:"Full Body",duration:"60",equipment:"Full Gym",intensity:"Moderate",notes:""});
  const [wbLoading,setWbLoading]=useState(false);const [wbResult,setWbResult]=useState(null);const [wbErr,setWbErr]=useState(null);
  const [savedWorkouts,setSavedWorkouts]=useState([]);const [expandedId,setExpandedId]=useState(null);
  const [logLoading,setLogLoading]=useState(null);const [logSuccess,setLogSuccess]=useState(null);

  useEffect(()=>{setPf({...data.profile});},[data.profile]);
  useEffect(()=>{(async()=>{try{const s=await getData("vitals-workouts");if(s)setSavedWorkouts(s);}catch{}})();},[]);

  const saveKey=()=>{setApiKey(key);setKeySaved(true);setTimeout(()=>setKeySaved(false),2000);};
  const saveProfile=()=>{const nd={...data,profile:{...pf,targets:{calories:Number(pf.targets?.calories)||2800,protein:Number(pf.targets?.protein)||180,water:Number(pf.targets?.water)||100}}};setData(nd);sv(nd);};
  const exp=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`vitals-${td()}.json`;a.click();};
  const imp=async(file)=>{try{const t=await file.text();const d=JSON.parse(t);const nd={...DEF,...d,profile:{...DEF.profile,...d?.profile,targets:{...DEF.profile.targets,...d?.profile?.targets}}};setData(nd);sv(nd);alert("Imported!");}catch(e){alert("Error: "+e.message);}};
  const sendFb=async()=>{if(!fbF.message.trim())return;setFbSending(true);
    const entry={...fbF,id:uid(),date:td(),time:new Date().toTimeString().slice(0,5),device:navigator.userAgent.slice(0,80)};
    const nd={...data,feedback:[...(data.feedback||[]),entry]};setData(nd);sv(nd);
    setFbSent(true);setFbSending(false);setFbF({type:"Bug",message:"",name:"",rating:"5"});setTimeout(()=>setFbSent(false),3000);};
  const deleteStack=(id)=>{const nd={...data,suppStacks:(data.suppStacks||[]).filter(s=>s.id!==id)};setData(nd);sv(nd);};
  const resPain=(id)=>{const nd={...data,painLog:data.painLog.map(p=>p.id===id?{...p,resolved:true,resolvedDate:td()}:p)};setData(nd);sv(nd);};
  const delPain=(id)=>{const nd={...data,painLog:data.painLog.filter(p=>p.id!==id)};setData(nd);sv(nd);};
  const delPR=(id)=>{const nd={...data,prs:data.prs.filter(p=>p.id!==id)};setData(nd);sv(nd);};

  // Workout builder
  const generateWorkout=async()=>{
    setWbLoading(true);setWbErr(null);setWbResult(null);
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
Focus: ${wbF.focus}
Duration: ${wbF.duration} minutes
Equipment: ${wbF.equipment}
Intensity: ${wbF.intensity}
${wbF.notes?`Notes: ${wbF.notes}`:""}

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
      setWbResult(txt);
    }catch(e){setWbErr(e.message||"Failed.");}setWbLoading(false);
  };

  const saveWorkout=async()=>{if(!wbResult)return;
    const entry={id:uid(),date:td(),focus:wbF.focus,duration:wbF.duration,intensity:wbF.intensity,equipment:wbF.equipment,workout:wbResult};
    const ns=[entry,...savedWorkouts].slice(0,20);setSavedWorkouts(ns);
    try{await setStorageData("vitals-workouts",ns);}catch{}};

  const deleteSaved=async(id)=>{const ns=savedWorkouts.filter(w=>w.id!==id);setSavedWorkouts(ns);if(expandedId===id)setExpandedId(null);try{await setStorageData("vitals-workouts",ns);}catch{}};

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
      const entries=exercises.map(ex=>({id:uid(),type:ex.type||"Strength",name:ex.name,sets:String(ex.sets||""),reps:String(ex.reps||""),weight:String(ex.weight||""),duration:String(ex.duration||""),distance:"",notes:ex.notes||"",date:workoutDate||td()}));
      const nd={...data,training:[...data.training,...entries]};setData(nd);sv(nd);
      setLogSuccess(workoutDate);setTimeout(()=>setLogSuccess(null),3000);
    }catch(e){setWbErr("Failed to parse workout: "+(e.message||""));}setLogLoading(null);
  };

  const p=data.profile;

  const Sect=({id,label,icon,children})=><div style={{marginBottom:8}}>
    <button onClick={()=>tog(id)} style={{width:"100%",background:G.glass,border:`1px solid ${G.glassBorder}`,borderRadius:open[id]?`16px 16px 0 0`:16,padding:"14px 16px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:G.blur}}>
      <span style={{fontSize:14,fontWeight:700,color:G.txt}}>{icon} {label}</span>
      <span style={{fontSize:12,color:G.dim,transition:"transform .2s",transform:open[id]?"rotate(180deg)":"none"}}>▾</span>
    </button>
    {open[id]&&<div style={{background:G.glass,border:`1px solid ${G.glassBorder}`,borderTop:"none",borderRadius:"0 0 16px 16px",padding:"16px",backdropFilter:G.blur}}>{children}</div>}
  </div>;

  return <div>
    <div style={{fontSize:22,fontWeight:700,color:G.txt,marginBottom:18}}>Settings</div>

    <Sect id="profile" label="Profile & Goals" icon="👤">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,marginBottom:14}}>
        <div><span style={{color:G.dim}}>Name:</span> <span style={{fontWeight:600}}>{p.name||"Not set"}</span></div>
        <div><span style={{color:G.dim}}>Age:</span> <span style={{fontWeight:600}}>{p.age||"—"}</span></div>
        <div><span style={{color:G.dim}}>Restrictions:</span> <span style={{fontWeight:600}}>{p.allergies||"None"}</span></div>
        <div><span style={{color:G.dim}}>Units:</span> <span style={{fontWeight:600}}>{p.units||"imperial"}</span></div>
      </div>
      {p.goals?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:14}}>
        {p.goals.map((g,i)=><span key={i} style={{background:`${G.moss}15`,color:G.moss,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:600}}>{g}</span>)}
      </div>}
      <Fld label="Name" value={pf.name||""} set={v=>setPf({...pf,name:v})} ph="Your name"/>
      <Fld label="Age" type="number" value={pf.age||""} set={v=>setPf({...pf,age:v})}/>
      <Fld label="Allergies / Dietary Restrictions" value={pf.allergies||""} set={v=>setPf({...pf,allergies:v})} ph="e.g. Dairy, Gluten, Vegan"/>
      <Fld label="Units" opts={["imperial","metric"]} value={pf.units||"imperial"} set={v=>setPf({...pf,units:v})}/>
      <div style={{fontSize:13,fontWeight:600,color:G.sub,marginBottom:8}}>Goals</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {GOAL_OPTS.map(g=>{const active=(pf.goals||[]).includes(g);return <button key={g} onClick={()=>{const goals=active?(pf.goals||[]).filter(x=>x!==g):[...(pf.goals||[]),g];setPf({...pf,goals});}}
          style={{background:active?`${G.moss}20`:G.glass,border:`1px solid ${active?G.moss+"40":G.glassBorder}`,borderRadius:20,padding:"6px 14px",color:active?G.moss:G.dim,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{active?"✓ ":""}{g}</button>;})}
      </div>
      <Btn onClick={saveProfile} sx={{width:"100%"}}>Save Profile</Btn>
    </Sect>

    <Sect id="targets" label="Daily Targets" icon="🎯">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[{l:"Calories",v:p.targets?.calories||2800,c:G.moss},{l:"Protein",v:(p.targets?.protein||180)+"g",c:G.orange},{l:"Water",v:(p.targets?.water||100)+"oz",c:G.teal}].map((t,i)=>
          <div key={i} style={{textAlign:"center",background:G.glass2,borderRadius:12,padding:"10px 6px"}}>
            <div style={{fontSize:20,fontWeight:800,color:t.c}}>{t.v}</div>
            <div style={{fontSize:10,color:G.dim,fontWeight:600}}>{t.l}</div>
          </div>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Calories" type="number" value={pf.targets?.calories||""} set={v=>setPf({...pf,targets:{...pf.targets,calories:v}})}/></div>
        <div style={{flex:1}}><Fld label="Protein (g)" type="number" value={pf.targets?.protein||""} set={v=>setPf({...pf,targets:{...pf.targets,protein:v}})}/></div>
      </div>
      <Fld label="Water (oz)" type="number" value={pf.targets?.water||""} set={v=>setPf({...pf,targets:{...pf.targets,water:v}})}/>
      <Btn onClick={saveProfile} sx={{width:"100%"}}>Save Targets</Btn>
    </Sect>

    <Sect id="apikey" label="API Key" icon="🔑">
      <div style={{fontSize:12,color:G.dim,marginBottom:10}}>Required for AI features. Stored on device only.</div>
      <Fld type="password" value={key} set={setKey} ph="sk-ant-..."/>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <Btn onClick={saveKey} sx={{flex:1}}>Save</Btn>
        {keySaved&&<span style={{color:G.moss,fontSize:13,fontWeight:600}}>✓ Saved</span>}
      </div>
    </Sect>

    <Sect id="workout" label="Workout Builder" icon="⚡">
      <Glass glow={`radial-gradient(circle,${G.amber}20,transparent 70%)`} style={{marginBottom:16,borderRadius:20,padding:20}}>
        <div style={{fontSize:14,color:G.txt,fontWeight:700,marginBottom:4}}>AI-Powered Programming</div>
        <div style={{fontSize:12,color:G.dim,lineHeight:1.5,marginBottom:14}}>Builds workouts using your PRs, pain points, recovery data, and muscle freshness.</div>
        <Fld label="Focus" opts={["Full Body","Upper Body","Lower Body","Push","Pull","Legs","Chest & Triceps","Back & Biceps","Shoulders","Arms","Core","Explosive/Plyo","Active Recovery"]} value={wbF.focus} set={v=>setWbF({...wbF,focus:v})}/>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}><Fld label="Duration (min)" opts={["30","45","60","75","90"]} value={wbF.duration} set={v=>setWbF({...wbF,duration:v})}/></div>
          <div style={{flex:1}}><Fld label="Intensity" opts={["Light","Moderate","High","Max Effort"]} value={wbF.intensity} set={v=>setWbF({...wbF,intensity:v})}/></div>
        </div>
        <Fld label="Equipment" opts={["Full Gym","Dumbbells Only","Barbell & Rack","Bodyweight","Home Gym","Cables & Machines"]} value={wbF.equipment} set={v=>setWbF({...wbF,equipment:v})}/>
        <Fld label="Notes (optional)" type="textarea" value={wbF.notes} set={v=>setWbF({...wbF,notes:v})} ph="e.g. Want to hit heavy squats today, feeling good"/>
        <Btn onClick={generateWorkout} disabled={wbLoading} sx={{width:"100%",padding:14,fontSize:15}}>{wbLoading?"Building workout...":"⚡ Generate Workout"}</Btn>
      </Glass>
      {wbErr&&<Glass style={{marginBottom:14,borderRadius:16}}><div style={{color:G.red,fontSize:13}}>{wbErr}</div></Glass>}
      {wbResult&&<Glass style={{borderRadius:20,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:14,fontWeight:700,color:G.txt}}>{wbF.focus}</div><div style={{fontSize:11,color:G.dim}}>{wbF.duration}min · {wbF.intensity} · {wbF.equipment}</div></div>
          <Btn onClick={saveWorkout} v="secondary" sx={{fontSize:11,padding:"6px 12px"}}>💾 Save</Btn>
        </div>
        <div style={{fontSize:13,color:G.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{wbResult}</div>
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${G.glassBorder}`}}>
          <Btn onClick={()=>logWorkoutToTraining(wbResult,td())} disabled={logLoading===td()} sx={{width:"100%",padding:12}} v="primary">
            {logLoading===td()?"⏳ Parsing exercises...":logSuccess===td()?"✓ Logged to Training!":"📋 Log All Exercises to Training"}
          </Btn>
        </div>
      </Glass>}
      {savedWorkouts.length>0&&<div>
        <div style={{fontSize:11,fontWeight:700,color:G.dim,letterSpacing:1,marginBottom:8}}>SAVED WORKOUTS ({savedWorkouts.length})</div>
        {savedWorkouts.map(w=>{const isExp=expandedId===w.id;return <Glass key={w.id} style={{marginBottom:8,borderRadius:16,cursor:"pointer"}} onClick={()=>setExpandedId(isExp?null:w.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:13,fontWeight:700,color:G.txt}}>{w.focus}</span>
                <span style={{fontSize:10,color:G.dim,background:G.glass2,padding:"2px 7px",borderRadius:8}}>{w.duration}min</span>
                {w.intensity&&<span style={{fontSize:10,color:G.amber,background:`${G.amber}15`,padding:"2px 7px",borderRadius:8}}>{w.intensity}</span>}
              </div>
              <div style={{fontSize:11,color:G.dim,marginTop:3}}>{w.date}{w.equipment?` · ${w.equipment}`:""}</div>
            </div>
            <span style={{fontSize:14,color:G.dim,transition:"transform .2s",transform:isExp?"rotate(180deg)":"none"}}>▾</span>
          </div>
          {isExp&&<div onClick={e=>e.stopPropagation()}>
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${G.glassBorder}`,fontSize:13,color:G.sub,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:400,overflow:"auto"}}>{w.workout}</div>
            <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${G.glassBorder}`}}>
              <Btn onClick={()=>logWorkoutToTraining(w.workout,w.date)} disabled={logLoading===w.date} sx={{flex:1,padding:10,fontSize:12}} v="primary">
                {logLoading===w.date?"Parsing...":logSuccess===w.date?"✓ Logged!":"📋 Log to Training"}
              </Btn>
              <Btn onClick={()=>deleteSaved(w.id)} v="danger" sx={{padding:"10px 14px",fontSize:12}}>🗑</Btn>
            </div>
          </div>}
        </Glass>;})}
      </div>}
    </Sect>

    <Sect id="stacks" label="Supplement Stacks" icon="💊">
      {(data.suppStacks||[]).length===0?<div style={{color:G.dim,fontSize:13}}>No stacks saved. Log supplements and save them as a stack from the Log tab.</div>:
        (data.suppStacks||[]).map(stack=><Glass key={stack.id} style={{marginBottom:8,borderRadius:14,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:14,fontWeight:700,color:G.purple}}>{stack.name}</span>
            <button onClick={()=>deleteStack(stack.id)} style={{background:G.glass2,border:"none",width:26,height:26,borderRadius:13,color:G.dim,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {stack.items.map((item,i)=><span key={i} style={{background:`${G.purple}12`,color:G.sub,borderRadius:8,padding:"3px 8px",fontSize:11}}>{item.name}{item.dosage?` ${item.dosage}`:""}</span>)}
          </div>
        </Glass>)}
    </Sect>

    <Sect id="pain" label="Pain Log" icon="🩹">
      {data.painLog.length===0?<div style={{color:G.dim,fontSize:13}}>No pain entries.</div>:<>
        {data.painLog.filter(p=>!p.resolved).length>0&&<div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:G.dim,marginBottom:6}}>ACTIVE</div>
          {data.painLog.filter(p=>!p.resolved).map(p=><Glass key={p.id} style={{marginBottom:6,padding:"10px 14px",borderRadius:14,display:"flex",alignItems:"center"}}>
            <div style={{flex:1}}><div style={{fontSize:13,color:G.red,fontWeight:600}}>{p.location} — {p.type}</div><div style={{fontSize:11,color:G.dim}}>{p.date} · Sev:{p.severity}/10</div></div>
            <div style={{display:"flex",gap:6}}>
              <Btn onClick={()=>resPain(p.id)} v="ghost" sx={{fontSize:11,padding:"4px 8px",color:G.moss}}>✓ Resolve</Btn>
              <button onClick={()=>delPain(p.id)} style={{background:G.glass2,border:"none",width:26,height:26,borderRadius:13,color:G.dim,cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          </Glass>)}
        </div>}
        {data.painLog.filter(p=>p.resolved).length>0&&<div>
          <div style={{fontSize:10,fontWeight:700,color:G.dim,marginBottom:6}}>RESOLVED</div>
          {data.painLog.filter(p=>p.resolved).slice().reverse().slice(0,5).map(p=><EI key={p.id} primary={`${p.location} — ${p.type}`} secondary={`${p.date} · Sev:${p.severity}/10 · resolved`} color={G.moss} onDelete={()=>delPain(p.id)}/>)}
        </div>}
      </>}
    </Sect>

    <Sect id="prs" label="Personal Records" icon="🏆">
      {data.prs.length===0?<div style={{color:G.dim,fontSize:13}}>No PRs yet. Log exercises with sets/reps/weight to auto-detect PRs.</div>:
        data.prs.slice().reverse().map(p=><EI key={p.id} primary={`${p.exercise} ${p.repMax}`} secondary={p.date} tertiary={`${p.weight}lbs`} color={G.moss} onDelete={()=>delPR(p.id)}/>)}
    </Sect>

    <Sect id="feedback" label="Feedback" icon="💬">
      <Fld label="Your Name (optional)" value={fbF.name} set={v=>setFbF({...fbF,name:v})} ph="Anonymous"/>
      <Fld label="Type" opts={["Bug","Feature Request","UI/Design","Performance","Other"]} value={fbF.type} set={v=>setFbF({...fbF,type:v})}/>
      <Slider label="Overall Rating" value={fbF.rating} set={v=>setFbF({...fbF,rating:v})} min={1} max={10} color={Number(fbF.rating)>=7?G.moss:Number(fbF.rating)>=4?G.orange:G.red}/>
      <Fld label="Message" type="textarea" value={fbF.message} set={v=>setFbF({...fbF,message:v})} ph="What happened? What would you like to see?"/>
      <Btn onClick={sendFb} disabled={fbSending||!fbF.message.trim()} sx={{width:"100%",padding:13}}>
        {fbSending?"Sending...":fbSent?"✓ Sent! Thank you":"Send Feedback"}
      </Btn>
    </Sect>

    <Sect id="data" label="Data & Storage" icon="💾">
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <Btn onClick={exp} v="secondary" sx={{flex:1}}>📤 Export</Btn>
        <Btn onClick={()=>impRef.current?.click()} v="secondary" sx={{flex:1}}>📥 Import</Btn>
        <input ref={impRef} type="file" accept=".json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])imp(e.target.files[0]);}}/>
      </div>
      <Btn onClick={()=>{if(confirm("Delete ALL data? Cannot be undone.")){setData(DEF);sv(DEF);}}} v="danger" sx={{width:"100%"}}>Clear All Data</Btn>
      <div style={{marginTop:14,fontSize:11,color:G.dim,lineHeight:1.6}}>Vitals v10 · IndexedDB · Claude AI · Data stored on device only.</div>
    </Sect>
  </div>;
}
