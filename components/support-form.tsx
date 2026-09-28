'use client';

import { useState } from 'react';
import { OPERATOR, SITE } from '@/lib/site';

/**
 * Kontaktformular für allgemeine Anliegen.
 *
 * Bewusst getrennt von der Gebührenmeldung im Rechner: Dort geht es um
 * strukturierte Daten aus einer Abrechnung, hier um Fragen, Fehlerberichte
 * und Vorschläge in freier Form. Zwei Anliegen in ein Formular zu zwingen
 * hätte beide schlechter gemacht.
 *
 * Versand wie überall per E-Mail: kein Server, keine personenbezogenen Daten
 * bei uns, und der Absender behält die Nachricht im eigenen Postausgang.
 */

const ANLIEGEN = [
  { value: 'frage', label: 'Frage zur Berechnung' },
  { value: 'gebuehr', label: 'Ein Gebührensatz stimmt nicht' },
  { value: 'fehler', label: 'Etwas funktioniert nicht' },
  { value: 'vorschlag', label: 'Vorschlag oder Wunsch' },
  { value: 'datenschutz', label: 'Datenschutz oder Rechtliches' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const;

type Anliegen = (typeof ANLIEGEN)[number]['value'];

const BETREFF: Record<Anliegen, string> = {
  frage: 'Frage zur Berechnung',
  gebuehr: 'Abweichender Gebührensatz',
  fehler: 'Fehlermeldung',
  vorschlag: 'Vorschlag',
  datenschutz: 'Datenschutzanfrage',
  sonstiges: 'Anfrage',
};

export function SupportForm() {
  const [anliegen, setAnliegen] = useState<Anliegen>('frage');
  const [nachricht, setNachricht] = useState('');

  if (!OPERATOR.email) return null;

  const text = [
    nachricht.trim(),
    '',
    '—',
    `Anliegen: ${ANLIEGEN.find((eintrag) => eintrag.value === anliegen)?.label}`,
    `Gesendet über: ${SITE.domain}`,
  ].join('\n');

  const href = `mailto:${OPERATOR.email}?subject=${encodeURIComponent(
    `${BETREFF[anliegen]} · ${SITE.name}`,
  )}&body=${encodeURIComponent(text)}`;

  const bereit = nachricht.trim().length >= 10;

  return (
    <div className="support-form">
      <div className="field">
        <label htmlFor="anliegen">Worum geht es?</label>
        <div className="input-wrap">
          <select
            id="anliegen"
            className="input"
            value={anliegen}
            onChange={(event) => setAnliegen(event.target.value as Anliegen)}
          >
            {ANLIEGEN.map((eintrag) => (
              <option key={eintrag.value} value={eintrag.value}>
                {eintrag.label}
              </option>
            ))}
          </select>
        </div>
        {anliegen === 'gebuehr' && (
          <p className="hint">
            Für abweichende Gebührensätze gibt es im Rechner ein eigenes Formular — es erfasst
            Kategorie, Artikel und Beträge strukturiert und hilft deutlich mehr. Du findest es
            unter dem Ergebnis.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="nachricht">Deine Nachricht</label>
        <textarea
          id="nachricht"
          className="input input--area"
          rows={7}
          placeholder="Beschreib möglichst genau, worum es geht. Bei einem Fehler: Was hast du gemacht, was ist passiert, was hättest du erwartet?"
          value={nachricht}
          onChange={(event) => setNachricht(event.target.value)}
        />
      </div>

      <div className="form-actions">
        <a
          className={`btn btn--primary${bereit ? '' : ' is-disabled'}`}
          href={bereit ? href : undefined}
          aria-disabled={!bereit}
        >
          Nachricht schreiben
        </a>
      </div>
      <p className="hint">
        {bereit
          ? 'Öffnet dein E-Mail-Programm mit einer fertigen Nachricht. Du kannst alles vor dem Senden lesen und ändern.'
          : 'Bitte schreib ein paar Worte zu deinem Anliegen.'}
      </p>
    </div>
  );
}
