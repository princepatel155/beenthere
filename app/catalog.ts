import { destinations } from './data';

export const slug = (value:string) => value.normalize('NFKC').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
export const destinationPath = (name:string,state?:string) => {
 const region=state||destinations.find(d=>d.name.toLowerCase()===name.toLowerCase())?.state;
 return region?'/india/'+encodeURIComponent(slug(region))+'/'+encodeURIComponent(slug(name)):'/destination/'+encodeURIComponent(name);
};
