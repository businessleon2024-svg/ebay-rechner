'use client';

import Link from 'next/link';
import { can } from '@/lib/plan';
import { usePlan } from './use-plan';

/**
 * Werbefläche des kostenlosen Tarifs.
 *
 * Bewusst zurückhaltend: eine statische, klar als Anzeige gekennzeichnete
 * Fläche im Lesefluss. Keine Overlays, keine Einblendungen über dem Inhalt,
 * nichts, was die Bedienung des Rechners unterbricht.
 *
 * Solange kein Werbepartner angebunden ist, steht hier der Hinweis auf Pro
 * statt einer leeren Fläche. Eine spätere Anbindung ersetzt nur den Inhalt
 * dieser Komponente — die Platzierung bleibt, wie sie ist.
 */
export function AdSlot() {
  const plan = usePlan();

  if (can(plan, 'adFree')) return null;

  return (
    <aside className="ad-slot" aria-label="Anzeige">
      <span className="ad-slot__tag">Anzeige</span>
      <p className="ad-slot__text">
        Mit <strong>Pro</strong> analysierst du Produkte direkt auf der Händlerseite — und siehst
        diese Fläche nicht mehr.
      </p>
      <Link className="ad-slot__link" href="/#tarife">
        Pro ansehen
      </Link>
    </aside>
  );
}
