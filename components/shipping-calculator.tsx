'use client';

import { useState } from 'react';
import {
  BELEGE,
  GEWICHTSSTUFEN,
  MAX_MASS,
  PREISSTAND,
  basispreisFuer,
  istUebergross,
  versandkosten,
} from '@/lib/shipping/dhl';
import { formatCurrency, parseNumber } from '@/lib/format';

/**
 * Versandrechner für DHL-Pakete im Geschäftskundentarif.
 *
 * Das Gewicht bestimmt den Preis, nicht die Größe — deshalb steht es hier
 * oben und allein. Die Maße sind dem untergeordnet: Sie entscheiden nur, ob
 * das Paket die Grenze zur Übergröße reißt, und sind freiwillig.
 *
 * Wer eigene Vertragspreise hat, trägt sie ein; sie bleiben im Browser. Die
 * Herkunft der hinterlegten Zahlen steht dabei, damit jeder einschätzen
 * kann, wie weit er ihnen trauen will.
 */

const SPEICHER = 'gk.versand.preise.v2';

function eigenePreiseLesen(): Record<string, number> {
  try {
    const roh = window.localStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Record<string, number>) : {};
  } catch {
    window.localStorage.removeItem(SPEICHER);
    return {};
  }
}

/** „bis 31,5 kg“ — mit Komma, nicht mit Punkt. */
function stufenName(bisKg: number): string {
  return `bis ${bisKg.toLocaleString('de-DE')} kg`;
}

export function ShippingCalculator() {
  const [gewicht, setGewicht] = useState('');
  const [masse, setMasse] = useState({ laenge: '', breite: '', hoehe: '' });
  /*
    Träger Anfangswert statt Effekt — die Komponente wird über
    `shipping-island.tsx` ohne serverseitiges Rendern eingebunden.
  */
  const [eigenePreise, setEigenePreise] = useState<Record<string, number>>(eigenePreiseLesen);

  const setzePreis = (id: string, wert: string) => {
    setEigenePreise((aktuell) => {
      const naechste = { ...aktuell };
      if (wert.trim() === '') delete naechste[id];
      else naechste[id] = parseNumber(wert);
      window.localStorage.setItem(SPEICHER, JSON.stringify(naechste));
      return naechste;
    });
  };

  const kg = parseNumber(gewicht);
  const kosten = kg > 0 ? versandkosten(kg, eigenePreise) : null;

  const maßeEingetragen =
    parseNumber(masse.laenge) > 0 && parseNumber(masse.breite) > 0 && parseNumber(masse.hoehe) > 0;
  const uebergross =
    maßeEingetragen &&
    istUebergross({
      laenge: parseNumber(masse.laenge),
      breite: parseNumber(masse.breite),
      hoehe: parseNumber(masse.hoehe),
    });

  const massFeld = (id: 'laenge' | 'breite' | 'hoehe', label: string, platzhalter: string) => (
    <div className="field">
      <label htmlFor={`versand-${id}`}>{label}</label>
      <div className="input-wrap">
        <input
          id={`versand-${id}`}
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          placeholder={platzhalter}
          autoComplete="off"
          value={masse[id]}
          onChange={(e) => setMasse((m) => ({ ...m, [id]: e.target.value }))}
        />
        <span className="input-suffix">cm</span>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <section className="panel form-panel" aria-labelledby="versandFormHeading">
        <h2 id="versandFormHeading" className="panel__heading">
          Angaben zum Paket
        </h2>

        <div className="field">
          <label htmlFor="versand-gewicht">Gewicht</label>
          <div className="input-wrap">
            <input
              id="versand-gewicht"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="1,5"
              autoComplete="off"
              value={gewicht}
              onChange={(e) => setGewicht(e.target.value)}
            />
            <span className="input-suffix">kg</span>
          </div>
          <p className="hint hint--immer">
            Im Geschäftskundentarif entscheidet allein das Gewicht über den Preis — Päckchen S und M
            gibt es hier nicht. Gewogen wird das fertig gepackte Paket.
          </p>
        </div>

        <details className="advanced">
          <summary>Maße prüfen (freiwillig)</summary>
          <div className="advanced__body">
            <p className="hint hint--standalone">
              Die Maße ändern den Preis nicht. Sie entscheiden nur, ob das Paket über{' '}
              {MAX_MASS.laenge} × {MAX_MASS.breite} × {MAX_MASS.hoehe} cm hinausgeht und damit als
              Übergröße gilt. In welcher Reihenfolge du sie einträgst, spielt keine Rolle.
            </p>
            <div className="field-row">
              {massFeld('laenge', 'Länge', '60')}
              {massFeld('breite', 'Breite', '40')}
            </div>
            <div className="field-row">{massFeld('hoehe', 'Höhe', '30')}</div>
          </div>
        </details>

        <details className="advanced">
          <summary>Eigene Vertragspreise hinterlegen</summary>
          <div className="advanced__body">
            <p className="hint hint--standalone">
              Trag deine eigenen Grundpreise ein, falls deine Staffel abweicht. Sie bleiben in
              diesem Browser und werden nirgendwo hochgeladen. Die Zuschläge rechnet der Rechner
              dann auf deinen Preis.
            </p>
            {GEWICHTSSTUFEN.map((s) => (
              <div className="field" key={s.id}>
                <label htmlFor={`preis-${s.id}`}>{stufenName(s.bisKg)}</label>
                <div className="input-wrap">
                  <input
                    id={`preis-${s.id}`}
                    className="input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={String(s.basispreis)}
                    value={eigenePreise[s.id] ?? ''}
                    onChange={(e) => setzePreis(s.id, e.target.value)}
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

        {kg <= 0 ? (
          <p className="placeholder">Trag das Gewicht ein.</p>
        ) : kosten === null ? (
          /*
            Eigener Fall, nicht 0 €. Über 31,5 kg ist kein Paket mehr; als
            Null gelesen wäre es eine Gewinnrechnung ohne Porto.
          */
          <p className="verdict verdict--loss">
            Zu schwer für ein Paket
            <span className="verdict__detail">
              Über 31,5 kg nimmt DHL die Sendung nicht als Paket an — dafür braucht es eine
              Spedition.
            </span>
          </p>
        ) : (
          <>
            <p className="verdict verdict--good">
              {formatCurrency(kosten.gesamt)}
              <span className="verdict__detail">
                netto · Stufe {stufenName(kosten.stufe.bisKg)}
                {eigenePreise[kosten.stufe.id] !== undefined && ' · dein Preis'}
              </span>
            </p>

            {uebergross && (
              <div className="notice notice--after">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
                <span>
                  <strong>Übergröße.</strong> Mindestens eine Kante überschreitet{' '}
                  {MAX_MASS.laenge} × {MAX_MASS.breite} × {MAX_MASS.hoehe} cm. DHL berechnet dafür
                  einen Zuschlag, der in den ausgewerteten Rechnungen nicht vorkommt — er ist oben{' '}
                  <strong>nicht enthalten</strong>.
                </span>
              </div>
            )}

            <div className="ledger">
              <div className="ledger__list">
                <div className="ledger__row">
                  <span className="ledger__term">
                    Grundpreis
                    <span className="ledger__note">{stufenName(kosten.stufe.bisKg)}</span>
                  </span>
                  <span className="ledger__value">{formatCurrency(kosten.basispreis)}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__term">
                    Maut- und CO2-Zuschlag
                    <span className="ledger__note">fester Betrag je Sendung</span>
                  </span>
                  <span className="ledger__value">{formatCurrency(kosten.mautZuschlag)}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__term">
                    Energiezuschlag
                    <span className="ledger__note">1,25 % vom Grundpreis</span>
                  </span>
                  <span className="ledger__value">{formatCurrency(kosten.energieZuschlag)}</span>
                </div>
                <div className="ledger__row ledger__row--total">
                  <span className="ledger__term">Gesamt netto</span>
                  <span className="ledger__value">{formatCurrency(kosten.gesamt)}</span>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="fee-table">
                <thead>
                  <tr>
                    <th scope="col">Stufe</th>
                    <th scope="col">Grundpreis</th>
                    <th scope="col">Mit Zuschlägen</th>
                  </tr>
                </thead>
                <tbody>
                  {GEWICHTSSTUFEN.map((s) => {
                    const dieseStufe = s.id === kosten.stufe.id;
                    const gesamt = versandkosten(s.bisKg, eigenePreise);
                    return (
                      <tr key={s.id}>
                        <th scope="row">
                          {stufenName(s.bisKg)}
                          {dieseStufe && <span className="fee-table__note">dein Paket</span>}
                        </th>
                        <td data-label="Grundpreis" className={dieseStufe ? undefined : 'is-muted'}>
                          {formatCurrency(basispreisFuer(s, eigenePreise))}
                        </td>
                        <td data-label="Mit Zuschlägen" className={dieseStufe ? undefined : 'is-muted'}>
                          {gesamt ? formatCurrency(gesamt.gesamt) : '—'}
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
          Alle Beträge netto, Inlandsversand. Aus {BELEGE} echten DHL-Rechnungen abgelesen, Stand{' '}
          {PREISSTAND}. Im November und Dezember kommt ein Peakzuschlag dazu (0,19–0,50 € je
          Sendung), der hier nicht eingerechnet ist.
        </p>
      </section>
    </div>
  );
}
