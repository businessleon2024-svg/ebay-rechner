'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ALLOW_ALL,
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  CONSENT_REQUIRING_SERVICES,
  DENY_ALL,
  activeCategories,
  consentRequired,
  readConsent,
  writeConsent,
  type ConsentCategory,
  type ConsentDecision,
} from '@/lib/consent';

/**
 * Einwilligungsdialog für nicht notwendige Dienste.
 *
 * Erscheint nur, wenn tatsächlich ein einwilligungspflichtiger Dienst
 * eingebunden ist (siehe lib/consent.ts). Ablehnen ist auf derselben Ebene und
 * mit gleichem Gewicht möglich wie Zustimmen — alles andere wäre nach der
 * DSGVO keine freiwillige Einwilligung.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [selection, setSelection] = useState<ConsentDecision>(DENY_ALL);

  useEffect(() => {
    const sync = () => setOpen(consentRequired() && readConsent() === null);
    sync();
    window.addEventListener('consentchange', sync);
    return () => window.removeEventListener('consentchange', sync);
  }, []);

  if (!open) return null;

  const kategorien = activeCategories();

  const entscheiden = (decision: ConsentDecision) => {
    writeConsent(decision);
    setOpen(false);
  };

  const umschalten = (category: ConsentCategory) =>
    setSelection((current) => ({ ...current, [category]: !current[category] }));

  return (
    <div
      className="consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-text"
    >
      <div className="consent__inner">
        <h2 className="consent__title" id="consent-title">
          Deine Entscheidung über Werbung und Messung
        </h2>
        <p className="consent__text" id="consent-text">
          Für den Betrieb des Rechners speichern wir nur, was du selbst eingibst — in deinem
          Browser, nicht bei uns. Dafür brauchen wir keine Einwilligung. Darüber hinaus möchten wir
          die unten genannten Dienste einsetzen. Du kannst das ablehnen und den Rechner trotzdem
          vollständig nutzen.
        </p>

        {details && (
          <ul className="consent__list">
            {kategorien.map((category) => (
              <li className="consent__item" key={category}>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={selection[category]}
                    onChange={() => umschalten(category)}
                  />
                  {CATEGORY_LABEL[category]}
                </label>
                <p className="consent__purpose">{CATEGORY_DESCRIPTION[category]}</p>
                <p className="consent__services">
                  {CONSENT_REQUIRING_SERVICES.filter((service) => service.category === category)
                    .map((service) => `${service.name}: ${service.purpose}`)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="consent__actions">
          <button type="button" className="btn btn--ghost" onClick={() => entscheiden(DENY_ALL)}>
            Nur Notwendiges
          </button>
          {details ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => entscheiden(selection)}
            >
              Auswahl speichern
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => setDetails(true)}>
              Einstellungen
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={() => entscheiden(ALLOW_ALL)}>
            Alle akzeptieren
          </button>
        </div>

        <p className="consent__legal">
          Du kannst deine Entscheidung jederzeit im Fußbereich ändern. Näheres in der{' '}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </div>
    </div>
  );
}
