import {notFound} from 'next/navigation';
import Community from '../../../community';
import {destinations,type Destination} from '../../../data';
import {slug,destinationPath} from '../../../catalog';
import {database} from '../../../../db';
import {getCurrentUser} from '../../../auth/session';
import {pageMetadata} from '../../../seo';
export const dynamic='force-dynamic';
type Props={params:Promise<{state:string;destination:string}>};
async function resolve(params:Props['params']):Promise<Destination|null>{
 const p=await params;
 const featured=destinations.find(d=>slug(d.name)===p.destination&&slug(d.state)===p.state);
 if(featured)return featured;
 const db=await database(),record=await db.collection('destinations').findOne({id:p.state+'/'+p.destination});
 return record?{name:record.name,state:record.state,type:'Community discovery',note:'Experiences shared by travelers'}:null;
}
export async function generateMetadata({params}:Props){const d=await resolve(params);return d?pageMetadata(d.name+' Travel Experiences | Kisse Safar Ke','Traveler experiences, stays, food, roads, prices and photos from '+d.name+', '+d.state+'.',destinationPath(d.name,d.state)):{};}
export default async function Page({params}:Props){const d=await resolve(params);if(!d)notFound();const user=await getCurrentUser();return <Community routeDestination={d} user={user?{id:user.userId,name:user.fullName}:null} signInPath="/login"/>;}
