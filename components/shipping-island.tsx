'use client';

import dynamic from 'next/dynamic';

/**
 * Wie beim Gebührenrechner: Der Versandrechner stellt die hinterlegten
 * eigenen Preise direkt aus dem `localStorage` her, was serverseitig nicht
 * möglich ist. Die umgebende Seite — Kopfzeile, Fußzeile, Erklärtexte —
 * wird weiterhin auf dem Server gerendert und bleibt indexierbar.
 *
 * Ohne das müsste der Anfangswert aus einem Effekt nachgereicht werden. Das
 * verbietet die Lint-Regel `react-hooks/set-state-in-effect` zu Recht: Es
 * wäre eine zweite Zeichnung für etwas, das beim ersten Mal feststehen kann.
 */
const ShippingCalculator = dynamic(
  () => import('./shipping-calculator').then((mod) => mod.ShippingCalculator),
  {
    ssr: false,
    loading: () => (
      <div className="layout">
        <section className="panel form-panel" aria-busy="true">
          <h2 className="panel__heading">Maße des Pakets</h2>
        </section>
        <section className="panel result-panel" aria-busy="true">
          <h2 className="panel__heading">Ergebnis</h2>
        </section>
      </div>
    ),
  },
);

export function ShippingIsland() {
  return <ShippingCalculator />;
}
