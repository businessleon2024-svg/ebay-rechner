import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConsentBanner } from '@/components/consent-banner';
import { THEME_INIT_SCRIPT } from '@/components/theme-toggle';
import { SITE } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  // Basis für kanonische Adressen und Vorschaubilder. Ohne sie würden
  // Varianten mit und ohne www als getrennte Seiten gewertet.
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Gebührenkompass | Gebühren, Gewinn und Marge für eBay und Kaufland',
    template: '%s | Gebührenkompass',
  },
  description:
    'Berechne Marktplatzgebühren, Auszahlung, Umsatzsteuer und Marge für eBay und Kaufland – inklusive des reduzierten 5-%-Satzes für gebrauchte Artikel bei eBay.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.className} suppressHydrationWarning>
      <head>
        {/*
          Setzt Hell oder Dunkel noch vor dem ersten Zeichnen. Ohne das würde
          die Seite bei dunkler Systemeinstellung kurz hell aufblitzen.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
