import type { Metadata } from 'next';

export const SITE_URL = 'https://kissesafarke.netlify.app';
export const SITE_NAME = 'Kisse Safar Ke';
export const SITE_DESCRIPTION = 'Kisse Safar Ke is a travel community for exploring India, sharing trip stories, photos and practical experiences, and saving ideas for your next journey.';

export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  return {
    title,
    description,
    alternates: { canonical: SITE_URL + path },
    robots: { index, follow: true },
    openGraph: {
      type: 'website', siteName: SITE_NAME, title, description, url: SITE_URL + path,
      locale: 'en_IN',
      images: [{ url: SITE_URL + '/images/himalayan-journey.webp', alt: 'A Himalayan landscape — Kisse Safar Ke' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [SITE_URL + '/images/himalayan-journey.webp'] },
  };
}
