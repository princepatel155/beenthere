'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Camera, MapPin, Search, X, MessageCircle, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Post, type Destination, samplePosts, photoUrl } from './data';
import { ReportButton } from './member-features';
import { experienceTopics, photoTopics, regions, matchesCategory, matchesSearch, recentReports, costGroups, formatVisit, formatPosted, type TravelerComment } from './experience-utils';

export function ExperiencePicker({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <div className="experience-picker"><p>What do you want to know about?</p><div>{experienceTopics.map(([name,category,icon])=><button key={name} aria-pressed={value===category} onClick={()=>onChange(value===category?'All experiences':category)}><span aria-hidden="true">{icon}</span>{name}</button>)}</div></div>;
}

export function SearchResults({query,category,renderPost,onClear}:{query:string;category:string;renderPost:(p:Post)=>ReactNode;onClear:()=>void}) {
  const [result,setResult]=useState<{posts:Post[];loading:boolean;error:string}>({posts:[],loading:true,error:''});
  useEffect(()=>{
    const controller=new AbortController();
    setResult({posts:[],loading:true,error:''});
    const timer=setTimeout(async()=>{
      try {
        const response=await fetch('/api/search?'+new URLSearchParams({q:query,category}),{signal:controller.signal});
        const data=await response.json() as {posts:Post[];error?:string};
        if(!response.ok)throw Error(data.error);
        setResult({posts:data.posts,loading:false,error:''});
      }catch(error){if(!controller.signal.aborted)setResult({posts:[],loading:false,error:error instanceof Error?error.message:'Search failed.'});}
    },300);
    return()=>{clearTimeout(timer);controller.abort();};
  },[query,category]);
  const samples=samplePosts.filter(p=>matchesCategory(p,category)&&matchesSearch([p.title,p.body,p.destination,p.state,p.category,p.place].join(' '),query));
  return <section id="experience-results" className="experience-results"><div className="section-heading"><div><span className="section-kicker">THE DETAILS YOU CAME FOR</span><h2>{query.trim()?`Results for “${query.trim()}”`:'Explore '+category.toLowerCase()}</h2><p>Places, services, roads and stories shared by travelers.</p></div><button className="text-link" onClick={onClear}><X size={15}/>Clear search</button></div>
    <div aria-live="polite">{result.loading?<p className="muted">Searching traveler experiences…</p>:result.error?<p role="alert" className="error-banner">{result.error}</p>:<p className="muted">{result.posts.length}{result.posts.length===60?'+':''} community results{result.posts.length===60?' · showing the latest 60':''}</p>}</div>
    {!result.loading&&!result.error&&result.posts.length===0&&<div className="quiet-empty"><Search size={23}/><div><h3>No community reports match yet.</h3><p>Try a destination or fewer words. A missing result means no matching report, not that a service is unavailable.</p></div></div>}
    <div className="post-columns">{result.posts.map(p=><div key={p.id}>{renderPost(p)}</div>)}</div>
    {!result.loading&&samples.length>0&&<details className="sample-results"><summary>View {samples.length} illustrative sample {samples.length===1?'experience':'experiences'}</summary><p className="muted">Examples of how the platform works. These are not current visitor reports.</p><div className="post-columns">{samples.map(p=><div key={p.id}>{renderPost(p)}</div>)}</div></details>}
  </section>;
}

export function RegionExplorer({destinations,state,onState}:{destinations:Destination[];state:string;onState:(value:string)=>void}) {
  const [region,setRegion]=useState('North');
  return <section className="region-explorer"><div className="region-copy"><span className="section-kicker">A COUNTRY OF POSSIBILITIES</span><h2>Find your corner<br/>of India.</h2><p>Choose a region, then a state or union territory. Follow a destination to its traveler experiences.</p><small>Regional guide · schematic, not to scale</small></div><div className="region-navigation"><div className="region-map" aria-label="Explore India by region">{Object.keys(regions).map(name=><button key={name} className={'region-pin region-'+name.toLowerCase()} aria-pressed={region===name} onClick={()=>{setRegion(name);onState('All India');}}><MapPin size={15}/>{name}</button>)}</div><div className="state-pills" aria-label={region+' states and union territories'}>{regions[region].map(name=><button key={name} aria-pressed={state===name} onClick={()=>onState(state===name?'All India':name)}>{name}<span>{destinations.filter(d=>d.state===name).length} places</span></button>)}</div>{state!=='All India'&&<button className="text-link" onClick={()=>onState('All India')}>Clear {state} filter <X size={13}/></button>}</div></section>;
}

export function RecentTravelers({posts,onShare,destination,loading=false,error=false}:{posts:Post[];onShare:()=>void;destination?:string;loading?:boolean;error?:boolean}) {
  const recent=recentReports(posts).slice(0,4);
  return <section className="recent-travelers"><div className="section-heading"><div><span className="section-kicker">RECENT FROM TRAVELERS</span><h2>{destination?'Fresh from '+destination+'.':'Happening around India.'}</h2><p>Visits in the last 30 days. Personal reports, not live advisories.</p></div><button className="text-link" onClick={onShare}>Share an update <ArrowUpRight size={16}/></button></div>
    {loading?<p className="muted" role="status">Loading recent traveler reports…</p>:error?<p className="muted">Recent reports could not be loaded. Try refreshing the community.</p>:recent.length?<div className="recent-grid">{recent.map(p=><Link key={p.id} href={'/experience/'+p.id} className="recent-card"><span><MapPin size={13}/>{p.destination} · {p.category}</span><h3>{p.title}</h3><p>{p.body}</p><small>Visited {formatVisit(p.visited)}<br/>Posted {formatPosted(p.created)}</small></Link>)}</div>:<div className="quiet-empty"><MapPin size={25}/><div><h3>The next useful update could be yours.</h3><p>No community visits reported in the last 30 days here yet. Share a road condition, a price, or a tip from your own trip.</p></div></div>}
  </section>;
}

export function RealCosts({posts,destination,onShare}:{posts:Post[];destination:string;onShare:()=>void}) {
  const groups=costGroups(posts);
  return <section className="real-costs"><div className="section-heading"><div><span className="section-kicker">REAL COSTS · COMMUNITY REPORTED</span><h2>What travelers spent.</h2><p>{destination} visits from the last 180 days. Amounts are grouped by category and payment basis.</p></div></div>
    {groups.length?<div className="cost-grid">{groups.map(group=><article key={group.category+group.basis+group.days} className="cost-card"><span>{group.category}{group.days?` · ${group.days}-day trip`:''}</span><strong>₹{Math.min(...group.amounts).toLocaleString('en-IN')}{group.amounts.length>1&&Math.min(...group.amounts)!==Math.max(...group.amounts)?' – ₹'+Math.max(...group.amounts).toLocaleString('en-IN'):''}</strong><b>{group.basis}</b><small>{group.amounts.length} {group.amounts.length===1?'report · one data point, not a typical price':'reports · reported range'}<br/>Latest visit {formatVisit(group.visited)}<br/>Updated {formatPosted(group.updated)}</small></article>)}</div>:<div className="quiet-empty"><span className="rupee-mark">₹</span><div><h3>Help build a useful cost picture.</h3><p>No comparable community prices yet. Add what you paid and whether it was per person, per night, per vehicle, or for the whole trip.</p><button className="text-link" onClick={onShare}>Share a cost <ArrowRight size={15}/></button></div></div>}
    <p className="data-note">Self-reported amounts, not quotes or verified rates. Sample stories and costs without a payment basis are excluded. Different services can still have different inclusions; read the individual experience before comparing.</p>
  </section>;
}

export function TravelerPhotos({posts,onShare}:{posts:Post[];onShare:()=>void}) {
  const [category,setCategory]=useState('All photos');
  const photos=posts.filter(p=>!p.sample).flatMap(post=>post.photos.map(id=>({id,post,category:post.photo_details?.find(d=>d.id===id)?.category||'Other',caption:post.photo_details?.find(d=>d.id===id)?.caption||''})));
  const [selected,setSelected]=useState<string|null>(null);
  const photo=photos.find(p=>p.id===selected);
  const filtered=photos.filter(p=>category==='All photos'||p.category===category);
  return <section className="traveler-photos"><div className="section-heading"><div><span className="section-kicker">THROUGH A TRAVELER’S LENS</span><h2>See what it was really like.</h2><p>Rooms, menus, roads and the views between. Photos uploaded by travelers.</p></div></div><div className="destination-tabs" aria-label="Photo categories">{['All photos',...photoTopics].map(topic=><button key={topic} aria-pressed={category===topic} onClick={()=>setCategory(topic)}>{topic}</button>)}</div>
    {filtered.length?<div className="traveler-photo-grid">{filtered.map(photo=><button key={photo.id} onClick={()=>setSelected(photo.id)}><img loading="lazy" src={photoUrl(photo.id)} alt={photo.caption||photo.category+' shared by '+photo.post.author}/><span>{photo.category}<small>Visited {formatVisit(photo.post.visited)}</small></span></button>)}</div>:<div className="quiet-empty"><Camera size={25}/><div><h3>{category==='All photos'?'Every photo adds a little context.':'No '+category.toLowerCase()+' photos yet.'}</h3><p>Share your own travel photos with an experience. Landscape artwork and illustrative photos are not traveler uploads.</p><button className="text-link" onClick={onShare}>Add an experience with photos <ArrowRight size={15}/></button></div></div>}
    <Dialog open={!!photo} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="traveler-photo-dialog"><DialogHeader><DialogTitle>{photo?.category} · {photo?.post.destination}</DialogTitle><DialogDescription>Shared by {photo?.post.author}{photo?' · Visited '+formatVisit(photo.post.visited):''}</DialogDescription></DialogHeader>{photo&&<><img src={photoUrl(photo.id)} alt={photo.caption||photo.category+' traveler photo'}/>{photo.caption&&<p>{photo.caption}</p>}<Link className="text-link" href={'/experience/'+photo.post.id}>Read the experience <ArrowUpRight size={15}/></Link></>}</DialogContent></Dialog>
  </section>;
}

export function DestinationHub({posts,destination,renderPost,onShare,loading,error}:{posts:Post[];destination:string;renderPost:(p:Post)=>ReactNode;onShare:(category?:string)=>void;loading:boolean;error:boolean}) {
  const [tab,setTab]=useState('Overview');
  useEffect(()=>setTab('Overview'),[destination]);
  const actual=posts.filter(p=>!p.sample);
  const rating=actual.length?(actual.reduce((sum,p)=>sum+p.rating,0)/actual.length).toFixed(1):null;
  const recent=recentReports(actual);
  const latest=[...actual].sort((a,b)=>b.visited.localeCompare(a.visited))[0];
  const tabs=[['Overview','Overview'],...experienceTopics.map(([name,category])=>[name,category]),['Facilities','Facilities & Network'],['Weather','Weather & Conditions'],['Trip stories','Trip stories'],['Traveler photos','Photos'],['Recent reports','Recent']];
  const visible=posts.filter(p=>matchesCategory(p,tab));
  return <div className="destination-hub"><div className="destination-stats"><div><b>{loading?'…':error?'—':rating?rating+' / 5':'No ratings yet'}</b><span>{actual.length} community {actual.length===1?'experience':'experiences'} · samples excluded</span></div><div><b>{loading?'…':error?'—':recent.length} recent reports</b><span>Reported visits in the last 30 days</span></div><div><b>{loading?'…':error?'—':actual.filter(p=>p.price!==null).length} cost reports</b><span>Payment basis shown on each report</span></div><div><b>{loading?'…':error?'—':actual.reduce((n,p)=>n+p.photos.length,0)} traveler photos</b><span>{latest?'Latest visit '+formatVisit(latest.visited):'The first report can be yours'}</span></div></div>
    <nav className="destination-tabs" aria-label="Destination experience sections">{tabs.map(([label,value])=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</nav>
    {(tab==='Overview'||tab==='Recent')&&<RecentTravelers posts={actual} destination={destination} onShare={()=>onShare('Traffic & Roads')} loading={loading} error={error}/>}
    {tab==='Prices & Costs'&&!loading&&!error&&<RealCosts posts={actual} destination={destination} onShare={()=>onShare('Prices & Costs')}/>}
    {tab==='Photos'&&!loading&&!error&&<TravelerPhotos posts={actual} onShare={()=>onShare()}/>}
    {['Prices & Costs','Photos'].includes(tab)&&loading&&<p className="muted">Loading traveler contributions…</p>}
    {['Prices & Costs','Photos'].includes(tab)&&error&&<p role="alert" className="muted">Contributions could not be loaded. Please try again below.</p>}
    {!['Photos','Recent'].includes(tab)&&<><div className="section-heading destination-list-heading"><div><h2>{tab==='Overview'?'Every side of '+destination+'.':tabs.find(([,value])=>value===tab)?.[0]+' in '+destination}</h2><p>Posted and visited dates stay with every experience.</p></div><button className="text-link" onClick={()=>onShare(tab==='Overview'||tab==='Trip stories'?undefined:tab)}>Share an experience <ArrowUpRight size={16}/></button></div>
      <div className="post-columns">{visible.map(p=><div key={p.id}>{renderPost(p)}</div>)}</div>{!loading&&!error&&!visible.length&&<div className="quiet-empty"><MessageCircle size={24}/><div><h3>No experiences in this category yet.</h3><p>Share a detail from your own visit to help the next traveler.</p></div></div>}
      {visible.some(p=>p.sample)&&<p className="data-note">Sample experiences illustrate how sharing works. They are excluded from community ratings, recent reports and cost summaries.</p>}</>}
    <p className="data-note">Community summaries use up to the latest 500 loaded experiences. Visit claims are self-reported; helpful votes do not verify a booking or receipt.</p>
  </div>;
}

export function QuestionThread({post,comments,user,author,onAuthor,signInPath,onSubmit,busy}:{post:Post;comments:TravelerComment[];user:boolean;author:string;onAuthor:(value:string)=>void;signInPath:string;onSubmit:(body:string,parentId:string|null)=>Promise<void>;busy:boolean}) {
  const [reply,setReply]=useState<TravelerComment|null>(null),[body,setBody]=useState('');
  useEffect(()=>{setReply(null);setBody('');},[post.id]);
  const rows=comments.filter(c=>c.post_id===post.id);
  const roots=rows.filter(c=>!c.parent_id||!rows.some(p=>p.id===c.parent_id)).sort((a,b)=>a.created.localeCompare(b.created));
  return <section id="questions" className="comments question-thread"><span className="section-kicker">ASK SOMEONE WHO WENT</span><h2>Ask {post.author} about {post.destination}.</h2><p className="muted">Clarify a price, a route, or a detail. Replies from the original contributor are labeled.</p>{post.sample&&<p className="data-note">This is an illustrative sample author, not a real traveler available to answer.</p>}
    {roots.map(comment=><article className="comment" key={comment.id}><b>{comment.author}{comment.author_reply&&<span className="author-reply">Original contributor</span>}</b><small>{formatPosted(comment.created)}</small><p>{comment.body}</p><ReportButton id={comment.id} kind="comment"/>{rows.filter(c=>c.parent_id===comment.id).sort((a,b)=>a.created.localeCompare(b.created)).map(child=><div className="comment-reply" key={child.id}><b>{child.author}{child.author_reply&&<span className="author-reply">Original contributor</span>}</b><small>{formatPosted(child.created)}</small><p>{child.body}</p><ReportButton id={child.id} kind="comment"/></div>)}{user&&<button className="text-link" onClick={()=>{setReply(comment);document.getElementById('question-body')?.focus();}}>Reply to {comment.author} <MessageCircle size={14}/></button>}</article>)}
    {!rows.length&&<p className="muted">No questions yet. Start with the detail that would help you plan.</p>}
    {user?<form onSubmit={async e=>{e.preventDefault();if(busy||!body.trim())return;try{await onSubmit(body,reply?.id||null);setBody('');setReply(null);}catch{/* The parent displays the error and the draft stays here. */}}}>{reply&&<div className="replying-to">Replying to {reply.author}<button type="button" onClick={()=>setReply(null)} aria-label="Cancel reply"><X size={15}/></button></div>}<p className="muted">Posting with your traveler profile.</p><label>{reply?'Your reply':'Your question'}<textarea id="question-body" required maxLength={1500} rows={3} value={body} onChange={e=>setBody(e.target.value)} placeholder="Was that price per person or for the whole group?"/></label><button className="primary" disabled={busy}>{busy?'Posting…':reply?'Post reply':'Ask a question'}</button></form>:<Link className="text-link" href={signInPath}>Sign in to ask or reply <ArrowRight size={16}/></Link>}
  </section>;
}

export function PhotoDraft({file,onRemove,category,onCategory,caption,onCaption}:{file:File;onRemove:()=>void;category:string;onCategory:(value:string)=>void;caption:string;onCaption:(value:string)=>void}) {
  const [preview,setPreview]=useState('');
  useEffect(()=>{const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
  return <div className="photo-draft">{preview&&<img src={preview} alt={'Upload preview: '+file.name}/>}<div><label>Photo category<select value={category} onChange={e=>onCategory(e.target.value)}>{photoTopics.map(topic=><option key={topic}>{topic}</option>)}</select></label><label>Caption<input maxLength={160} value={caption} onChange={e=>onCaption(e.target.value)} placeholder="What should travelers notice?"/></label><button type="button" className="text-link" onClick={onRemove}>Remove photo <X size={13}/></button></div></div>;
}
