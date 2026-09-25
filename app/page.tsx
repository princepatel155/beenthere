import Community from './community';
import { getCurrentUser } from './auth/session';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, pageMetadata } from './seo';
export const metadata = pageMetadata('Kisse Safar Ke | India Travel Stories & Experiences', SITE_DESCRIPTION, '/');
export const dynamic = 'force-dynamic';
export default async function Page() {
 const user = await getCurrentUser();
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
   '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME,
   alternateName: 'KisseSafarKe', url: SITE_URL + '/', description: SITE_DESCRIPTION, inLanguage: 'en-IN',
 }).replace(/</g, '\\u003c') }} /><Community user={user ? { id: user.userId, name: user.fullName || 'Traveler' } : null} signInPath="/login" /></>;
}
