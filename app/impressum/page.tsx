import type { Metadata } from 'next';
import { Pending } from '@/components/pending';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { OPERATOR } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung nach § 5 DDG.',
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <>
      <SiteHeader />

      <main className="legal">
        <h1 className="legal__title">Impressum</h1>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {OPERATOR.name}
          <br />
          {OPERATOR.street}
          <br />
          {OPERATOR.postalCode} {OPERATOR.city}
          <br />
          {OPERATOR.country}
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail:{' '}
          {OPERATOR.email ? (
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          ) : (
            <Pending>E-Mail-Adresse noch einzutragen</Pending>
          )}
        </p>
        <p>
          Eine Telefonnummer wird nicht vorgehalten. Anfragen werden per E-Mail entgegengenommen
          und in der Regel innerhalb eines Werktages beantwortet.
        </p>

        <h2>Umsatzsteuer-Identifikationsnummer</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          <br />
          {OPERATOR.vatId}
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          {OPERATOR.name}, Anschrift wie oben.
        </p>

        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Das
          gilt insbesondere für die dargestellten Gebührensätze und die damit erstellten
          Berechnungen: Sie dienen ausschließlich als unverbindliche Orientierung. Maßgeblich ist
          allein die tatsächliche Gebührenabrechnung des jeweiligen Marktplatzes.
        </p>

        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Für diese fremden Inhalte kann keine Gewähr übernommen werden.
          Verantwortlich ist stets der jeweilige Anbieter der verlinkten Seiten. Bei Bekanntwerden
          von Rechtsverletzungen entfernen wir derartige Links umgehend.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
          deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
        </p>

        <h2>Markenhinweis</h2>
        <p>
          eBay und Kaufland sind Marken der jeweiligen Rechteinhaber. Zwischen diesem Angebot und
          den genannten Unternehmen besteht keine geschäftliche Verbindung; die Marken werden allein
          zur Beschreibung der berechneten Gebühren genannt.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
