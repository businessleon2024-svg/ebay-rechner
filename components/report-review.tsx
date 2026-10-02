'use client';

import { useMemo, useState } from 'react';
import { leseMeldungen } from '@/lib/reports/parse';
import { istBelastbar, weichtAb, werteMeldungenAus, type Schluessel } from '@/lib/reports/aggregate';
import { EBAY } from '@/lib/fees/marketplaces';
import { formatPercent } from '@/lib/format';

/**
 * Auswertung eingegangener Gebührenmeldungen.
 *
 * Werkzeug für den Betreiber, nicht für Besucher. Es läuft vollständig im
 * Browser: Der eingefügte Text verlässt das Gerät nicht, und es braucht weder
 * Datenbank noch Anmeldung.
 *
 * Dieselbe Auswertung soll später serverseitig über eingehende Meldungen
 * laufen. Deshalb steckt die Logik in `lib/reports/`, nicht hier — diese
 * Datei zeigt sie nur an.
 */

const SCHLUESSEL: ReadonlyArray<{ wert: Schluessel; label: string; hilfe: string }> = [
  {
    wert: 'kategorie',
    label: 'Gewählte Kategorie',
    hilfe: 'Zeigt, welche hinterlegten Sätze danebenliegen.',
  },
  {
    wert: 'unterkategorie',
    label: 'Kategorie im Angebot',
    hilfe: 'Zeigt, welche Unterkategorien eigene Sätze brauchen.',
  },
  {
    wert: 'ean',
    label: 'EAN',
    hilfe: 'Zeigt, ob derselbe Artikel überall gleich abgerechnet wird.',
  },
];

export function ReportReview() {
  const [text, setText] = useState('');
  const [schluessel, setSchluessel] = useState<Schluessel>('kategorie');

  const { meldungen, befunde } = useMemo(() => {
    const gelesen = leseMeldungen(text);
    return { meldungen: gelesen, befunde: werteMeldungenAus(gelesen, schluessel) };
  }, [text, schluessel]);

  const hinterlegt = (id: string) => EBAY.categories.find((k) => k.id === id);

  return (
    <div>
      <div className="field">
        <label htmlFor="meldungstext">Meldungen einfügen</label>
        <textarea
          id="meldungstext"
          className="input input--area"
          rows={9}
          placeholder="E-Mails hier einfügen — auch mehrere auf einmal, mit Begleittext und Zitatzeichen."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className="hint">
          Der Text bleibt auf diesem Gerät. Es wird nichts hochgeladen und nichts gespeichert.
        </p>
      </div>

      <div className="field">
        <label htmlFor="gruppierung">Gruppieren nach</label>
        <div className="input-wrap">
          <select
            id="gruppierung"
            className="input"
            value={schluessel}
            onChange={(event) => setSchluessel(event.target.value as Schluessel)}
          >
            {SCHLUESSEL.map((eintrag) => (
              <option key={eintrag.wert} value={eintrag.wert}>
                {eintrag.label}
              </option>
            ))}
          </select>
        </div>
        <p className="hint">{SCHLUESSEL.find((e) => e.wert === schluessel)?.hilfe}</p>
      </div>

      {text.trim() !== '' && (
        <p className="section__note">
          {meldungen.length === 0
            ? 'Kein Meldungsblock gefunden. Die Nachricht muss den Abschnitt zwischen den Markierungen enthalten.'
            : `${meldungen.length} Meldung${meldungen.length === 1 ? '' : 'en'} gelesen, ${befunde.length} Gruppe${befunde.length === 1 ? '' : 'n'} gebildet.`}
        </p>
      )}

      {befunde.length > 0 && (
        <div className="table-wrap">
          <table className="fee-table">
            <thead>
              <tr>
                <th scope="col">Gruppe</th>
                <th scope="col">Gemeldet</th>
                <th scope="col">Hinterlegt</th>
                <th scope="col">Belege</th>
              </tr>
            </thead>
            <tbody>
              {befunde.map((befund) => {
                const kategorie = schluessel === 'kategorie' ? hinterlegt(befund.gruppe) : undefined;
                const abweichung =
                  kategorie !== undefined && weichtAb(befund, kategorie.standardPercent);
                const belastbar = istBelastbar(befund);

                return (
                  <tr key={`${befund.marktplatz}-${befund.gruppe}`}>
                    <th scope="row">
                      {kategorie?.name ?? befund.gruppe}
                      {befund.beispiel && (
                        <span className="fee-table__note">{befund.beispiel}</span>
                      )}
                    </th>
                    <td data-label="Gemeldet">
                      {formatPercent(befund.satz)}
                      {/*
                        Die Verteilung steht dabei, sobald sie nicht einstimmig
                        ist. Ein Befund aus 2 von 3 Meldungen ist etwas anderes
                        als einer aus 3 von 3 — und das soll man sehen.
                      */}
                      {befund.verteilung.length > 1 && (
                        <span className="fee-table__note">
                          {befund.verteilung.map((e) => `${e.satz} % ×${e.anzahl}`).join(', ')}
                        </span>
                      )}
                    </td>
                    <td data-label="Hinterlegt" className={abweichung ? undefined : 'is-muted'}>
                      {kategorie ? formatPercent(kategorie.standardPercent) : '—'}
                      {abweichung && <span className="fee-table__note">weicht ab</span>}
                    </td>
                    <td data-label="Belege">
                      {befund.einig} von {befund.meldungen}
                      <span className="fee-table__note">
                        {belastbar ? 'belastbar' : 'noch zu dünn'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
