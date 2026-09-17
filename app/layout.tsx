import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Gebührenkompass | Gebühren, Gewinn und Marge für eBay und Kaufland',
    template: '%s | Gebührenkompass',
  },
  description:
    'Berechne Marktplatzgebühren, Auszahlung, Umsatzsteuer und Marge für eBay und Kaufland – inklusive des reduzierten 5-%-Satzes für gebrauchte Artikel bei eBay.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
