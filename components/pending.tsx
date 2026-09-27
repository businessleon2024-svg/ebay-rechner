/**
 * Platzhalter für Angaben, die vor dem Livegang noch fehlen.
 *
 * Bewusst auffällig gestaltet: Eine fehlende E-Mail-Adresse im Impressum darf
 * nicht unbemerkt online gehen.
 */
export function Pending({ children }: { children: React.ReactNode }) {
  return <mark className="pending">{children}</mark>;
}
