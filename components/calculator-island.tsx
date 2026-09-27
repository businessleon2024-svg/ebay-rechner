'use client';

import dynamic from 'next/dynamic';

/**
 * Der Rechner läuft rein clientseitig: Er stellt die zuletzt eingegebenen Werte
 * direkt aus dem localStorage her, was serverseitig nicht möglich ist. Die
 * umgebende Seite (Header, Footer, Metadaten) wird weiterhin serverseitig
 * gerendert, für die Suchmaschinen-Indexierung reicht das aus.
 */
const Calculator = dynamic(() => import('./calculator').then((mod) => mod.Calculator), {
  ssr: false,
  loading: () => (
    <main className="layout">
      <section className="panel form-panel" aria-busy="true">
        <h2 className="panel__heading">Angaben zum Verkauf</h2>
      </section>
      <section className="panel result-panel" aria-busy="true">
        <h2 className="panel__heading">Ergebnis</h2>
      </section>
    </main>
  ),
});

export function CalculatorIsland() {
  return <Calculator />;
}
