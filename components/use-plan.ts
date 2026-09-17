'use client';

import { useSyncExternalStore } from 'react';
import type { Plan } from '@/lib/plan';

const PLAN_STORAGE_KEY = 'ebayCalc.plan';

function subscribe(onChange: () => void): () => void {
  // Reagiert auch auf einen Tarifwechsel in einem anderen Tab.
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function getSnapshot(): Plan {
  return window.localStorage.getItem(PLAN_STORAGE_KEY) === 'pro' ? 'pro' : 'free';
}

/** Serverseitig ist kein Tarif bekannt – bis zur Hydration gilt Free. */
function getServerSnapshot(): Plan {
  return 'free';
}

/**
 * Aktueller Tarif des Besuchers.
 *
 * Platzhalter, bis es Accounts gibt: der Wert kommt aus dem localStorage und
 * ist damit vom Nutzer frei setzbar. Das ist hier unkritisch, weil bisher nur
 * die Werbefläche daran hängt — sobald Pro-Funktionen mit echten Kosten
 * dazukommen (Extension, Preisvergleich), muss der Tarif serverseitig geprüft
 * werden. Diese Funktion ist dann der einzige Ort, der sich ändert.
 */
export function usePlan(): Plan {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
