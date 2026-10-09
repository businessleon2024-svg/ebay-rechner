'use client';

import { useEffect } from 'react';

/**
 * Eingebetteter Betrieb — der Rechner im Seitenpanel der Erweiterung.
 *
 * Die Erweiterung ruft `/rechner?ext=1` auf. Dort ist alles überflüssig, was
 * die Seite zu einer Seite macht: Kopfzeile mit Navigation, Fußzeile,
 * Erklärabschnitte, Werbefläche. Im Panel sind das sechs Bildschirme
 * Scrollen, bevor man das Ergebnis sieht — bei 400 px Breite war das Dokument
 * 4879 px hoch.
 *
 * Gesetzt wird nur ein Attribut, versteckt wird in CSS. Die Alternative wäre,
 * den Parameter serverseitig zu lesen — das macht die Route dynamisch und
 * nimmt ihr die Zwischenspeicherung, für ein paar versteckte Abschnitte ein
 * schlechter Tausch.
 */
export function EmbedMode() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('ext') !== '1') return;

    document.documentElement.dataset.embed = '1';
    /*
      Aufräumen beim Verlassen. Ohne das bliebe das Attribut stehen, wenn
      jemand im Panel auf „Alle Sätze ansehen" klickt und zurückkehrt — die
      Gebührenübersicht wäre dann dauerhaft ohne Navigation.
    */
    return () => {
      delete document.documentElement.dataset.embed;
    };
  }, []);

  return null;
}
