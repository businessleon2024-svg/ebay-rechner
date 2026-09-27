/**
 * Einwilligung für nicht notwendige Dienste.
 *
 * Wichtig: Solange `CONSENT_REQUIRING_SERVICES` leer ist, wird **kein** Banner
 * angezeigt. Die Seite setzt derzeit keine Cookies und bindet nichts von
 * Dritten ein; gespeichert wird allein im Browser des Nutzers, was er selbst
 * eingegeben hat. Dafür braucht es keine Einwilligung, und ein Banner, das
 * Zustimmung zu nichts einholt, wäre irreführend statt vorbildlich.
 *
 * Sobald Werbung oder Reichweitenmessung dazukommt, genügt es, den
 * betreffenden Dienst hier einzutragen — Banner und Einstellungen erscheinen
 * dann automatisch.
 */

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = 'gebuehrenkompass.consent.v1';

export type ConsentCategory = 'ads' | 'analytics';

export interface ConsentService {
  category: ConsentCategory;
  /** Anzeigename im Einwilligungsdialog. */
  name: string;
  /** Wofür der Dienst eingesetzt wird. */
  purpose: string;
}

/**
 * Dienste, die eine Einwilligung erfordern. Derzeit bewusst leer.
 */
export const CONSENT_REQUIRING_SERVICES: readonly ConsentService[] = [];

export const CATEGORY_LABEL: Record<ConsentCategory, string> = {
  ads: 'Werbung',
  analytics: 'Reichweitenmessung',
};

export const CATEGORY_DESCRIPTION: Record<ConsentCategory, string> = {
  ads: 'Erlaubt personalisierte Werbung. Ohne Einwilligung erscheint höchstens nicht personalisierte Werbung.',
  analytics:
    'Erlaubt uns zu messen, welche Seiten genutzt werden, um sie zu verbessern. Ohne Einwilligung erfassen wir nichts.',
};

export type ConsentDecision = Record<ConsentCategory, boolean>;

export interface StoredConsent {
  version: number;
  decidedAt: string;
  decision: ConsentDecision;
}

export const DENY_ALL: ConsentDecision = { ads: false, analytics: false };
export const ALLOW_ALL: ConsentDecision = { ads: true, analytics: true };

/** Kategorien, für die tatsächlich ein Dienst hinterlegt ist. */
export function activeCategories(): ConsentCategory[] {
  return [...new Set(CONSENT_REQUIRING_SERVICES.map((service) => service.category))];
}

/** Muss überhaupt eine Einwilligung eingeholt werden? */
export function consentRequired(): boolean {
  return CONSENT_REQUIRING_SERVICES.length > 0;
}

export function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredConsent;
    // Eine ältere Entscheidung gilt nicht für neu hinzugekommene Dienste.
    return stored.version === CONSENT_VERSION ? stored : null;
  } catch {
    window.localStorage.removeItem(CONSENT_KEY);
    return null;
  }
}

export function writeConsent(decision: ConsentDecision): void {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    decision,
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
  window.dispatchEvent(new Event('consentchange'));
}

export function revokeConsent(): void {
  window.localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event('consentchange'));
}
