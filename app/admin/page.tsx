import {redirect,notFound} from 'next/navigation';
import {getCurrentUser} from '../auth/session';
import {isOwner} from '../monitoring/privacy';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Monitoring | Kisse Safar Ke',robots:{index:false,follow:false}};
export default async function AdminPage(){
 const user=await getCurrentUser();
 if(!user)redirect('/login?returnTo=%2Fadmin');
 if(!isOwner(user.email))notFound();
 return <Dashboard/>;
}
