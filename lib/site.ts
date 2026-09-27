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
   * NOCH EINZUTRAGEN: E-Mail-Adresse der Domain.
   *
   * Ohne sie darf die Seite nicht online gehen — eine erreichbare
   * E-Mail-Adresse ist nach § 5 DDG zwingend. Sobald das Postfach steht,
   * hier eintragen; Impressum und Datenschutzerklärung ziehen automatisch nach.
   */
  email: null as string | null,
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
