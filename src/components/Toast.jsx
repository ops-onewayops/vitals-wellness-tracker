// src/components/Toast.jsx

import { useEffect } from "react";
import { G } from "../theme.js";

export default function Toast({message,color,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[onDone]);
  return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:1200,background:color||G.moss,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",animation:"toastIn .3s ease",pointerEvents:"none"}}>{message}</div>;
}
