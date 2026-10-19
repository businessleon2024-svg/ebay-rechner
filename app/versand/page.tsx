import type { Metadata } from 'next';
import Link from 'next/link';
import { ShippingIsland } from '@/components/shipping-island';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PREISSTAND } from '@/lib/shipping/dhl';

export const metadata: Metadata = {
  title: 'Versandkosten-Rechner für DHL-Pakete',
  description:
    'Welches DHL-Paket passt und was kostet es? Maße und Gewicht eintragen, günstigstes Produkt finden — mit eigenen Vertragspreisen.',
  alternates: { canonical: '/versand' },
};

const FRAGEN = [
  {
    frage: 'Warum sind die Preise nicht verbindlich?',
    antwort: `Sie ändern sich jährlich, unterscheiden sich zwischen Filiale und Online-Frankierung, und wer als Geschäftskunde einen Vertrag hat, zahlt oft deutlich weniger. Die hinterlegten Werte (Stand ${PREISSTAND}) sind Startwerte, keine Zusage. Trag unter „Eigene Preise hinterlegen" deine echten ein — sie bleiben in deinem Browser.`,
  },
  {
    frage: 'Welche Maße muss ich nehmen?',
    antwort:
      'Die Außenmaße des fertig gepackten Kartons, nicht die des Artikels. Polstermaterial und Kartonwand zählen mit. In welcher Reihenfolge du die drei Kanten einträgst, spielt keine Rolle — der Rechner darf das Paket drehen.',
  },
  {
    frage: 'Warum ist Päckchen manchmal teurer als Paket?',
    antwort:
      'Mit eigenen Vertragspreisen kann ein größeres Produkt günstiger sein als ein kleineres. Deshalb sucht der Rechner nicht das kleinste passende Produkt, sondern das billigste — und zeigt darunter alle an, damit du es nachvollziehen kannst.',
  },
  {
    frage: 'Was ist mit Sperrgut und Auslandsversand?',
    antwort:
      'Beides ist nicht abgebildet. Sperrgutzuschläge hängen an Form und Gewicht, Auslandspreise an der Zone. Beides kommt dazu, wenn es belastbare Zahlen dafür gibt — geraten wird hier nichts.',
  },
];

export default function VersandPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Welches DHL-Paket passt — und was kostet es?</h1>
          <p className="hero__subtitle">
            Maße und Gewicht eintragen, das günstigste Produkt steht daneben. Mit deinen eigenen
            Vertragspreisen, falls du welche hast.
          </p>
        </section>

        <ShippingIsland />

        <section className="section" aria-labelledby="versand-faq">
          <h2 className="section__heading" id="versand-faq">
            Wissenswertes zum Versand
          </h2>
          <div className="faq">
            {FRAGEN.map((eintrag) => (
              <div className="faq__item" key={eintrag.frage}>
                <h3 className="faq__question">{eintrag.frage}</h3>
                <p className="faq__answer">{eintrag.antwort}</p>
              </div>
            ))}
          </div>
          <p className="section__note">
            Das Porto gehört in die Gewinnrechnung: Trag den ermittelten Betrag im{' '}
            <Link href="/rechner">Gebührenrechner</Link> unter „Eigene Versandkosten“ ein, dann
            siehst du, was nach Gebühren und Porto übrig bleibt.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
