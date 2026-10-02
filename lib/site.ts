/**
 * Angaben zum Betreiber.
 *
 * Bewusst an einer Stelle: Impressum, Datenschutzerklärung und Metadaten
 * greifen alle hierauf zu, damit sich eine Änderung nie nur an einem Ort
 * auswirkt.
 */

/**
 * Adresse, unter der die Seite tatsächlich erreichbar ist.
 *
 * Hier stand fest `https://gebuehrenkompass.de` — eine Domain, die einem
 * Händler gehört und zum Verkauf steht. Dadurch wiesen kanonische Adresse,
 * Sitemap und robots.txt Suchmaschinen auf eine fremde Verkaufsseite statt
 * auf diese hier. Bestenfalls wurde die Seite deshalb gar nicht aufgenommen.
 *
 * Die Adresse kommt deshalb aus der Umgebung. Steht dort nichts, gilt die
 * Adresse, unter der die Seite heute wirklich läuft — nie eine erhoffte.
 * Sobald eine eigene Domain steht, genügt `NEXT_PUBLIC_SITE_URL`; alles
 * Übrige zieht automatisch nach.
 *
 * Bewusst ohne Vercels Systemvariablen: Die sind in Browser-Bausteinen nicht
 * eingesetzt, und ein Wert, der auf Server und Client auseinanderläuft, wäre
 * schlimmer als ein fest eingetragener.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ebay-rechner-sage.vercel.app')
  // Ein abschließender Schrägstrich ergäbe sonst Adressen mit doppeltem Trenner.
  .replace(/\/+$/, '');

export const SITE = {
  name: 'Gebührenkompass',
  domain: new URL(SITE_URL).host,
  url: SITE_URL,
} as const;

export const OPERATOR = {
  name: 'Leon Raimund',
  street: 'Schmalenbeckerstraße 10',
  postalCode: '28879',
  city: 'Grasberg',
  country: 'Deutschland',
  vatId: 'DE451771926',

  /**
   * Vorläufig eine Gmail-Adresse. Rechtlich genügt das — § 5 DDG verlangt eine
   * erreichbare Adresse, keine Domain-Adresse. Sobald ein Postfach unter der
   * eigenen Domain steht, hier tauschen; Impressum und Datenschutzerklärung
   * ziehen automatisch nach.
   */
  email: 'businessleon2024@gmail.com' as string | null,
} as const;

/**
 * Wo die Seite betrieben wird. Bestimmt, was die Datenschutzerklärung zum
 * Hosting und zu einem etwaigen Drittlandtransfer sagen muss.
 */
export const HOSTING = {
  provider: 'Vercel Inc.',
  /**
   * Genaue Anschrift noch aus dem Auftragsverarbeitungsvertrag übernehmen,
   * sobald dieser bei Vercel abgeschlossen ist. Bis dahin genügt Firma und
   * Land — beides ist zutreffend.
   */
  country: 'USA',
  /** Auslieferung über die Region Frankfurt am Main. */
  region: 'Frankfurt am Main',
  outsideEu: true,
} as const;

/**
 * Die Domain ist bei netcup registriert. Der Registrar verarbeitet keine
 * Daten der Websitebesucher und gehört deshalb nicht in die
 * Datenschutzerklärung.
 */
export const REGISTRAR = 'netcup GmbH' as const;

export const isLaunchReady = (): boolean =>
  OPERATOR.email !== null && HOSTING.provider !== null;
