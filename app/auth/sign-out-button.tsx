'use client';

import {useEffect,useState} from 'react';
import {LogOut} from 'lucide-react';
import {toast} from 'sonner';

const logoutEvent='ksk:sign-out';

export function SessionSync(){
 useEffect(()=>{
  const sync=(event:StorageEvent)=>{if(event.key===logoutEvent)window.location.replace('/');};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
  window.addEventListener('storage',sync);
  window.addEventListener('pageshow',restore);
  return()=>{window.removeEventListener('storage',sync);window.removeEventListener('pageshow',restore);};
 },[]);
 return null;
}

export default function SignOutButton({className=''}:{className?:string}){
 const [busy,setBusy]=useState(false);
 async function signOut(){
  if(busy)return;
  setBusy(true);
  try{
   const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store'});
   const result=await response.json() as {signedOut?:boolean;error?:string};
   if(!response.ok&&!result.signedOut)throw Error(result.error||'Unable to sign out. Please try again.');
   // A Google session is separate from this website's session.
   try{window.google?.accounts.id.disableAutoSelect();}catch{/* Sign-out must not depend on the Google SDK. */}
   try{localStorage.setItem(logoutEvent,crypto.randomUUID());}catch{/* Storage may be disabled in private browsing. */}
   // A full navigation discards cached authenticated React pages and private trip state.
   window.location.replace('/');
  }catch(error){toast.error(error instanceof Error?error.message:'Unable to sign out. Please try again.');setBusy(false);}
 }
 return <button type="button" className={'sign-out-button '+className} onClick={signOut} disabled={busy} aria-busy={busy}><LogOut size={15}/><span>{busy?'Signing out…':'Sign out'}</span></button>;
}
