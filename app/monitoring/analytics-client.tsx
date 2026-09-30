'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {safePath,type EventName} from './privacy';
type Entry={id:string;name:EventName;path:string;device:string;referrer:string;query?:string;results?:number};
let queue:Entry[]=[];
const preference='ksk:analytics-consent',identity='ksk:analytics-browser';
function allowed(){try{return localStorage.getItem(preference)==='yes'&&navigator.doNotTrack!=='1'&&!location.pathname.startsWith('/admin')&&!location.pathname.startsWith('/moderation');}catch{return false;}}
function visitor(){
 const saved=JSON.parse(localStorage.getItem(identity)||'null');
 if(saved?.expires>Date.now())return saved.id as string;
 const id=crypto.randomUUID();localStorage.setItem(identity,JSON.stringify({id,expires:Date.now()+30*86400000}));return id;
}
export function track(name:EventName,extra:{query?:string;results?:number}={}){
 if(typeof window==='undefined'||!allowed())return;
 queue.push({id:crypto.randomUUID(),name,path:safePath(location.pathname),device:/iPad|Tablet/i.test(navigator.userAgent)?'Tablet':/Mobile|Android/i.test(navigator.userAgent)?'Mobile':'Desktop',referrer:document.referrer,...extra});
 if(queue.length>=20)flush();
}
export function flush(){
 if(!queue.length||!allowed()){queue=[];return;}
 try{
  const events=queue.splice(0,20),body=JSON.stringify({consent:true,visitor:visitor(),events});
  void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
 }catch{queue=[];}
}
export default function Analytics(){
 const path=usePathname(),[choice,setChoice]=useState<string|null>('loading'),[open,setOpen]=useState(false);
 useEffect(()=>{
  try{setChoice(navigator.doNotTrack==='1'?'no':localStorage.getItem(preference));}catch{setChoice('no');}
  const interval=setInterval(flush,10000);
  const visibility=()=>{if(document.visibilityState==='hidden')flush();};
  const error=()=>track('frontend_error');
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',flush);window.addEventListener('error',error);window.addEventListener('unhandledrejection',error);
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',flush);window.removeEventListener('error',error);window.removeEventListener('unhandledrejection',error);};
 },[]);
 useEffect(()=>{
  if(choice!=='yes')return;
  track('page_view');
  if(path.startsWith('/india/')||path.startsWith('/destination/'))track('view_destination');
  if(path.startsWith('/experience/')&&!path.includes('sample-'))track('view_review');
 },[path,choice]);
 function choose(value:string){try{localStorage.setItem(preference,value);if(value==='no'){localStorage.removeItem(identity);queue=[];}}catch{}setChoice(value);setOpen(false);}
 if(path.startsWith('/admin')||path.startsWith('/moderation')||choice==='loading')return null;
 return <>{(choice===null||open)?<aside className="analytics-choice" aria-label="Analytics preference"><div><strong>Help improve Kisse Safar Ke?</strong><p>Allow optional usage analytics: pages, search terms and feature activity. No recordings, precise location, email or IP addresses are stored. Browser IDs and events expire after 30 days.</p></div><button onClick={()=>choose('no')}>No thanks</button><button onClick={()=>choose('yes')}>Allow analytics</button></aside>:<button className="analytics-settings" onClick={()=>setOpen(true)}>Analytics preferences</button>}</>;
}
