import type { Metadata } from 'next';
import { AdSlot } from '@/components/ad-slot';
import { CalculatorIsland } from '@/components/calculator-island';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'eBay Gebühren- & Gewinnrechner',
  description:
    'Gebühren, Auszahlung, Gewinn und Marge für gewerbliche eBay-Verkäufer berechnen – inklusive des reduzierten 5-%-Satzes für gebrauchte Artikel.',
};

export default function RechnerPage() {
  return (
    <>
      <SiteHeader />
      <CalculatorIsland />
      <div className="layout layout--single">
        <AdSlot />
      </div>
      <SiteFooter />
    </>
  );
}
