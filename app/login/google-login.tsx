"use client";
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { MapPin,Bookmark,PenLine,ArrowLeft,ShieldCheck } from 'lucide-react';
type GoogleID={initialize:(options:Record<string,unknown>)=>void;renderButton:(element:HTMLElement,options:Record<string,unknown>)=>void;disableAutoSelect:()=>void};
declare global{interface Window{google?:{accounts:{id:GoogleID}}}}
let sdkPromise:Promise<void>|undefined;
function loadGoogle(){
 if(window.google)return Promise.resolve();
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=()=>resolve();script.onerror=()=>{sdkPromise=undefined;script.remove();reject(new Error('Google could not load. Check your connection and try again.'));};document.head.appendChild(script);});
 return sdkPromise;
}
export default function GoogleLogin(){
 const button=useRef<HTMLDivElement>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'unconfigured'|'saving'|'error'>('loading'),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;
  async function init(){try{const r=await fetch('/api/auth/google',{cache:'no-store'});const config:any=await r.json();if(cancelled)return;if(!r.ok)throw Error(config.error);if(!config.configured){setStatus('unconfigured');return;}
   await loadGoogle();if(cancelled||!button.current||!window.google)return;
   window.google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,auto_select:false,use_fedcm_for_button:true,context:'signin',ux_mode:'popup',callback:async(result:{credential:string})=>{setStatus('saving');setError('');try{
    const response=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:result.credential})});
    const body:any=await response.json();if(!response.ok)throw Error(body.error);
    const value=new URLSearchParams(window.location.search).get('returnTo')||'/profile';
    const next=new URL(value,window.location.origin);window.location.assign(next.origin===window.location.origin?next.pathname+next.search:'/profile');
   }catch(e:any){setError(e.message||'Sign-in failed. Please try again.');setStatus('error');}}});
   window.google.accounts.id.renderButton(button.current,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:300,logo_alignment:'left'});setStatus('ready');
  }catch(e:any){if(!cancelled){setError(e.message);setStatus('error');}}}
  init();return()=>{cancelled=true;};
 },[]);
 return <main className="login-shell"><Link href="/" className="brand" aria-label="Kisse Safar Ke home"><span className="brand-icon"><MapPin size={28}/></span><span className="brand-name"><strong>Kisse</strong><span>Safar Ke</span></span></Link><div className="login-card"><div className="eyebrow">EVERY JOURNEY STARTS SOMEWHERE</div><h1>A familiar face.<br/>A whole new journey.</h1><p className="login-intro">Sign in or create your free Kisse Safar Ke account.</p>
 <div ref={button} className={'google-button-slot '+(status==='saving'?'disabled-google':'')}/>
 {status==='loading'&&<p role="status" className="muted">Getting Google sign-in ready…</p>}
 {status==='saving'&&<p role="status" className="muted">Signing you in securely…</p>}
 {status==='unconfigured'&&<><button className="google-unavailable" disabled><span>G</span>Continue with Google</button><p className="login-setup" role="status">Google sign-in is coming soon. You can explore Kisse Safar Ke while the site owner completes setup.</p></>}
 {status==='error'&&<div className="login-error" role="alert"><p>{error}</p><button className="outline" onClick={()=>window.location.reload()}>Try again</button></div>}
 <p className="login-account-note">New here? Your first Google sign-in creates your account automatically.</p><div className="login-benefits"><span><Bookmark size={18}/>Save ideas for your next trip</span><span><PenLine size={18}/>Share your own experiences</span><span><ShieldCheck size={18}/>No new password to remember</span></div><p className="login-privacy">Google shares your account identifier, name, and email to create and protect your account. Your email is never shown on public reviews.</p></div><Link className="back-link" href="/"><ArrowLeft size={15}/>Keep exploring India</Link></main>;
}
