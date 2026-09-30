import { werteAntwortAus, type GtinBefund } from './browse';

/**
 * Zugriff auf die eBay Browse API.
 *
 * Läuft ausschließlich auf dem Server: Das Zugangsgeheimnis darf den Browser
 * nie erreichen. Diese Datei wird deshalb nur von der Route unter
 * `app/api/` eingebunden, nicht von einer Komponente.
 *
 * Das Abrufkontingent für Anwendungs-Token liegt bei rund 1.000 Aufrufen am
 * Tag. Dieselbe EAN zweimal abzurufen wäre damit Verschwendung, deshalb wird
 * sowohl das Token als auch jedes Ergebnis zwischengespeichert. Der Speicher
 * lebt nur, solange die Serverinstanz lebt — die eigentliche Ersparnis
 * bringt der Zwischenspeicher am Netzrand über die Kopfzeilen der Route.
 */

const TOKEN_ENDPUNKT = 'https://api.ebay.com/identity/v1/oauth2/token';
const BROWSE_ENDPUNKT = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const SCOPE = 'https://api.ebay.com/oauth/api_scope';

/** Wie viele Angebote je EAN ausgewertet werden. Mehr schärft die Mehrheit kaum. */
const ANGEBOTE_JE_ABFRAGE = 20;

/** Sicherheitsabstand, damit kein Aufruf mit einem gerade ablaufenden Token startet. */
const TOKEN_PUFFER_MS = 60_000;

const ERGEBNIS_HALTBARKEIT_MS = 24 * 60 * 60 * 1000;

export interface EbayZugang {
  clientId: string;
  clientSecret: string;
  marketplaceId: string;
}

/**
 * Liest die Zugangsdaten aus der Umgebung. Fehlen sie, ist das kein Fehler,
 * sondern der reguläre Zustand vor der Einrichtung — die Route antwortet dann
 * mit einem klaren Hinweis statt mit einem Absturz.
 */
export function zugang(): EbayZugang | null {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    marketplaceId: process.env.EBAY_MARKETPLACE_ID ?? 'EBAY_DE',
  };
}

let tokenSpeicher: { token: string; gueltigBis: number } | null = null;

async function holeToken(zugangsdaten: EbayZugang): Promise<string> {
  if (tokenSpeicher && Date.now() < tokenSpeicher.gueltigBis - TOKEN_PUFFER_MS) {
    return tokenSpeicher.token;
  }

  const basic = Buffer.from(`${zugangsdaten.clientId}:${zugangsdaten.clientSecret}`).toString(
    'base64',
  );

  const antwort = await fetch(TOKEN_ENDPUNKT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: SCOPE }),
    cache: 'no-store',
  });

  if (!antwort.ok) {
    // Den Antworttext mitnehmen: eBay begründet abgelehnte Zugangsdaten dort,
    // und ohne diese Begründung ist der Fehler kaum zu finden.
    throw new Error(`Token abgelehnt (HTTP ${antwort.status}): ${await antwort.text()}`);
  }

  const daten = (await antwort.json()) as { access_token?: string; expires_in?: number };
  if (!daten.access_token) throw new Error('Antwort enthielt kein Token.');

  tokenSpeicher = {
    token: daten.access_token,
    gueltigBis: Date.now() + (daten.expires_in ?? 7200) * 1000,
  };
  return tokenSpeicher.token;
}

const ergebnisSpeicher = new Map<string, { befund: GtinBefund; gueltigBis: number }>();

/** Sucht Angebote zu einer EAN und zählt aus, in welchen Kategorien sie stehen. */
export async function kategorienZuGtin(
  gtin: string,
  zugangsdaten: EbayZugang,
): Promise<GtinBefund> {
  const gespeichert = ergebnisSpeicher.get(gtin);
  if (gespeichert && Date.now() < gespeichert.gueltigBis) return gespeichert.befund;

  const token = await holeToken(zugangsdaten);
  const adresse = new URL(BROWSE_ENDPUNKT);
  adresse.searchParams.set('gtin', gtin);
  adresse.searchParams.set('limit', String(ANGEBOTE_JE_ABFRAGE));

  const antwort = await fetch(adresse, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': zugangsdaten.marketplaceId,
    },
    cache: 'no-store',
  });

  if (antwort.status === 401) {
    // Token war doch nicht mehr gültig: verwerfen, damit der nächste Versuch
    // ein frisches holt, statt dauerhaft am selben Token zu scheitern.
    tokenSpeicher = null;
    throw new Error('Zugriff abgelehnt, Token verworfen.');
  }
  if (!antwort.ok) {
    throw new Error(`Suche fehlgeschlagen (HTTP ${antwort.status}).`);
  }

  const befund = werteAntwortAus(gtin, await antwort.json());
  ergebnisSpeicher.set(gtin, { befund, gueltigBis: Date.now() + ERGEBNIS_HALTBARKEIT_MS });
  return befund;
}
