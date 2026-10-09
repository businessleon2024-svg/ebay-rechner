'use client';

import { useEffect, useRef, useState } from 'react';
import { checkGtin } from '@/lib/gtin';
import { eanAusAdresse } from '@/lib/start-params';

/**
 * Nachschlagen der eBay-Kategorie über die EAN.
 *
 * Hinterlegt sind nur Hauptkategorien, abgerechnet wird nach der
 * Unterkategorie — daran ist die Berechnung der Logitech-Webcam gescheitert
 * (7 % angenommen, 12 % abgerechnet). Welche Unterkategorie gilt, verrät kein
 * Gebührenverzeichnis, wohl aber die Angebote selbst: Die Route zählt aus, wo
 * Verkäufer das Produkt tatsächlich einstellen.
 *
 * Angezeigt wird immer, worauf der Befund beruht („7 von 9 Angeboten"). Eine
 * knappe Mehrheit ist etwas anderes als Einigkeit, und das soll man sehen,
 * statt es verborgen in eine Zahl zu gießen.
 *
 * Die Kategorie wird nie selbsttätig gewechselt. Ein Rechner, der die Eingabe
 * unter der Hand verändert, ist schlimmer als einer, der schweigt.
 */

interface Kategorie {
  id: string;
  name?: string;
  anzahl: number;
  anteil: number;
  /** Vollständiger Pfad, etwa „Computer, Tablets & Netzwerk › Webcams". */
  pfadText?: string;
  hinterlegteKategorie: { id: string; name: string } | null;
  /** Auf welcher Ebene die Zuordnung gelang. */
  treffer: 'exakt' | 'hauptkategorie' | 'keiner';
}

interface Befund {
  gtin: string;
  ausgewertet: number;
  kategorien: Kategorie[];
  beispielTitel?: string;
}

type Zustand =
  | { art: 'ruht' }
  | { art: 'laeuft' }
  | { art: 'befund'; befund: Befund }
  | { art: 'fehler'; text: string };

/** Wartezeit nach der letzten Eingabe. Jede Abfrage zählt gegen das Kontingent. */
const TIPPPAUSE_MS = 600;

export function EanLookup({
  gewaehlteKategorie,
  aufKategorie,
}: {
  gewaehlteKategorie: string;
  aufKategorie: (categoryId: string) => void;
}) {
  /*
    Vorbelegt aus der Adresszeile, falls die Erweiterung eine EAN mitgegeben
    hat. Als träger Anfangswert, nicht als Effekt: Der Wert steht beim ersten
    Zeichnen fest und ändert sich danach nur noch durch Tippen. Ein Effekt
    würde ihn nach dem ersten Bild nachschieben und dabei eine bereits
    begonnene Eingabe überschreiben.
  */
  const [eingabe, setEingabe] = useState(eanAusAdresse);
  /*
    Das Ergebnis wird zusammen mit der EAN festgehalten, zu der es gehört.
    Dadurch gilt es beim Weitertippen von selbst nicht mehr, statt es in
    einem Effekt zurücksetzen zu müssen — ein Zustand, der sich aus der
    Eingabe ableiten lässt, gehört nicht noch einmal gespeichert.
  */
  const [ergebnis, setErgebnis] = useState<{ gtin: string; zustand: Zustand } | null>(null);
  /**
   * `null` heißt „noch nicht geprüft". Die Prüfung kostet nichts: Ein Aufruf
   * ohne EAN erreicht die eBay-API gar nicht, er beantwortet nur, ob
   * Zugangsdaten hinterlegt sind.
   */
  const [verfuegbar, setVerfuegbar] = useState<boolean | null>(null);

  useEffect(() => {
    let abgebrochen = false;
    fetch('/api/kategorie')
      .then((antwort) => {
        if (!abgebrochen) setVerfuegbar(antwort.status !== 503);
      })
      .catch(() => {
        if (!abgebrochen) setVerfuegbar(false);
      });
    return () => {
      abgebrochen = true;
    };
  }, []);

  const pruefung = checkGtin(eingabe);
  const gtin = pruefung.status === 'gueltig' ? pruefung.normalized : null;

  // Abfragen nur für vollständige, gültige Nummern — und erst, wenn das
  // Tippen aufgehört hat.
  const laufendeAbfrage = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!gtin || !verfuegbar) return;

    const uhr = setTimeout(() => {
      laufendeAbfrage.current?.abort();
      const steuerung = new AbortController();
      laufendeAbfrage.current = steuerung;
      setErgebnis({ gtin, zustand: { art: 'laeuft' } });

      fetch(`/api/kategorie?ean=${gtin}`, { signal: steuerung.signal })
        .then(async (antwort) => {
          if (!antwort.ok) throw new Error(String(antwort.status));
          const befund = (await antwort.json()) as Befund;
          setErgebnis({ gtin, zustand: { art: 'befund', befund } });
        })
        .catch((fehler: unknown) => {
          if (fehler instanceof Error && fehler.name === 'AbortError') return;
          setErgebnis({
            gtin,
            zustand: {
              art: 'fehler',
              text: 'Die Abfrage hat nicht geklappt. Die Kategorie lässt sich weiterhin von Hand wählen.',
            },
          });
        });
    }, TIPPPAUSE_MS);

    return () => clearTimeout(uhr);
  }, [gtin, verfuegbar]);

  // Nur gültig, solange die Eingabe noch zu dem gehört, was abgefragt wurde.
  const zustand: Zustand = ergebnis && ergebnis.gtin === gtin ? ergebnis.zustand : { art: 'ruht' };

  // Ohne hinterlegte Zugangsdaten gibt es nichts nachzuschlagen — dann soll
  // auch kein Feld den Eindruck erwecken, es gäbe die Möglichkeit.
  if (!verfuegbar) return null;

  // Zusammen herausziehen, damit die Anzeige nicht an zwei Stellen prüfen muss.
  const befund = zustand.art === 'befund' ? zustand.befund : null;
  const beste = befund?.kategorien[0] ?? null;

  return (
    <div className="field ean-lookup">
      <label htmlFor="eanLookup">EAN des Artikels (freiwillig)</label>
      <div className="input-wrap">
        <input
          id="eanLookup"
          className="input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="5099206113503"
          aria-describedby="ean-lookup-hinweis"
          value={eingabe}
          onChange={(event) => setEingabe(event.target.value)}
        />
      </div>

      <div id="ean-lookup-hinweis" aria-live="polite">
        {eingabe.trim() === '' && (
          <p className="hint">
            Schlägt nach, in welche Unterkategorie Verkäufer diesen Artikel bei eBay tatsächlich
            einstellen — dort entscheidet sich der Satz, nicht in der Hauptkategorie.
          </p>
        )}

        {eingabe.trim() !== '' && pruefung.status === 'keine_ziffern' && (
          <p className="ean-lookup__fehler">Eine EAN besteht nur aus Ziffern.</p>
        )}
        {pruefung.status === 'laenge' && (
          <p className="ean-lookup__fehler">
            {pruefung.laenge} Stellen — eine EAN hat 8, 12, 13 oder 14.
          </p>
        )}
        {pruefung.status === 'pruefziffer' && (
          <p className="ean-lookup__fehler">
            Prüfziffer stimmt nicht, erwartet wäre {pruefung.erwartet}.
          </p>
        )}

        {zustand.art === 'laeuft' && <p className="hint">Wird bei eBay nachgeschlagen …</p>}
        {zustand.art === 'fehler' && <p className="ean-lookup__fehler">{zustand.text}</p>}

        {befund !== null && befund.ausgewertet === 0 && (
          <p className="hint">
            Zu dieser EAN stehen gerade keine Angebote bei eBay. Die Kategorie bitte von Hand
            wählen.
          </p>
        )}

        {beste && (
          <div className="ean-lookup__befund">
            <p className="ean-lookup__satz">
              eBay-Angebote zu dieser EAN stehen überwiegend unter{' '}
              <strong>{beste.pfadText ?? beste.name ?? `Kategorie ${beste.id}`}</strong> —{' '}
              {beste.anzahl} von {befund!.ausgewertet} Angeboten.
            </p>

            {befund!.beispielTitel && (
              <p className="ean-lookup__beleg">Beispiel: {befund!.beispielTitel}</p>
            )}

            {/*
              Ein Treffer über die Hauptkategorie ist eine schwächere Auskunft
              als ein exakter: Die Unterkategorie kann abweichend abgerechnet
              werden, genau wie bei Webcams und Streaming-Sticks. Das wird
              gesagt, statt es unter den Tisch fallen zu lassen.
            */}
            {beste.treffer === 'hauptkategorie' && (
              <p className="ean-lookup__abweichung">
                Für diese Unterkategorie ist kein eigener Satz hinterlegt — gerechnet wird mit der
                Hauptkategorie darüber. Unterkategorien werden mitunter abweichend abgerechnet.
              </p>
            )}

            {beste.hinterlegteKategorie ? (
              beste.hinterlegteKategorie.id === gewaehlteKategorie ? (
                <p className="ean-lookup__treffer">
                  Das passt zur gewählten Kategorie.
                </p>
              ) : (
                <div className="ean-lookup__aktion">
                  <p className="ean-lookup__abweichung">
                    Gewählt ist eine andere Kategorie. Hinterlegt ist dafür{' '}
                    <strong>{beste.hinterlegteKategorie.name}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => aufKategorie(beste.hinterlegteKategorie!.id)}
                  >
                    Kategorie übernehmen
                  </button>
                </div>
              )
            ) : (
              <p className="ean-lookup__abweichung">
                Zu dieser Kategorie ist hier kein Satz hinterlegt — auch keiner auf höherer Ebene.
                Bitte von Hand wählen und, sobald deine Abrechnung da ist, unten melden.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
