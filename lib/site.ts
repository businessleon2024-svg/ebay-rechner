/**
 * Angaben zum Betreiber.
 *
 * Bewusst an einer Stelle: Impressum, Datenschutzerklärung und Metadaten
 * greifen alle hierauf zu, damit sich eine Änderung nie nur an einem Ort
 * auswirkt.
 */

export const SITE = {
  name: 'Gebührenkompass',
  domain: 'gebuehrenkompass.de',
  url: 'https://gebuehrenkompass.de',
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
   * erreichbare Adresse, keine Domain-Adresse. Sobald ein Postfach unter
   * gebuehrenkompass.de steht, hier tauschen; Impressum und
   * Datenschutzerklärung ziehen automatisch nach.
   */
  email: 'businessleon2024@gmail.com' as string | null,
} as const;

/**
 * Wo die Seite betrieben wird. Bestimmt, was die Datenschutzerklärung zum
 * Hosting und zu einem etwaigen Drittlandtransfer sagen muss.
 */
export const HOSTING = {
  /** NOCH ZU ENTSCHEIDEN: Anbieter eintragen, sobald das Hosting feststeht. */
  provider: null as string | null,
  /** Liegt der Serverstandort außerhalb der EU? */
  outsideEu: false,
} as const;

export const isLaunchReady = (): boolean =>
  OPERATOR.email !== null && HOSTING.provider !== null;
