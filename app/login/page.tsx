import GoogleLogin from './google-login';
import { pageMetadata } from '../seo';
export const metadata=pageMetadata('Sign in or join Kisse Safar Ke', 'Sign in to share experiences and save trips on Kisse Safar Ke.', '/login', false);
export default function Login(){return <GoogleLogin/>;}
