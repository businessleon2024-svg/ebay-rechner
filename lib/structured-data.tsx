import { OPERATOR, SITE } from './site';

/**
 * Strukturierte Daten nach schema.org.
 *
 * Suchmaschinen lesen daraus, was eine Seite ist, statt es aus dem Fließtext
 * raten zu müssen. Bei den häufigen Fragen führt das dazu, dass Frage und
 * Antwort direkt im Suchergebnis erscheinen können.
 *
 * Grundregel: Ausgezeichnet wird nur, was auf der Seite auch sichtbar steht.
 * Angaben zu ergänzen, die niemand zu sehen bekommt, verstößt gegen die
 * Richtlinien und kann die Seite aus den Ergebnissen werfen.
 */

/** Bettet ein JSON-LD-Objekt ein. Gehört in eine serverseitig gerenderte Seite. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Der Inhalt stammt ausschließlich aus eigenen Konstanten, nicht aus
      // Nutzereingaben. JSON.stringify entschärft Anführungszeichen; das
      // schließende script-Tag wird zusätzlich maskiert, damit es das
      // umgebende Tag nicht vorzeitig beenden kann.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    email: OPERATOR.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: OPERATOR.street,
      postalCode: OPERATOR.postalCode,
      addressLocality: OPERATOR.city,
      addressCountry: 'DE',
    },
    vatID: OPERATOR.vatId,
  };
}

export function calculatorSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${SITE.name} — Gebühren- und Gewinnrechner`,
    url: `${SITE.url}/rechner`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Alle Browser',
    inLanguage: 'de-DE',
    description:
      'Berechnet Verkaufsprovision, feste Gebühren, Umsatzsteuer, Auszahlung, Gewinn und Marge für Verkäufe bei eBay und Kaufland.',
    // Kostenlos und ohne Konto. Sobald ein bezahlter Tarif existiert, gehört
    // hier eine zweite Angebotsposition hin — sonst stimmt die Auszeichnung nicht.
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };
}

export function faqSchema(entries: ReadonlyArray<{ frage: string; antwort: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.frage,
      acceptedAnswer: { '@type': 'Answer', text: entry.antwort },
    })),
  };
}
