// src/pages/Coach.jsx — AI Coach: Chat, Analyze, History, Memory

import { useState, useEffect, useRef } from "react";
import { G } from "../theme.js";
import { td, uid, sv } from "../helpers.js";
import { useVitalsIntel } from "../intel.js";
import { Glass, Btn, Fld } from "../components/Glass.jsx";
import { callClaude, hasApiKey } from "../api.js";

export default function Coach({data,setData}){
  const intel=useVitalsIntel(data);
  const [tab,setTab]=useState("chat");
  const [chatInput,setChatInput]=useState("");const [chatHistory,setChatHistory]=useState([]);const [chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);
  const [genLoading,setGenLoading]=useState(false);const [genErr,setGenErr]=useState(null);
  const [err,setErr]=useState(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatHistory]);

  const buildContext=()=>{
    const mem=data.aiMemory.slice(-12).map(m=>`[${m.date}] ${m.summary}`).join("\n");
    const painH=data.painLog.map(p=>`${p.date}:${p.location}(${p.type},sev:${p.severity})${p.resolved?"[resolved]":"[active]"}`).join("\n");
    const prH=data.prs.slice(-25).map(p=>`${p.date}:${p.exercise} ${p.repMax}@${p.weight}lbs`).join("\n");
    const pwH=data.postWorkout.slice(-14).map(p=>`${p.date}:RPE${p.rpe} Energy${p.energy} ${p.mood}`).join("\n");
    const suppH=[...new Set(data.supplements.map(s=>s.name))].join(", ");
    const hydAvg=intel.avgWater!=null?Math.round(intel.avgWater):0;
    const hrD=data.heartRate.slice(-7).map(h=>`${h.date}:rest${h.resting} HRV:${h.hrv}`).join("\n");
    return{mem,painH,prH,pwH,suppH,hydAvg,hrD};
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

  const sendChat=async()=>{if(!chatInput.trim()||chatLoading)return;
    const userMsg={role:"user",content:chatInput};
    const newHistory=[...chatHistory,userMsg];
    setChatHistory(newHistory);setChatInput("");setChatLoading(true);setErr(null);
    try{
      const sys=buildCoachSys()+`\n\nThis is a conversation. Answer the user's specific question using their data. Be concise (1-3 short paragraphs max). If they mention food they ate, exercises, sleep, supplements etc — offer to log it or log it directly if they ask. Always be specific, never generic.`;
      const messages=newHistory.slice(-10);
      const txt=await callClaude({system:sys,messages,maxTokens:1000});
      const{cleaned}=executeLogBlock(txt);
      setChatHistory([...newHistory,{role:"assistant",content:cleaned}]);
    }catch(e){setErr(e.message||"Failed.");setChatHistory(newHistory);}
    setChatLoading(false);
  };

  const genAnalysis=async()=>{setGenLoading(true);setGenErr(null);try{
    const sys=buildCoachSys()+`\n\nGive a comprehensive but readable analysis. Structure it naturally — don't use headers like "NUTRITION ANALYSIS" or clinical formatting. Instead, flow through what's going well, what could use attention, and 2-3 specific action items. Keep it to about 300 words. Reference their actual numbers.\n\nCross-reference domains: connect sleep to training performance, nutrition to recovery, hydration to energy, pain to exercise selection. Spot patterns.\n\nEnd with: [MEMORY]: one-sentence key takeaway for next time.`;
    const payload={recentNutrition:data.nutrition.slice(-28),recentTraining:data.training.slice(-28),recentBody:data.bodyMetrics.slice(-8),recentSleep:data.sleep.slice(-21),recentLifestyle:data.lifestyle.slice(-21)};
    const txt=await callClaude({system:sys,messages:[{role:"user",content:`Here's my recent data — give me your take:\n${JSON.stringify(payload,null,2)}`}]});
    const mM=txt.match(/\[MEMORY\]:?\s*(.+)/);const mN=mM?mM[1].trim():txt.slice(0,120);
    const nd={...data,insights:[...data.insights,{id:uid(),date:td(),text:txt}],aiMemory:[...data.aiMemory,{id:uid(),date:td(),summary:mN}]};setData(nd);sv(nd);
  }catch(e){setGenErr(e.message||"Failed.");}setGenLoading(false);};

  const tabList=[["chat","💬 Chat"],["gen","📊 Analyze"],["hist","History"],["mem","Memory"]];

  return <div>
    {/* Stats bar */}
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {intel.recoveryScore!=null&&<Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}>
        <div style={{fontSize:9,color:G.dim,fontWeight:700}}>Recovery</div>
        <div style={{fontSize:22,fontWeight:800,color:intel.recoveryColor}}>{intel.recoveryScore}</div>
      </Glass>}
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>Analyses</div><div style={{fontSize:22,fontWeight:800,color:G.moss}}>{data.insights.length}</div></Glass>
      <Glass style={{flex:1,padding:"10px 14px",borderRadius:14,textAlign:"center"}}><div style={{fontSize:9,color:G.dim,fontWeight:700}}>Memory</div><div style={{fontSize:22,fontWeight:800,color:G.purple}}>{data.aiMemory.length}</div></Glass>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:2}}>
      {tabList.map(([k,l])=><Btn key={k} onClick={()=>setTab(k)} v={tab===k?"primary":"secondary"} sx={{flexShrink:0,padding:"9px 14px",fontSize:12}}>{l}</Btn>)}
    </div>

    {!hasApiKey()&&<Glass style={{marginBottom:14,padding:14,borderRadius:16}}><div style={{fontSize:13,color:G.orange,fontWeight:600}}>Add your API key in Settings to use AI features</div></Glass>}

    {/* Chat */}
    {tab==="chat"&&<div>
      <Glass style={{borderRadius:20,padding:0,overflow:"hidden",marginBottom:12}}>
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
        <div style={{display:"flex",gap:8,padding:"8px 12px 12px",borderTop:`1px solid ${G.glassBorder}`}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}}
            placeholder="Ask your coach..." style={{flex:1,background:G.glass,border:`1px solid ${G.glassBorder}`,borderRadius:20,padding:"10px 16px",color:G.txt,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{background:`linear-gradient(135deg,${G.gMoss[0]},${G.gMoss[1]})`,border:"none",borderRadius:20,width:44,height:44,color:"#fff",fontSize:18,cursor:"pointer",opacity:(chatLoading||!chatInput.trim())?.5:1,display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
        </div>
      </Glass>
      {err&&<div style={{color:G.red,fontSize:12,marginBottom:8}}>{err}</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {["Should I train today?","I had chicken rice and avocado for lunch","What should I eat for dinner?","Build me a push workout","Log 7.5 hours of sleep, good quality","How's my recovery looking?"].map((q,i)=>
          <button key={i} onClick={()=>setChatInput(q)} style={{background:G.glass,border:`1px solid ${G.glassBorder}`,borderRadius:20,padding:"6px 12px",color:G.sub,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{q}</button>)}
      </div>
    </div>}

    {/* Full Analysis */}
    {tab==="gen"&&<div>
      <div style={{textAlign:"center",marginBottom:18}}>
        <Btn onClick={genAnalysis} disabled={genLoading} sx={{padding:"14px 32px",fontSize:15,borderRadius:16}}>{genLoading?"Analyzing...":"⬡ Full Analysis"}</Btn>
        {genErr&&<div style={{color:G.red,fontSize:12,marginTop:6}}>{genErr}</div>}
      </div>
      {data.insights.length>0&&<Glass style={{borderRadius:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:700,color:G.moss}}>⬡ Latest</span>
          <span style={{fontSize:11,color:G.dim}}>{data.insights[data.insights.length-1].date}</span>
        </div>
        <div style={{fontSize:13,color:G.sub,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{data.insights[data.insights.length-1].text}</div>
      </Glass>}
    </div>}

    {/* History */}
    {tab==="hist"&&<div>{data.insights.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>No analyses yet</div>:data.insights.slice().reverse().map(i=><Glass key={i.id} style={{marginBottom:10,borderRadius:16}}><div style={{fontSize:11,color:G.dim,marginBottom:6}}>{i.date}</div><div style={{fontSize:13,color:G.sub,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{i.text}</div></Glass>)}</div>}

    {/* Memory */}
    {tab==="mem"&&<div>
      {data.aiMemory.length===0?<div style={{textAlign:"center",padding:28,color:G.dim}}>No memory yet</div>:data.aiMemory.slice().reverse().map(m=><Glass key={m.id} style={{marginBottom:6,borderRadius:14}}><div style={{fontSize:11,color:G.dim}}>{m.date}</div><div style={{fontSize:13,color:G.sub,marginTop:2}}>{m.summary}</div></Glass>)}
    </div>}
  </div>;
}
