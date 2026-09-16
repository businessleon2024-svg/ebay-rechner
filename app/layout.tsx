import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'eBay Gebühren- & Gewinnrechner | Deutschland',
  description:
    'Gebühren, Umsatzsteuer und Marge für gewerbliche eBay-Verkäufer – inklusive des reduzierten 5-%-Satzes für gebrauchte Artikel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
