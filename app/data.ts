export const states = ['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
export const reviewCategories=['Hotels & Stays','Restaurants & Food','Tourist Places','Transport','Traffic & Roads','Shopping','Products','Activities','Local Services','Practical Tips','Other'];
export const images={
 Manali:'https://images.unsplash.com/photo-1652543393130-e30a1aad2959?auto=format&fit=crop&w=1200&h=800&q=85',
 Jaipur:'https://images.unsplash.com/photo-1578999935853-4ec5fa6c1f60?auto=format&fit=crop&w=1200&h=800&q=85',
 Goa:'https://images.unsplash.com/photo-1749753484185-30347b75988d?auto=format&fit=crop&w=1200&h=800&q=85'
};
export type Destination={name:string;state:string;type:string;note:string;image?:string};
const groups:[string,string,string[]][]=[
 ['Himachal Pradesh','Mountains',['Manali','Shimla','Dharamshala','Dalhousie','Kasol','Spiti Valley']],
 ['Uttarakhand','Mountains',['Mussoorie','Nainital','Auli']],['Uttarakhand','Spiritual',['Rishikesh','Haridwar','Kedarnath','Badrinath']],
 ['Ladakh','Mountains',['Leh']],['Jammu and Kashmir','Mountains',['Srinagar','Gulmarg','Pahalgam']],['Jammu and Kashmir','Spiritual',['Vaishno Devi']],
 ['Sikkim','Mountains',['Gangtok']],['West Bengal','Mountains',['Darjeeling']],['West Bengal','Cities',['Kolkata']],['West Bengal','Beaches',['Digha']],
 ['Goa','Beaches',['Goa','North Goa','South Goa']],['Karnataka','Beaches',['Gokarna']],['Kerala','Beaches',['Varkala','Kovalam']],['Puducherry','Beaches',['Pondicherry']],
 ['Andaman and Nicobar Islands','Beaches',['Swaraj Dweep','Port Blair']],['Lakshadweep','Beaches',['Agatti']],['Odisha','Spiritual',['Puri']],
 ['Rajasthan','Heritage',['Jaipur','Udaipur','Jodhpur','Jaisalmer','Pushkar','Ajmer','Mount Abu']],
 ['Uttar Pradesh','Heritage',['Agra','Lucknow']],['Uttar Pradesh','Spiritual',['Varanasi','Ayodhya','Mathura','Vrindavan']],
 ['Delhi','Heritage',['Delhi']],['Punjab','Spiritual',['Amritsar']],['Karnataka','Heritage',['Hampi','Mysuru']],['Madhya Pradesh','Heritage',['Khajuraho']],['Madhya Pradesh','Spiritual',['Ujjain']],
 ['Kerala','Nature',['Munnar','Wayanad','Alleppey']],['Kerala','Cities',['Kochi']],['Karnataka','Nature',['Coorg']],['Tamil Nadu','Nature',['Ooty','Kodaikanal']],
 ['Maharashtra','Nature',['Lonavala','Mahabaleshwar']],['Maharashtra','Cities',['Mumbai','Pune']],['Maharashtra','Spiritual',['Shirdi']],
 ['Arunachal Pradesh','Nature',['Tawang']],['Meghalaya','Nature',['Shillong','Cherrapunji']],['Bihar','Spiritual',['Bodh Gaya']],['Bihar','Cities',['Patna']],
 ['Andhra Pradesh','Spiritual',['Tirupati']],['Andhra Pradesh','Beaches',['Visakhapatnam']],['Tamil Nadu','Cities',['Chennai']],['Tamil Nadu','Spiritual',['Rameswaram','Madurai']],
 ['Karnataka','Cities',['Bengaluru']],['Telangana','Cities',['Hyderabad']],['Gujarat','Cities',['Ahmedabad']],['Gujarat','Heritage',['Kutch']],['Chandigarh','Cities',['Chandigarh']],
 ['Assam','Nature',['Kaziranga']],['Assam','Cities',['Guwahati']],['Manipur','Nature',['Loktak Lake']],['Manipur','Cities',['Imphal']],
 ['Mizoram','Cities',['Aizawl']],['Nagaland','Heritage',['Kohima']],['Tripura','Heritage',['Agartala']],['Jharkhand','Nature',['Ranchi']],
 ['Chhattisgarh','Nature',['Chitrakote Falls']],['Haryana','Heritage',['Kurukshetra']],['Dadra and Nagar Haveli and Daman and Diu','Beaches',['Diu']]
];
const notes:Record<string,string>={Manali:'Pine trails & mountain mornings',Goa:'Salt in the air. Stories everywhere.',Jaipur:'Pink streets & royal little detours'};
const all=groups.flatMap(([state,type,names])=>names.map(name=>({name,state,type,note:notes[name]||type+' · '+state,image:images[name as keyof typeof images]})));
export const destinations=[...['Manali','Goa','Jaipur'].map(name=>all.find(d=>d.name===name)!),...all.filter(d=>!['Manali','Goa','Jaipur'].includes(d.name))];
export type Post={id:string;author:string;kind:string;destination:string;state:string;category:string;title:string;body:string;rating:number;price:number|null;visited:string;trip_type:string;photos:string[];created:string;sample?:boolean;own?:boolean};
export const samplePosts:Post[]=[
 {id:'sample-manali-road',author:'Aarav S.',kind:'review',destination:'Manali',state:'Himachal Pradesh',category:'Traffic & Roads',title:'The early start was the best part of our Solang trip',body:'We left Manali early and had time for a relaxed breakfast on the way. By the afternoon, our return drive was much slower. My takeaway: leave some breathing room in your itinerary instead of squeezing in too many stops.\n\nThis is an illustrative review for the preview, not a current traffic report.',rating:4,price:1800,visited:'2026-09-12',trip_type:'Friends',photos:[],created:'2026-09-13T09:00:00Z',sample:true},
 {id:'sample-goa-story',author:'Meera K.',kind:'story',destination:'Goa',state:'Goa',category:'Practical Tips',title:'Four slow days in Goa, with room to get lost',body:'Day 1 — Check in and take a long walk by the sea.\nDay 2 — Explore Panjim on foot and linger over lunch.\nDay 3 — A beach day with no packed schedule.\nDay 4 — One last breakfast before heading home.\n\nIllustrative budget per person: stay ₹4,800, food ₹2,400, local transport ₹1,800, activities ₹1,000. Total ₹10,000, excluding travel to Goa. These are example figures, not verified prices.',rating:5,price:10000,visited:'2026-09-08',trip_type:'Couple',photos:[],created:'2026-09-10T09:00:00Z',sample:true},
 {id:'sample-jaipur-food',author:'Kabir R.',kind:'review',destination:'Jaipur',state:'Rajasthan',category:'Restaurants & Food',title:'A little food trail through the old city',body:'We made a short list of dishes rather than a long list of restaurants: pyaaz kachori, a local thali, and a lassi to finish. Asking about portion sizes helped us order enough to share.\n\nThis sample demonstrates how to share an experience. The amount is illustrative and does not represent a current menu.',rating:5,price:450,visited:'2026-09-05',trip_type:'Friends',photos:[],created:'2026-09-06T09:00:00Z',sample:true}
];
export const photoUrl=(id:string)=>'/api/photos/'+encodeURIComponent(id);

