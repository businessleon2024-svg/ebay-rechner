import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ConsentBanner } from '@/components/consent-banner';
import { ServiceWorker } from '@/components/service-worker';
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
  /*
    Macht den Rechner auf dem iPhone zur App: ohne Adressleiste, mit eigenem
    Namen unter dem Symbol. Android liest dasselbe aus `app/manifest.ts`.
  */
  appleWebApp: {
    capable: true,
    title: SITE.name,
    // Die Statusleiste übernimmt damit die Farbe der Seite statt weiß zu bleiben.
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  /*
    Färbt die Statusleiste passend zur Ansicht. Ohne die zweite Zeile bliebe
    sie im dunklen Modus hell und schnitte oben sichtbar ab.
  */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0c100f' },
  ],
  // Lässt den Inhalt bis in den Bereich um die Kamera-Aussparung laufen.
  viewportFit: 'cover',
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
        <ServiceWorker />
      </body>
    </html>
  );
}
