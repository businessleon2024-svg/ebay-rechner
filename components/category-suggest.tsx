'use client';

import { useMemo, useState } from 'react';
import { schlageKategorienVor } from '@/lib/fees/suggest';

/**
 * Kategoriesuche über eine Produktbeschreibung.
 *
 * Die Auswahlliste führt Hauptkategorien, verkauft werden aber
 * Unterkategorien. Wer ein Reinigungsmittel verkauft, findet dort keinen
 * Eintrag „Reinigungsmittel" und rät sich etwas zusammen.
 *
 * Deshalb hier ein Suchfeld statt einer weiteren Liste. Jeder Vorschlag sagt,
 * worauf er beruht — belegt oder vermutet — und wird erst auf Klick
 * übernommen. Ein Rechner, der die Eingabe unter der Hand ändert, wäre
 * schlimmer als einer, der schweigt.
 */
export function CategorySuggest({
  gewaehlteKategorie,
  aufKategorie,
}: {
  gewaehlteKategorie: string;
  aufKategorie: (categoryId: string) => void;
}) {
  const [text, setText] = useState('');

  // Die Suche ist reine Rechnerei auf einer kleinen Liste — kein Netzzugriff,
  // kein Grund für eine Verzögerung.
  const vorschlaege = useMemo(() => schlageKategorienVor(text), [text]);
  const gesucht = text.trim().length >= 3;

  return (
    <div className="field suggest">
      <label htmlFor="kategorieSuche">Kategorie über das Produkt finden</label>
      <div className="input-wrap">
        <input
          id="kategorieSuche"
          className="input"
          type="text"
          autoComplete="off"
          placeholder="z. B. Webcam, Reinigungsmittel, Akkuschrauber"
          aria-describedby="suggest-ergebnis"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      <div id="suggest-ergebnis" aria-live="polite">
        {!gesucht && (
          <p className="hint">
            Beschreib den Artikel in ein paar Worten. Hinterlegt sind Hauptkategorien — die
            Unterkategorie, unter der du einstellst, entscheidet aber über den Satz.
          </p>
        )}

        {gesucht && vorschlaege.length === 0 && (
          <p className="hint">
            Dazu habe ich keinen Vorschlag. Bitte unten von Hand wählen — und wenn deine
            Abrechnung kommt, über das Formular unter dem Ergebnis melden.
          </p>
        )}

        {vorschlaege.map((vorschlag) => {
          const istGewaehlt = vorschlag.category.id === gewaehlteKategorie;
          return (
            <div className="suggest__treffer" key={vorschlag.category.id}>
              <div className="suggest__kopf">
                <span className="suggest__name">
                  {vorschlag.category.name} · {vorschlag.category.standardPercent} %
                </span>
                {/*
                  Die Kennzeichnung ist der Kern: Ein geratener Satz, der
                  aussieht wie ein geprüfter, ist schlimmer als gar keiner.
                */}
                <span
                  className={`suggest__marke suggest__marke--${vorschlag.sicherheit}`}
                  title={
                    vorschlag.sicherheit === 'belegt'
                      ? 'An einer echten Gebührenabrechnung abgelesen.'
                      : 'Begründete Einschätzung, nicht an einer Abrechnung geprüft.'
                  }
                >
                  {vorschlag.sicherheit === 'belegt' ? 'belegt' : 'Vermutung'}
                </span>
              </div>

              <p className="suggest__grund">{vorschlag.grund}</p>

              {istGewaehlt ? (
                <p className="suggest__gewaehlt">Bereits gewählt.</p>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => aufKategorie(vorschlag.category.id)}
                >
                  Diese Kategorie wählen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
