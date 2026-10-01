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
