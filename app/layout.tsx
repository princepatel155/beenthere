import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from './seo';
import "./globals.css";
import "./premium.css";
import "./experiences.css";
import "./member.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  verification: { google: 'g9DqlOm9_SLPpUNl9x0IKfCcBSbBBr9jDocRnIFqAZ0' },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body id="top" className="antialiased"><div className="travel-backdrop" aria-hidden="true" />{children}</body>
    </html>
  );
}
