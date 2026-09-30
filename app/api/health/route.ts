import { database } from '../../../db';
let cached:{status:string;time:number}|undefined;
let pending:Promise<{status:string;time:number}>|undefined;
export async function GET(){
 if(!cached||Date.now()-cached.time>30000){
  pending??=(async()=>{try{await (await database()).command({ping:1},{timeoutMS:2000});return {status:'ok',time:Date.now()};}catch{return {status:'unavailable',time:Date.now()};}})();
  cached=await pending;pending=undefined;
 }
 return Response.json({status:cached.status,checkedAt:new Date(cached.time).toISOString()},{status:cached.status==='ok'?200:503,headers:{'Cache-Control':'no-store'}});
}
