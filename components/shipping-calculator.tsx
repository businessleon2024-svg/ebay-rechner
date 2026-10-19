'use client';

import { useMemo, useState } from 'react';
import {
  DHL_PRODUKTE,
  PREISSTAND,
  guenstigstesProdukt,
  passtIn,
  preisFuer,
} from '@/lib/shipping/dhl';
import { formatCurrency, parseNumber } from '@/lib/format';

/**
 * Versandrechner für DHL-Pakete im Inland.
 *
 * Beantwortet zwei Fragen, die beim Einstellen eines Angebots zusammen
 * auftreten: Welches Paket passt, und was kostet es?
 *
 * Die Maße sind belastbar, die Preise nicht — siehe `lib/shipping/dhl.ts`.
 * Deshalb kann jeder seine eigenen Preise eintragen; sie bleiben im Browser
 * und werden beim nächsten Besuch wieder vorgelegt. Wer einen
 * Geschäftskundenvertrag hat, zahlt oft die Hälfte, und ein Rechner, der
 * ihm Privatkundenpreise vorhält, rechnet ihm die Marge kaputt.
 */

const SPEICHER = 'gk.versand.preise.v1';

interface Masse {
  laenge: string;
  breite: string;
  hoehe: string;
  gewicht: string;
}

const LEER: Masse = { laenge: '', breite: '', hoehe: '', gewicht: '' };

/**
 * Maße und Höchstgewicht eines Produkts als ein Stück Text.
 *
 * `toLocaleString` statt der nackten Zahl: Sonst steht auf einer deutschen
 * Seite „31.5 kg“ mit Punkt. Bei den Zentimeterangaben fällt es nicht auf,
 * weil sie ganzzahlig sind — beim Gewicht sofort.
 */
function massText(produkt: { maxMass: { laenge: number; breite: number; hoehe: number }; maxGewicht: number }): string {
  const { laenge, breite, hoehe } = produkt.maxMass;
  const gewicht = produkt.maxGewicht.toLocaleString('de-DE');
  return `${laenge}×${breite}×${hoehe} cm · bis ${gewicht} kg`;
}

function eigenePreiseLesen(): Record<string, number> {
  try {
    const roh = window.localStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Record<string, number>) : {};
  } catch {
    window.localStorage.removeItem(SPEICHER);
    return {};
  }
}

export function ShippingCalculator() {
  const [masse, setMasse] = useState<Masse>(LEER);
  /*
    Träger Anfangswert statt Effekt. Das geht nur, weil die Komponente über
    `shipping-island.tsx` ohne serverseitiges Rendern eingebunden wird — dort
    liegt die Begründung. Mit SSR wäre das ein Hydration-Fehler, und ein
    Effekt wäre eine kaskadierende Neuzeichnung.
  */
  const [eigenePreise, setEigenePreise] = useState<Record<string, number>>(eigenePreiseLesen);
  const [preiseOffen, setPreiseOffen] = useState(false);

  const setzePreis = (id: string, wert: string) => {
    setEigenePreise((aktuell) => {
      const naechste = { ...aktuell };
      if (wert.trim() === '') {
        delete naechste[id];
      } else {
        naechste[id] = parseNumber(wert);
      }
      window.localStorage.setItem(SPEICHER, JSON.stringify(naechste));
      return naechste;
    });
  };

  const eingabe = {
    laenge: parseNumber(masse.laenge),
    breite: parseNumber(masse.breite),
    hoehe: parseNumber(masse.hoehe),
    gewicht: parseNumber(masse.gewicht),
  };

  const vollstaendig =
    eingabe.laenge > 0 && eingabe.breite > 0 && eingabe.hoehe > 0 && eingabe.gewicht > 0;

  const treffer = useMemo(() => {
    if (!vollstaendig) return null;
    return guenstigstesProdukt(
      { laenge: eingabe.laenge, breite: eingabe.breite, hoehe: eingabe.hoehe },
      eingabe.gewicht,
      eigenePreise,
    );
  }, [vollstaendig, eingabe.laenge, eingabe.breite, eingabe.hoehe, eingabe.gewicht, eigenePreise]);

  const feld = (id: keyof Masse, label: string, einheit: string, platzhalter: string) => (
    <div className="field">
      <label htmlFor={`versand-${id}`}>{label}</label>
      <div className="input-wrap">
        <input
          id={`versand-${id}`}
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          placeholder={platzhalter}
          autoComplete="off"
          value={masse[id]}
          onChange={(e) => setMasse((m) => ({ ...m, [id]: e.target.value }))}
        />
        <span className="input-suffix">{einheit}</span>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <section className="panel form-panel" aria-labelledby="versandFormHeading">
        <h2 id="versandFormHeading" className="panel__heading">
          Maße des Pakets
        </h2>

        <div className="field-row">
          {feld('laenge', 'Länge', 'cm', '35')}
          {feld('breite', 'Breite', 'cm', '25')}
        </div>
        <div className="field-row">
          {feld('hoehe', 'Höhe', 'cm', '10')}
          {feld('gewicht', 'Gewicht', 'kg', '1,5')}
        </div>

        <p className="hint hint--immer">
          Außenmaße des gepackten Kartons, nicht die des Artikels. Die Reihenfolge der drei Kanten
          spielt keine Rolle — das Paket darf gedreht werden.
        </p>

        <details className="advanced" open={preiseOffen} onToggle={(e) => setPreiseOffen(e.currentTarget.open)}>
          <summary>Eigene Preise hinterlegen</summary>
          <div className="advanced__body">
            <p className="hint hint--standalone">
              <strong>Die hinterlegten Preise sind ungeprüft</strong> (Stand {PREISSTAND}). Als
              Geschäftskunde zahlst du oft deutlich weniger. Trag deine echten Preise ein — sie
              bleiben in diesem Browser und werden nirgendwo hochgeladen.
            </p>
            {DHL_PRODUKTE.map((p) => (
              <div className="field" key={p.id}>
                <label htmlFor={`preis-${p.id}`}>
                  {p.name}
                  <span className="kpi__tag">
                    {massText(p)}
                  </span>
                </label>
                <div className="input-wrap">
                  <input
                    id={`preis-${p.id}`}
                    className="input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={String(p.vorgabePreis)}
                    value={eigenePreise[p.id] ?? ''}
                    onChange={(e) => setzePreis(p.id, e.target.value)}
                  />
                  <span className="input-suffix">€</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      <section className="panel result-panel" aria-labelledby="versandErgebnis">
        <h2 id="versandErgebnis" className="panel__heading">
          Ergebnis
        </h2>

        {!vollstaendig ? (
          <p className="placeholder">Trag alle drei Kanten und das Gewicht ein.</p>
        ) : treffer === null ? (
          /*
            Eigener Fall, nicht 0 €. „Passt in kein Produkt" ist eine Antwort;
            als Null gelesen wäre es eine Gewinnrechnung ohne Porto.
          */
          <p className="verdict verdict--loss">
            Passt in kein DHL-Paket
            <span className="verdict__detail">
              Über 31,5 kg oder länger als 120 cm — dafür braucht es eine Spedition.
            </span>
          </p>
        ) : (
          <>
            <p className="verdict verdict--good">
              {treffer.name}
              <span className="verdict__detail">
                {formatCurrency(preisFuer(treffer, eigenePreise))}
                {eigenePreise[treffer.id] === undefined ? ' · ungeprüfter Vorgabepreis' : ' · dein Preis'}
              </span>
            </p>

            <div className="table-wrap">
              <table className="fee-table">
                <thead>
                  <tr>
                    <th scope="col">Produkt</th>
                    <th scope="col">Passt</th>
                    <th scope="col">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {DHL_PRODUKTE.map((p) => {
                    const passt = passtIn(
                      p,
                      { laenge: eingabe.laenge, breite: eingabe.breite, hoehe: eingabe.hoehe },
                      eingabe.gewicht,
                    );
                    return (
                      <tr key={p.id}>
                        <th scope="row">
                          {p.name}
                          <span className="fee-table__note">
                            {massText(p)}
                          </span>
                        </th>
                        <td data-label="Passt" className={passt ? undefined : 'is-muted'}>
                          {passt ? 'ja' : 'nein'}
                        </td>
                        <td data-label="Preis" className={passt ? undefined : 'is-muted'}>
                          {formatCurrency(preisFuer(p, eigenePreise))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="hint">
          Nur Inlandsversand. Zuschläge für Sperrgut, Nachnahme oder Transportversicherung sind
          nicht enthalten.
        </p>
      </section>
    </div>
  );
}
