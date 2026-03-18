// src/pages/Log.jsx — Unified logging screen

import { useState, useRef, useEffect } from "react";
import { G, PAIN_LOCS, PAIN_TYPES, SUPP_LIST } from "../theme.js";
import { td, uid, sv, toB64, vo2 } from "../helpers.js";
import { Glass, Fld, Btn, Slider, EI } from "../components/Glass.jsx";
import { callClaude } from "../api.js";

export default function Log({data,setData,initialForm}){
  const [active,setActive]=useState(initialForm||null);
  const today=td();
  // AI text entry
  const [aiText,setAiText]=useState("");const [aiTextL,setAiTextL]=useState(false);const [aiTextItems,setAiTextItems]=useState([]);
  // Photo snap
  const photoRef=useRef();const [photoL,setPhotoL]=useState(false);
  // Form states
  const [mealF,setMealF]=useState({meal:"Lunch",food:"",calories:"",protein:"",carbs:"",fat:"",date:today});
  const [exF,setExF]=useState({type:"Strength",name:"",sets:"",reps:"",weight:"",duration:"",distance:"",notes:"",date:today});
  const [exSearch,setExSearch]=useState("");
  const [waterF,setWaterF]=useState({oz:"16",type:"Water",date:today,time:new Date().toTimeString().slice(0,5)});
  const [suppF,setSuppF]=useState({name:"Creatine",dosage:"",timing:"Morning",date:today});
  const [sleepF,setSleepF]=useState({hours:"",quality:"Good",bedtime:"",wakeTime:"",notes:"",date:today});
  const [bodyF,setBodyF]=useState({weight:"",bodyFat:"",chest:"",waist:"",arms:"",thighs:"",cardioDistance:"",cardioDuration:"",date:today});
  const [moodF,setMoodF]=useState({energy:"7",stress:"4",mood:"Good",steps:"",notes:"",date:today});
  const [painF,setPainF]=useState({location:"",type:"Dull/Aching",severity:"5",during:"",notes:"",date:today});
  const [pwF,setPwF]=useState({rpe:"7",mood:"Good",energy:"7",pump:"7",soreness:"",notes:"",date:today});
  const [healthL,setHealthL]=useState(false);const [healthR,setHealthR]=useState(null);const healthFileRef=useRef();

  // Open initialForm when prop changes
  useEffect(()=>{if(initialForm)setActive(initialForm);},[initialForm]);

  const pastExercises=[...new Set(data.training.map(t=>t.name).filter(Boolean))];
  const exSuggestions=exSearch.length>=1?pastExercises.filter(e=>e.toLowerCase().includes(exSearch.toLowerCase())).slice(0,5):[];
  const recentMeals=data.nutrition.filter(n=>n.date!==today).slice(-8).reverse().slice(0,4);
  const stacks=data.suppStacks||[];

  const analyzeText=async()=>{if(!aiText.trim())return;setAiTextL(true);setAiTextItems([]);try{
    const txt=await callClaude({system:`Nutrition analyst. Accurate macros. Pure JSON array. ${data.profile.allergies?`Flag any items containing: ${data.profile.allergies}.`:""}
Return ONLY valid JSON array: [{"food":"item with portion","calories":N,"protein":N,"carbs":N,"fat":N}]`,
      messages:[{role:"user",content:`Analyze these foods: ${aiText}`}]});
    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
    setAiTextItems(Array.isArray(parsed)?parsed:[parsed]);
  }catch(e){setAiTextItems([{error:e.message||"Failed."}]);}setAiTextL(false);};

  const snapPhoto=async(file)=>{setPhotoL(true);setAiTextItems([]);try{const b64=await toB64(file);const bd=b64.split(",")[1];
    const txt=await callClaude({system:`Nutrition analyst. Accurate macros. Pure JSON.${data.profile.allergies?` Flag these allergens/restrictions: ${data.profile.allergies}.`:""}`,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:bd}},{type:"text",text:`Food photo.${data.profile.allergies?` ALLERGIES: ${data.profile.allergies}.`:""} JSON: {"food":"desc","calories":N,"protein":N,"carbs":N,"fat":N,"dairy_warning":bool,"notes":"obs"}`}]}]});
    const p=JSON.parse(txt.replace(/```json|```/g,"").trim());
    setAiTextItems([p]);setMealF(m=>({...m,food:p.food||"",calories:String(p.calories||""),protein:String(p.protein||""),carbs:String(p.carbs||""),fat:String(p.fat||"")}));
    setActive("meal");
  }catch(e){setAiTextItems([{error:e.message||"Failed."}]);}setPhotoL(false);};

  const addAiItem=(item)=>{const entry={meal:mealF.meal,food:item.food,calories:String(item.calories||0),protein:String(item.protein||0),carbs:String(item.carbs||0),fat:String(item.fat||0),date:today,id:uid()};const nd={...data,nutrition:[...data.nutrition,entry]};setData(nd);sv(nd);};
  const addAllAiItems=()=>{const entries=aiTextItems.filter(i=>!i.error).map(item=>({meal:mealF.meal,food:item.food,calories:String(item.calories||0),protein:String(item.protein||0),carbs:String(item.carbs||0),fat:String(item.fat||0),date:today,id:uid()}));const nd={...data,nutrition:[...data.nutrition,...entries]};setData(nd);sv(nd);setAiText("");setAiTextItems([]);};

  const addMeal=()=>{if(!mealF.food)return;const nd={...data,nutrition:[...data.nutrition,{...mealF,id:uid()}]};setData(nd);sv(nd);setMealF({meal:"Lunch",food:"",calories:"",protein:"",carbs:"",fat:"",date:today});setActive(null);};
  const repeatMeal=(m)=>{const entry={...m,date:today,id:uid()};const nd={...data,nutrition:[...data.nutrition,entry]};setData(nd);sv(nd);};
  const addExercise=()=>{if(!exF.name)return;const e={...exF,id:uid()};const nd={...data,training:[...data.training,e]};setData(nd);sv(nd);setExF({type:"Strength",name:"",sets:"",reps:"",weight:"",duration:"",distance:"",notes:"",date:today});setExSearch("");setActive(null);};
  const addWater=()=>{const nd={...data,hydration:[...data.hydration,{...waterF,id:uid()}]};setData(nd);sv(nd);setWaterF({oz:"16",type:"Water",date:today,time:new Date().toTimeString().slice(0,5)});setActive(null);};
  const quickWater=(oz)=>{const nd={...data,hydration:[...data.hydration,{oz:String(oz),type:"Water",date:today,time:new Date().toTimeString().slice(0,5),id:uid()}]};setData(nd);sv(nd);};
  const addSupp=()=>{if(!suppF.name)return;const nd={...data,supplements:[...data.supplements,{...suppF,id:uid()}]};setData(nd);sv(nd);setSuppF({name:"Creatine",dosage:"",timing:"Morning",date:today});setActive(null);};
  const logStack=(stack)=>{const entries=stack.items.map(item=>({...item,date:today,id:uid()}));const nd={...data,supplements:[...data.supplements,...entries]};setData(nd);sv(nd);};
  const addSleep=()=>{if(!sleepF.hours)return;const nd={...data,sleep:[...data.sleep,{...sleepF,id:uid()}]};setData(nd);sv(nd);setSleepF({hours:"",quality:"Good",bedtime:"",wakeTime:"",notes:"",date:today});setActive(null);};
  const addBody=()=>{let v2=null;if(bodyF.cardioDistance&&bodyF.cardioDuration)v2=vo2(Number(bodyF.cardioDistance),Number(bodyF.cardioDuration));const nd={...data,bodyMetrics:[...data.bodyMetrics,{...bodyF,vo2max:v2,id:uid()}]};setData(nd);sv(nd);setBodyF({weight:"",bodyFat:"",chest:"",waist:"",arms:"",thighs:"",cardioDistance:"",cardioDuration:"",date:today});setActive(null);};
  const addMood=()=>{const nd={...data,lifestyle:[...data.lifestyle,{...moodF,id:uid()}]};setData(nd);sv(nd);setMoodF({energy:"7",stress:"4",mood:"Good",steps:"",notes:"",date:today});setActive(null);};
  const addPain=()=>{if(!painF.location)return;const nd={...data,painLog:[...data.painLog,{...painF,id:uid(),resolved:false}]};setData(nd);sv(nd);setPainF({location:"",type:"Dull/Aching",severity:"5",during:"",notes:"",date:today});setActive(null);};
  const addPW=()=>{const nd={...data,postWorkout:[...data.postWorkout,{...pwF,id:uid()}]};setData(nd);sv(nd);setPwF({rpe:"7",mood:"Good",energy:"7",pump:"7",soreness:"",notes:"",date:today});setActive(null);};

  const analyzeHealth=async(file)=>{setHealthL(true);setHealthR(null);try{const b64=await toB64(file);const bd=b64.split(",")[1];
    const txt=await callClaude({system:`Extract health data from Apple Health screenshots. JSON only:
{"type":"sleep|heart_rate|ecg|blood_oxygen|respiratory|steps|vo2max|workout|other","data":{...},"date":"YYYY-MM-DD","summary":"brief"}`,
      messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:bd}},{type:"text",text:"Extract health data."}]}]});
    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());setHealthR(parsed);
    const nd={...data};const date=parsed.date||today;const entry={...parsed.data,id:uid(),date,source:"health_import"};
    if(parsed.type==="sleep")nd.sleep=[...nd.sleep,{hours:String(parsed.data.hours||""),quality:parsed.data.deep>1.5?"Good":"Fair",bedtime:parsed.data.bedtime||"",wakeTime:parsed.data.wakeTime||"",deep:parsed.data.deep,rem:parsed.data.rem,core:parsed.data.core,awake:parsed.data.awake,date,id:uid(),source:"health_import"}];
    else if(parsed.type==="heart_rate")nd.heartRate=[...nd.heartRate,entry];
    else if(parsed.type==="ecg")nd.ecg=[...nd.ecg,entry];
    else if(parsed.type==="blood_oxygen")nd.bloodOx=[...nd.bloodOx,entry];
    else if(parsed.type==="respiratory")nd.respiratory=[...nd.respiratory,entry];
    else if(parsed.type==="steps")nd.stepsData=[...nd.stepsData,entry];
    else if(parsed.type==="workout")nd.watchWorkouts=[...nd.watchWorkouts,entry];
    nd.healthImports=[...nd.healthImports,{id:uid(),date:today,type:parsed.type,summary:parsed.summary}];setData(nd);sv(nd);
  }catch(e){setHealthR({error:e.message||"Failed."});}setHealthL(false);};

  const cats=[
    {id:"meal",label:"Meal",icon:"🍽️",color:G.moss},
    {id:"exercise",label:"Exercise",icon:"💪",color:G.orange},
    {id:"water",label:"Water",icon:"💧",color:G.teal},
    {id:"supps",label:"Supps",icon:"💊",color:G.purple},
    {id:"sleep",label:"Sleep",icon:"🌙",color:G.indigo},
    {id:"body",label:"Body",icon:"📏",color:G.blue},
    {id:"mood",label:"Mood",icon:"🧘",color:G.pink},
    {id:"pain",label:"Pain",icon:"🩹",color:G.red},
    {id:"postWO",label:"Post-WO",icon:"⚡",color:G.amber},
    {id:"health",label:"Health",icon:"❤️",color:G.red},
  ];
  const toggle=(id)=>setActive(a=>a===id?null:id);

  // Build today feed
  const todayFeed=[];
  data.nutrition.filter(n=>n.date===today).forEach(n=>todayFeed.push({k:n.id,label:n.food,sub:`${n.meal} · ${n.calories||0}cal · P:${n.protein||0}g`,icon:"🍽️",color:G.moss}));
  data.training.filter(t=>t.date===today).forEach(t=>todayFeed.push({k:t.id,label:t.name,sub:t.type==="Strength"?`${t.sets||""}×${t.reps||""}@${t.weight||""}lbs`:`${t.type} · ${t.duration||""}min`,icon:"💪",color:G.orange}));
  data.hydration.filter(h=>h.date===today).forEach(h=>todayFeed.push({k:h.id,label:`${h.oz}oz ${h.type||"Water"}`,sub:h.time||"",icon:"💧",color:G.teal}));
  data.supplements.filter(s=>s.date===today).forEach(s=>todayFeed.push({k:s.id,label:s.name,sub:`${s.timing}${s.dosage?` · ${s.dosage}`:""}`,icon:"💊",color:G.purple}));
  data.sleep.filter(s=>s.date===today).forEach(s=>todayFeed.push({k:s.id,label:`${s.hours}hrs sleep`,sub:s.quality,icon:"🌙",color:G.indigo}));
  data.lifestyle.filter(l=>l.date===today).forEach(l=>todayFeed.push({k:l.id,label:`Energy ${l.energy}/10 · Stress ${l.stress}/10`,sub:l.mood,icon:"🧘",color:G.pink}));
  data.bodyMetrics.filter(b=>b.date===today).forEach(b=>todayFeed.push({k:b.id,label:`${b.weight||"?"}lbs${b.bodyFat?` · ${b.bodyFat}% BF`:""}`,sub:"Body",icon:"📏",color:G.blue}));
  data.painLog.filter(p=>p.date===today).forEach(p=>todayFeed.push({k:p.id,label:`${p.location} pain`,sub:`${p.type} · ${p.severity}/10`,icon:"🩹",color:G.red}));
  data.postWorkout.filter(p=>p.date===today).forEach(p=>todayFeed.push({k:p.id,label:`Post-WO: RPE ${p.rpe}/10`,sub:`${p.mood} · Energy ${p.energy}/10`,icon:"⚡",color:G.amber}));

  return <div>
    {/* AI Text Entry */}
    <Glass glow={`radial-gradient(circle at 30% 50%,${G.moss}20,transparent 60%)`} style={{marginBottom:14,borderRadius:20,padding:16}}>
      <div style={{fontSize:13,fontWeight:700,color:G.moss,marginBottom:4}}>✍️ Describe anything</div>
      <div style={{fontSize:11,color:G.dim,marginBottom:10,lineHeight:1.4}}>Food, workouts, sleep, supplements — AI parses the macros and logs it.</div>
      <textarea value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="e.g. 150g chicken breast, cup of brown rice, and 16oz water" style={{width:"100%",background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:12,padding:"10px 12px",color:G.txt,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",minHeight:56,resize:"vertical"}}/>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn onClick={analyzeText} disabled={aiTextL||!aiText.trim()} sx={{flex:1,padding:11}} v={aiText.trim()?"primary":"secondary"}>
          {aiTextL?"Analyzing...":"🧠 Get Macros"}
        </Btn>
        <button onClick={()=>photoRef.current?.click()} disabled={photoL}
          style={{background:G.glass2,border:`1px solid ${G.glassBorder2}`,borderRadius:14,padding:"11px 16px",color:G.txt,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:photoL?.5:1}}>
          {photoL?"📸...":"📸"}
        </button>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files[0])snapPhoto(e.target.files[0]);}}/>
      </div>
      {aiTextItems.length>0&&!aiTextItems[0]?.error&&<div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:700,color:G.moss}}>✓ {aiTextItems.length} item{aiTextItems.length>1?"s":""}</span>
          <Btn onClick={addAllAiItems} v="primary" sx={{fontSize:11,padding:"5px 12px"}}>Log All</Btn>
        </div>
        {aiTextItems.map((item,i)=><div key={i} style={{background:G.glass,borderRadius:12,padding:"8px 12px",marginBottom:4,border:`1px solid ${G.glassBorder}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1}}><div style={{fontSize:13,color:G.txt,fontWeight:500}}>{item.food}</div><div style={{fontSize:11,color:G.dim}}>P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g</div></div>
          <div style={{fontSize:15,fontWeight:800,color:G.moss,minWidth:36,textAlign:"right"}}>{item.calories}</div>
          <button onClick={()=>addAiItem(item)} style={{background:`${G.moss}20`,border:`1px solid ${G.moss}30`,borderRadius:8,width:26,height:26,color:G.moss,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
        </div>)}
      </div>}
      {aiTextItems[0]?.error&&<div style={{color:G.red,fontSize:12,marginTop:8}}>{aiTextItems[0].error}</div>}
    </Glass>

    {/* Supplement Stacks quick-log */}
    {stacks.length>0&&<div style={{marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:700,color:G.dim,letterSpacing:1,marginBottom:6}}>SUPPLEMENT STACKS</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {stacks.map(stack=><button key={stack.id} onClick={()=>logStack(stack)}
          style={{background:`${G.purple}15`,border:`1px solid ${G.purple}25`,borderRadius:20,padding:"6px 14px",color:G.purple,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          💊 {stack.name}
        </button>)}
      </div>
    </div>}

    {/* Category Grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:2}}>
      {cats.map(cat=><button key={cat.id} onClick={()=>toggle(cat.id)}
        style={{background:active===cat.id?`${cat.color}18`:G.glass,border:`1px solid ${active===cat.id?cat.color+"35":G.glassBorder}`,borderRadius:16,padding:"12px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,transition:"all .15s"}}>
        <span style={{fontSize:20,filter:active===cat.id?`drop-shadow(0 0 8px ${cat.color}60)`:"none"}}>{cat.icon}</span>
        <span style={{fontSize:13,fontWeight:600,color:active===cat.id?cat.color:G.sub}}>{cat.label}</span>
        <span style={{marginLeft:"auto",fontSize:11,color:active===cat.id?cat.color:G.dim}}>{active===cat.id?"▲":"▼"}</span>
      </button>)}
    </div>

    {/* Inline Forms */}
    {active==="meal"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.moss}`}}>
      {recentMeals.length>0&&<div style={{marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:G.dim,marginBottom:6}}>REPEAT RECENT</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {recentMeals.map((m,i)=><button key={i} onClick={()=>repeatMeal(m)}
            style={{background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:10,padding:"4px 10px",color:G.sub,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
            ↩ {m.food.slice(0,22)}{m.food.length>22?"…":""}
          </button>)}
        </div>
      </div>}
      <Fld label="Meal" opts={["Breakfast","Lunch","Dinner","Snack","Pre-workout","Post-workout"]} value={mealF.meal} set={v=>setMealF({...mealF,meal:v})}/>
      <Fld label="Food" value={mealF.food} set={v=>setMealF({...mealF,food:v})} ph="e.g. Chicken & rice"/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Cal" type="number" value={mealF.calories} set={v=>setMealF({...mealF,calories:v})}/></div>
        <div style={{flex:1}}><Fld label="Prot" type="number" value={mealF.protein} set={v=>setMealF({...mealF,protein:v})}/></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Carb" type="number" value={mealF.carbs} set={v=>setMealF({...mealF,carbs:v})}/></div>
        <div style={{flex:1}}><Fld label="Fat" type="number" value={mealF.fat} set={v=>setMealF({...mealF,fat:v})}/></div>
      </div>
      <Btn onClick={addMeal} sx={{width:"100%"}}>Log Meal</Btn>
    </Glass>}

    {active==="exercise"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.orange}`}}>
      <Fld label="Type" opts={["Strength","Cardio","Plyometrics","Mobility","Sport"]} value={exF.type} set={v=>setExF({...exF,type:v})}/>
      <div style={{position:"relative",marginBottom:14}}>
        <label style={{display:"block",fontSize:13,color:G.sub,marginBottom:6,fontWeight:600}}>Exercise</label>
        <input value={exF.name} onChange={e=>{setExF({...exF,name:e.target.value});setExSearch(e.target.value);}}
          placeholder="e.g. Squat" style={{width:"100%",background:G.glass2,border:`1px solid ${G.glassBorder}`,borderRadius:14,padding:"12px 14px",color:G.txt,fontSize:15,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
        {exSuggestions.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1b26",border:`1px solid ${G.glassBorder2}`,borderRadius:12,zIndex:50,overflow:"hidden"}}>
          {exSuggestions.map((s,i)=><button key={i} onClick={()=>{setExF({...exF,name:s});setExSearch("");}}
            style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:G.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",borderBottom:i<exSuggestions.length-1?`1px solid ${G.glassBorder}`:"none"}}>{s}</button>)}
        </div>}
      </div>
      {exF.type==="Strength"&&<div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Sets" type="number" value={exF.sets} set={v=>setExF({...exF,sets:v})}/></div>
        <div style={{flex:1}}><Fld label="Reps" type="number" value={exF.reps} set={v=>setExF({...exF,reps:v})}/></div>
        <div style={{flex:1}}><Fld label="Wt(lbs)" type="number" value={exF.weight} set={v=>setExF({...exF,weight:v})}/></div>
      </div>}
      {(exF.type==="Cardio"||exF.type==="Sport")&&<div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Dur(min)" type="number" value={exF.duration} set={v=>setExF({...exF,duration:v})}/></div>
        <div style={{flex:1}}><Fld label="Dist(mi)" type="number" value={exF.distance} set={v=>setExF({...exF,distance:v})}/></div>
      </div>}
      <Fld label="Notes" type="textarea" value={exF.notes} set={v=>setExF({...exF,notes:v})} ph="Optional"/>
      <Btn onClick={addExercise} sx={{width:"100%"}}>Log Exercise</Btn>
    </Glass>}

    {active==="water"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.teal}`}}>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {[8,12,16,20,24,32].map(oz=><button key={oz} onClick={()=>{quickWater(oz);setActive(null);}}
          style={{background:`${G.teal}15`,border:`1px solid ${G.teal}25`,borderRadius:20,padding:"8px 14px",color:G.teal,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+{oz}oz</button>)}
      </div>
      <Fld label="Custom oz" type="number" value={waterF.oz} set={v=>setWaterF({...waterF,oz:v})}/>
      <Fld label="Type" opts={["Water","Electrolytes","Tea","Coffee","Juice","Smoothie"]} value={waterF.type} set={v=>setWaterF({...waterF,type:v})}/>
      <Btn onClick={addWater} sx={{width:"100%"}}>Log Water</Btn>
    </Glass>}

    {active==="supps"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.purple}`}}>
      <Fld label="Supplement" opts={SUPP_LIST} value={suppF.name} set={v=>setSuppF({...suppF,name:v})}/>
      <Fld label="Dose" value={suppF.dosage} set={v=>setSuppF({...suppF,dosage:v})} ph="e.g. 5g"/>
      <Fld label="Timing" opts={["Morning","Pre-workout","Post-workout","With meal","Evening","Before bed"]} value={suppF.timing} set={v=>setSuppF({...suppF,timing:v})}/>
      <Btn onClick={addSupp} sx={{width:"100%"}}>Log Supplement</Btn>
    </Glass>}

    {active==="sleep"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.indigo}`}}>
      <Fld label="Hours" type="number" value={sleepF.hours} set={v=>setSleepF({...sleepF,hours:v})} step=".25"/>
      <Fld label="Quality" opts={["Excellent","Good","Fair","Poor"]} value={sleepF.quality} set={v=>setSleepF({...sleepF,quality:v})}/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Bedtime" type="time" value={sleepF.bedtime} set={v=>setSleepF({...sleepF,bedtime:v})}/></div>
        <div style={{flex:1}}><Fld label="Wake" type="time" value={sleepF.wakeTime} set={v=>setSleepF({...sleepF,wakeTime:v})}/></div>
      </div>
      <Fld label="Notes" type="textarea" value={sleepF.notes} set={v=>setSleepF({...sleepF,notes:v})} ph="Optional"/>
      <Btn onClick={addSleep} sx={{width:"100%"}}>Log Sleep</Btn>
    </Glass>}

    {active==="body"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.blue}`}}>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Weight(lbs)" type="number" value={bodyF.weight} set={v=>setBodyF({...bodyF,weight:v})} step=".1"/></div>
        <div style={{flex:1}}><Fld label="BF%" type="number" value={bodyF.bodyFat} set={v=>setBodyF({...bodyF,bodyFat:v})} step=".1"/></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Chest" type="number" value={bodyF.chest} set={v=>setBodyF({...bodyF,chest:v})}/></div>
        <div style={{flex:1}}><Fld label="Waist" type="number" value={bodyF.waist} set={v=>setBodyF({...bodyF,waist:v})}/></div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Fld label="Arms" type="number" value={bodyF.arms} set={v=>setBodyF({...bodyF,arms:v})}/></div>
        <div style={{flex:1}}><Fld label="Thighs" type="number" value={bodyF.thighs} set={v=>setBodyF({...bodyF,thighs:v})}/></div>
      </div>
      <Btn onClick={addBody} sx={{width:"100%"}}>Save Measurements</Btn>
    </Glass>}

    {active==="mood"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.pink}`}}>
      <Slider label="Energy" value={moodF.energy} set={v=>setMoodF({...moodF,energy:v})} color={G.moss}/>
      <Slider label="Stress" value={moodF.stress} set={v=>setMoodF({...moodF,stress:v})} color={G.red}/>
      <Fld label="Mood" opts={["Excellent","Good","Okay","Low","Bad"]} value={moodF.mood} set={v=>setMoodF({...moodF,mood:v})}/>
      <Fld label="Steps" type="number" value={moodF.steps} set={v=>setMoodF({...moodF,steps:v})}/>
      <Btn onClick={addMood} sx={{width:"100%"}}>Log Lifestyle</Btn>
    </Glass>}

    {active==="pain"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.red}`}}>
      <Fld label="Location" opts={PAIN_LOCS} value={painF.location} set={v=>setPainF({...painF,location:v})}/>
      <Fld label="Type" opts={PAIN_TYPES} value={painF.type} set={v=>setPainF({...painF,type:v})}/>
      <Slider label="Severity" value={painF.severity} set={v=>setPainF({...painF,severity:v})} color={G.red}/>
      <Fld label="During activity?" value={painF.during} set={v=>setPainF({...painF,during:v})} ph="e.g. squatting"/>
      <Btn onClick={addPain} sx={{width:"100%"}}>Log Pain</Btn>
    </Glass>}

    {active==="postWO"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.amber}`}}>
      <Slider label="RPE (Rate of Perceived Exertion)" value={pwF.rpe} set={v=>setPwF({...pwF,rpe:v})} color={G.orange}/>
      <Slider label="Energy" value={pwF.energy} set={v=>setPwF({...pwF,energy:v})} color={G.moss}/>
      <Slider label="Pump" value={pwF.pump} set={v=>setPwF({...pwF,pump:v})} color={G.purple}/>
      <Fld label="Mood" opts={["Fired Up","Strong","Good","Okay","Drained","Frustrated"]} value={pwF.mood} set={v=>setPwF({...pwF,mood:v})}/>
      <Fld label="Soreness" value={pwF.soreness} set={v=>setPwF({...pwF,soreness:v})} ph="e.g. legs, upper back"/>
      <Btn onClick={addPW} sx={{width:"100%"}}>Save Post-Workout</Btn>
    </Glass>}

    {active==="health"&&<Glass style={{marginTop:6,marginBottom:6,borderRadius:16,padding:16,borderTop:`3px solid ${G.red}`}}>
      <div style={{textAlign:"center",padding:"4px 0 12px"}}>
        <div style={{fontSize:12,color:G.sub,lineHeight:1.5,marginBottom:12}}>Screenshot any Apple Health screen — AI extracts the data automatically.</div>
        <Btn onClick={()=>healthFileRef.current?.click()} disabled={healthL} sx={{padding:"12px 24px",fontSize:14}}>{healthL?"Analyzing...":"📸 Upload Screenshot"}</Btn>
        <input ref={healthFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])analyzeHealth(e.target.files[0]);}}/>
      </div>
      {healthR?.error&&<div style={{color:G.red,fontSize:12,marginTop:8}}>{healthR.error}</div>}
      {healthR&&!healthR.error&&<div style={{background:G.glass,borderRadius:12,padding:12,marginTop:8}}>
        <div style={{fontSize:12,fontWeight:700,color:G.moss,marginBottom:4}}>✓ Imported: {healthR.type?.replace(/_/g," ")}</div>
        <div style={{fontSize:11,color:G.dim}}>{healthR.summary}</div>
      </div>}
    </Glass>}

    {/* Today Feed */}
    {todayFeed.length>0&&<div style={{marginTop:18}}>
      <div style={{fontSize:10,fontWeight:700,color:G.dim,letterSpacing:1,marginBottom:8}}>TODAY'S LOG</div>
      {todayFeed.map((f,i)=><EI key={f.k+i} primary={f.label} secondary={f.sub} color={f.color}/>)}
    </div>}
  </div>;
}
