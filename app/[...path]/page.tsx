import { notFound } from 'next/navigation';
import Community from '../community';
import { getCurrentUser } from '../auth/session';
import { destinations } from '../data';
import { pageMetadata } from '../seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ path: string[] }> };

export async function generateMetadata({ params }: Props) {
  const { path } = await params;
  const url = '/' + path.map(encodeURIComponent).join('/');
  if (path.length === 1) {
    if (path[0] === 'explore') return pageMetadata('Explore India | Kisse Safar Ke', 'Explore destinations across India with Kisse Safar Ke. Discover mountains, beaches, heritage places and ideas for your next trip.', url);
    if (path[0] === 'stories') return pageMetadata('Travel Stories & Itineraries | Kisse Safar Ke', 'Browse trip stories, itineraries and travel experiences on Kisse Safar Ke. Illustrative sample stories are clearly labeled.', url);
    if (path[0] === 'saved') return pageMetadata('Saved Trips | Kisse Safar Ke', 'Your saved experiences and travel collections.', url, false);
    if (path[0] === 'profile') return pageMetadata('Your Profile | Kisse Safar Ke', 'Your personal traveler profile and contributions.', url, false);
  }
  if (path.length === 2 && path[0] === 'destination') {
    const destination = destinations.find(d => d.name.toLowerCase() === path[1].toLowerCase());
    return pageMetadata(`${path[1]} Travel Experiences | Kisse Safar Ke`, `Discover ${path[1]}${destination ? ', ' + destination.state : ''} on Kisse Safar Ke. Explore and share experiences from your visit.`, url, !!destination);
  }
  // Details load from the community API. Keep these out of search until genuine
  // post content and per-post metadata can be rendered together on the server.
  return pageMetadata('Travel Experience | Kisse Safar Ke', 'A travel experience shared on Kisse Safar Ke.', url, false);
}

export default async function Page({ params }: Props) {
  const { path } = await params;
  const knownPage = path.length === 1 && ['explore', 'stories', 'saved', 'profile'].includes(path[0]);
  const communityPage = path.length === 2 && ['destination', 'experience'].includes(path[0]);
  if (!knownPage && !communityPage) notFound();
  const user = await getCurrentUser();
  return <Community user={user ? { id: user.userId, name: user.fullName || 'Traveler' } : null} signInPath="/login" />;
}
