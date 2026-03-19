// src/helpers.js — Utility functions

import { getData, setData as setStorageData } from "./storage.js";

export const SK="vitals-v5";
export const td=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const hr=()=>new Date().getHours();
export async function ld(){try{return await getData(SK);}catch{return null;}}
export async function sv(d){try{await setStorageData(SK,d);}catch(e){console.error(e);}}
export function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}
export function vo2(d,t){const m=d*1609.34;return Math.round(((m*(12/t)-504.9)/44.73)*10)/10;}
export const haptic=(ms=50)=>{try{navigator?.vibrate?.(ms);}catch{}};
