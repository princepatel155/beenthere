export const eventNames = ['page_view','search_destination','view_destination','view_review','signup_started','signup_completed','review_started','review_submitted','photo_uploaded','helpful_clicked','save_place','trip_created','share_clicked','frontend_error'] as const;
export type EventName = typeof eventNames[number];
export const isOwner = (email?:string) => email?.toLowerCase()==='princepatel1551756@gmail.com';
export function safePath(value:unknown){
 if(typeof value!=='string')return '/other';
 const path=value.split(/[?#]/)[0];
 if(['/','/explore','/stories','/login','/profile','/saved'].includes(path))return path;
 if(/^\/india\/[a-z0-9-]{1,80}\/[a-z0-9-]{1,100}$/.test(path))return path;
 if(path.startsWith('/destination/'))return '/destination';
 if(path.startsWith('/experience/'))return '/experience';
 if(path.startsWith('/travelers/'))return '/travelers';
 return '/other';
}
export function safeSearch(value:unknown){
 if(typeof value!=='string'||/@|https?:|www\.|\d{5}|[<>]/i.test(value))return '[redacted]';
 return value.replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,' ').trim().slice(0,80).toLowerCase();
}
export function safeReferrer(value:unknown){
 try{const url=new URL(String(value));return ['http:','https:'].includes(url.protocol)?url.hostname.slice(0,120):'Direct / unknown';}catch{return 'Direct / unknown';}
}
export function istDayStart(now=new Date()){
 const day=new Date(now.getTime()+19800000).toISOString().slice(0,10);
 return new Date(day+'T00:00:00+05:30');
}
