import { checkGtin } from './gtin';

/**
 * Vorbelegung aus der Adresszeile.
 *
 * Die Browser-Erweiterung lädt den Rechner in einem Rahmen und gibt die EAN
 * der offenen Produktseite als `?ean=` mit. Ein eigener Kanal (postMessage)
 * wäre dafür zu viel: Die Adresse funktioniert auch, wenn jemand sie von Hand
 * teilt oder als Lesezeichen ablegt.
 *
 * Geprüft wird trotzdem. Ein Wert aus der Adresszeile ist Fremdeingabe, auch
 * wenn er von der eigenen Erweiterung stammt — eine fremde Seite kann
 * genauso darauf verlinken. Was die Prüfziffer nicht besteht, wird verworfen
 * statt angezeigt.
 */
export function eanAusSuche(suche: string): string {
  const parameter = new URLSearchParams(suche);
  // `gtin` als Zweitname, weil die Erweiterungswelt diesen Begriff benutzt.
  const roh = parameter.get('ean') ?? parameter.get('gtin');
  if (!roh) return '';

  const pruefung = checkGtin(roh);
  return pruefung.status === 'gueltig' ? pruefung.normalized : '';
}

/**
 * Dasselbe, aber aus der laufenden Seite. Nur im Browser aufrufen — der
 * Rechner wird ohnehin ausschließlich dort gerendert (`ssr: false`).
 */
export function eanAusAdresse(): string {
  if (typeof window === 'undefined') return '';
  return eanAusSuche(window.location.search);
}
