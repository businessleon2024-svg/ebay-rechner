import type { Metadata } from 'next';
import { AdSlot } from '@/components/ad-slot';
import { CalculatorIsland } from '@/components/calculator-island';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Gebühren- & Gewinnrechner für eBay und Kaufland',
  description:
    'Gebühren, Auszahlung, Gewinn und Marge für gewerbliche Verkäufer berechnen – für eBay und Kaufland, inklusive Umsatzsteuer.',
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
