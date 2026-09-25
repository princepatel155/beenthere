import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesSearch, recentReports, costGroups, regions } from '../app/experience-utils.ts';
import { states } from '../app/data.ts';

test('search matches independent tokens and travel synonyms without inventing nearby places',()=>{
  assert(matchesSearch('Scooty rental at Baga in Goa', 'Goa scooter rental'));
  assert(matchesSearch('Stay next to Golden Temple in Amritsar', 'Hotels near Golden Temple'));
  assert(!matchesSearch('A great hotel in Goa','Patna restaurants'));
});
test('recent reports use visit dates, exclude samples and future visits',()=>{
  const records=[{id:'recent',visited:'2026-09-20',created:'2026-09-21'}, {id:'old',visited:'2026-01-01',created:'2026-09-25'}, {id:'sample',visited:'2026-09-24',created:'2026-09-25',sample:true}, {id:'future',visited:'2026-10-01',created:'2026-09-25'}];
  assert.deepEqual(recentReports(records,30,new Date('2026-09-25')).map(p=>p.id),['recent']);
});
test('reported costs never mix bases, durations, samples or stale visits',()=>{
  const base={kind:'review',category:'Transport',price:500,cost_basis:'Per ride',visited:'2026-09-20',created:'2026-09-21'};
  const records=[base,{...base,price:750},{...base,price:200,cost_basis:'Per person'}, {...base,price:99999,sample:true}, {...base,price:99999,visited:'2025-01-01'}, {...base,price:99999,cost_basis:null}, {...base,price:0,cost_basis:'Per day'}, {...base,kind:'story',price:3000,trip_days:3}, {...base,kind:'story',price:5000,trip_days:4}, {...base,kind:'story',price:99999}];
  const groups=costGroups(records,new Date('2026-09-25'));
  assert.equal(groups.length,5);
  assert.deepEqual(groups.find(g=>g.category==='Transport'&&g.basis==='Per ride').amounts,[500,750]);
  assert.deepEqual(groups.filter(g=>g.category==='Trip total').map(g=>g.days).sort(),[3,4]);
  assert(groups.some(g=>g.amounts.includes(0)));
  assert(!groups.some(g=>g.amounts.includes(99999)));
});
test('regional navigator covers every state and union territory once',()=>{
  const included=Object.values(regions).flat();
  assert.equal(included.length,new Set(included).size);
  assert.deepEqual([...included].sort(),[...states].sort());
});
