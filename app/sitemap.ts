import type { MetadataRoute } from 'next';
import { SITE_URL } from './seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // Submit the main public pages. Add destination and individual story URLs
  // when they contain substantial original content, rather than empty listings.
  return ['/', '/explore', '/stories'].map(path => ({ url: SITE_URL + path }));
}
