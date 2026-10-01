'use client';

import { useEffect } from 'react';

/**
 * Meldet den Service Worker an.
 *
 * Er sorgt dafür, dass der Rechner auch ohne Netz startet — und ist zugleich
 * die Bedingung, unter der Android überhaupt anbietet, die Seite als App zu
 * installieren. iOS braucht ihn dafür nicht, profitiert aber genauso vom
 * Offline-Betrieb.
 *
 * Fehler werden bewusst verschluckt: Scheitert die Anmeldung — etwa im
 * privaten Modus oder bei abgeschalteten Service Workern — soll die Seite
 * normal weiterlaufen. Offline-Betrieb ist eine Zugabe, keine Voraussetzung.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    /*
      In der Entwicklung bleibt er aus. Der Service Worker behandelt alles
      unter `/_next/static/` als unveränderlich, weil der Dateiname dort im
      Produktionsbau einen Hash trägt. Beim Entwickeln ändert sich der Inhalt
      aber unter gleichbleibender Adresse — der Speicher liefert dann endlos
      den alten Stand aus, und Änderungen am Stylesheet kommen nie an.

      Genau darauf bin ich beim Bauen hereingefallen: Die Kopfzeilen-Korrektur
      war längst übersetzt und wurde trotzdem nicht angezeigt.
    */
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((alle) => {
        for (const eintrag of alle) void eintrag.unregister();
      });
      void caches.keys().then((namen) => {
        for (const name of namen) if (name.startsWith('gk-')) void caches.delete(name);
      });
      return;
    }

    // Erst nach dem Laden anmelden, damit die Anmeldung nicht mit dem
    // Aufbau der Seite um die Leitung konkurriert.
    const anmelden = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    if (document.readyState === 'complete') anmelden();
    else {
      window.addEventListener('load', anmelden);
      return () => window.removeEventListener('load', anmelden);
    }
  }, []);

  return null;
}
