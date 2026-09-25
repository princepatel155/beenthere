import type { Post } from './data';

export const experienceTopics = [
  ['Stays', 'Hotels & Stays', '🏨'], ['Food', 'Restaurants & Food', '🍜'],
  ['Transport', 'Transport', '🚕'], ['Traffic', 'Traffic & Roads', '🚦'],
  ['Places', 'Tourist Places', '📍'], ['Shopping', 'Shopping', '🛍'],
  ['Activities', 'Activities', '🎯'], ['Prices', 'Prices & Costs', '₹'],
  ['Problems', 'Problems & Alerts', '⚠'], ['Local tips', 'Practical Tips', '💡'],
] as const;
export const costBases = ['Total paid', 'Per person', 'Per night', 'Per room / night', 'Per day', 'Per vehicle / day', 'Per ride', 'Per ticket', 'Per person / trip', 'Whole group / trip'];
export const photoTopics = ['Food', 'Hotels', 'Roads', 'Views', 'Bills & Prices', 'Transport', 'Other'];
export type PhotoDetail = { id: string; category: string; caption: string };
export type TravelerComment = { id: string; post_id: string; author: string; body: string; created: string; parent_id?: string | null; author_reply?: boolean };

export const regions: Record<string, string[]> = {
  North: ['Jammu and Kashmir', 'Ladakh', 'Himachal Pradesh', 'Punjab', 'Chandigarh', 'Haryana', 'Delhi', 'Uttarakhand', 'Uttar Pradesh'],
  West: ['Rajasthan', 'Gujarat', 'Maharashtra', 'Goa', 'Dadra and Nagar Haveli and Daman and Diu'],
  Central: ['Madhya Pradesh', 'Chhattisgarh'],
  East: ['Bihar', 'Jharkhand', 'Odisha', 'West Bengal'],
  Northeast: ['Assam', 'Arunachal Pradesh', 'Sikkim', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura'],
  South: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Puducherry'],
  Islands: ['Andaman and Nicobar Islands', 'Lakshadweep'],
};

const synonyms: Record<string, string[]> = {
  hotel: ['hotel', 'stay', 'accommodation'], hotels: ['hotel', 'stay', 'accommodation'], stays: ['stay', 'hotel', 'accommodation'],
  restaurant: ['restaurant', 'food', 'meal'], restaurants: ['restaurant', 'food', 'meal'], food: ['food', 'restaurant', 'meal', 'breakfast'],
  scooter: ['scooter', 'scooty'], taxi: ['taxi', 'cab'], cab: ['cab', 'taxi'],
  cost: ['cost', 'price', 'paid', 'fare'], costs: ['cost', 'price', 'paid', 'fare'], price: ['price', 'cost', 'paid', 'fare'], prices: ['price', 'cost', 'paid', 'fare'],
  traffic: ['traffic', 'congestion', 'jam'], tip: ['tip', 'advice'], tips: ['tip', 'advice'],
};
const stopWords = new Set(['a', 'an', 'the', 'in', 'near', 'to', 'from', 'of', 'for', 'and', 'at']);
export function searchTerms(query: string): string[][] {
  return query.toLowerCase().normalize('NFKC').split(/[^\p{L}\p{N}]+/u).filter(w => w && !stopWords.has(w)).slice(0, 8).map(w => synonyms[w] || [w]);
}
export function matchesSearch(text: string, query: string): boolean {
  const normalized = text.toLowerCase().normalize('NFKC');
  return searchTerms(query).every(alternatives => alternatives.some(word => normalized.includes(word)));
}
export function matchesCategory(post: Post, category: string): boolean {
  if (category === 'All experiences' || category === 'Overview') return true;
  if (category === 'Prices & Costs') return post.price !== null || post.category === category;
  if (category === 'Trip stories') return post.kind === 'story';
  return post.category === category;
}
export function formatVisit(value: string) {
  return new Date(value + 'T12:00:00').toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
}
export function formatPosted(value: string) {
  return new Date(value).toLocaleString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'}) + ' IST';
}
export function recentReports(posts: Post[], days = 30, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  return posts.filter(p => !p.sample && p.visited >= cutoff && p.visited <= today).sort((a,b) => b.visited.localeCompare(a.visited) || b.created.localeCompare(a.created));
}
export function costGroups(posts: Post[], now = new Date()) {
  const groups = new Map<string, { category: string; basis: string; days?: number; amounts: number[]; updated: string; visited: string }>();
  for (const p of recentReports(posts, 180, now)) {
    if (p.price === null || !Number.isFinite(p.price) || !p.cost_basis || !costBases.includes(p.cost_basis)) continue;
    const category = p.kind === 'story' ? 'Trip total' : p.category;
    // A duration is necessary before comparing whole-trip totals.
    if (category === 'Trip total' && !p.trip_days) continue;
    const key = [category, p.cost_basis, category === 'Trip total' ? p.trip_days : ''].join('|');
    const group = groups.get(key) || { category, basis:p.cost_basis, days:category === 'Trip total' ? p.trip_days ?? undefined : undefined, amounts:[], updated:p.created, visited:p.visited };
    group.amounts.push(p.price);
    if (p.created > group.updated) group.updated = p.created;
    if (p.visited > group.visited) group.visited = p.visited;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a,b) => b.amounts.length - a.amounts.length);
}
