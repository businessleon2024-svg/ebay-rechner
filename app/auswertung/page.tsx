import type { Metadata } from 'next';
import { ReportReview } from '@/components/report-review';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { MINDESTBELEGE } from '@/lib/reports/aggregate';

/**
 * Auswertung eingegangener Gebührenmeldungen.
 *
 * Werkzeug für den Betreiber. Bewusst nicht in der Navigation verlinkt und
 * von der Indexierung ausgenommen — es ist kein Angebot an Besucher, aber
 * auch nichts Geheimes: Es rechnet nur mit dem, was man selbst einfügt.
 */
export const metadata: Metadata = {
  title: 'Meldungen auswerten',
  description: 'Eingegangene Gebührenmeldungen zusammenfassen und mit den hinterlegten Sätzen vergleichen.',
  robots: { index: false, follow: false },
};

export default function AuswertungPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Meldungen auswerten</h1>
          <p className="hero__subtitle">
            Eingegangene Gebührenmeldungen zusammenfassen und den hinterlegten Sätzen
            gegenüberstellen. Alles läuft im Browser — der eingefügte Text verlässt dieses Gerät
            nicht.
          </p>
        </section>

        <section className="section">
          <ReportReview />

          <p className="section__note">
            Ein Befund gilt als belastbar, wenn mindestens {MINDESTBELEGE} Meldungen denselben Satz
            nennen <em>und</em> sie die Mehrheit bilden. Ein Gleichstand ist kein Befund, sondern
            ein Widerspruch — den muss man sich ansehen, statt ihn zu mitteln. Ein Mittelwert aus
            7 % und 12 % wäre 9,5 %, ein Satz, mit dem nie jemand abgerechnet wurde.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
