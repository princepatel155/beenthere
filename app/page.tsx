import Community from './community';
import { getCurrentUser } from './auth/session';
export const dynamic = 'force-dynamic';
export default async function Page() {
 const user = await getCurrentUser();
 return <Community user={user ? { id: user.userId, name: user.fullName || 'Traveler' } : null} signInPath="/login" />;
}
