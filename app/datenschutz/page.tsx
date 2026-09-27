import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsentSettingsLink } from '@/components/consent-settings-link';
import { Pending } from '@/components/pending';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CONSENT_REQUIRING_SERVICES } from '@/lib/consent';
import { HOSTING, OPERATOR, REGISTRAR } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 DSGVO.',
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <>
      <SiteHeader />

      <main className="legal">
        <h1 className="legal__title">Datenschutzerklärung</h1>

        <h2>Verantwortlicher</h2>
        <p>
          {OPERATOR.name}
          <br />
          {OPERATOR.street}
          <br />
          {OPERATOR.postalCode} {OPERATOR.city}
          <br />
          {OPERATOR.country}
          <br />
          E-Mail:{' '}
          {OPERATOR.email ? (
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          ) : (
            <Pending>E-Mail-Adresse noch einzutragen</Pending>
          )}
        </p>
        <p>
          Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen dafür
          nicht vorliegen.
        </p>

        <h2>Grundsatz</h2>
        <p>
          Der Gebührenrechner läuft vollständig in deinem Browser. Die Beträge, die du eingibst,
          werden <strong>nicht an uns übertragen</strong> und nicht auf einem Server gespeichert.
          Wir erfahren weder, welche Artikel du kalkulierst, noch welche Preise du ansetzt.
        </p>

        <h2>Speicherung in deinem Browser</h2>
        <p>
          Damit du deine Eingaben beim nächsten Besuch wiederfindest, legt die Seite folgende
          Angaben im lokalen Speicher deines Browsers ab. Das sind keine Cookies, und die Daten
          verlassen dein Gerät nicht:
        </p>
        <ul>
          <li>deine zuletzt eingegebenen Werte im Rechner,</li>
          <li>von dir gespeicherte Standardeinstellungen,</li>
          <li>ob du die helle oder dunkle Ansicht gewählt hast.</li>
        </ul>
        <p>
          Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDG, da die Speicherung für den von dir
          gewünschten Dienst erforderlich ist. Du kannst die Werte jederzeit über „Preise leeren“
          beziehungsweise „Standard löschen“ im Rechner entfernen oder den lokalen Speicher in den
          Einstellungen deines Browsers leeren.
        </p>

        <h2>Bereitstellung der Website und Server-Logfiles</h2>
        <p>
          Die Website wird bei {HOSTING.provider} ({HOSTING.country}) gehostet, die Auslieferung
          erfolgt über die Region {HOSTING.region}. Beim Aufruf verarbeitet der Anbieter technisch
          notwendige Verbindungsdaten wie IP-Adresse, Datum und Uhrzeit des Abrufs, die aufgerufene
          Seite, den verwendeten Browser und das Betriebssystem. Diese Daten sind zum Ausliefern
          der Seite und zur Abwehr von Angriffen erforderlich. Rechtsgrundlage ist Art. 6 Abs. 1
          lit. f DSGVO; unser berechtigtes Interesse liegt im sicheren und stabilen Betrieb.
        </p>
        <p>
          Da es sich um ein Unternehmen mit Sitz in den {HOSTING.country} handelt, können dabei
          Daten in ein Land außerhalb der Europäischen Union übertragen werden. Mit dem Anbieter
          besteht ein Vertrag zur Auftragsverarbeitung, der Standardvertragsklauseln nach Art. 46
          Abs. 2 lit. c DSGVO einschließt.
        </p>
        <p>
          Die Domain ist bei der {REGISTRAR} registriert. Ein Registrar verwaltet ausschließlich
          den Domainnamen und verarbeitet keine Daten der Besucher dieser Website.
        </p>

        <h2>Kontaktaufnahme</h2>
        <p>
          Wenn du uns per E-Mail schreibst, verarbeiten wir deine Angaben ausschließlich zur
          Bearbeitung deiner Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, bei
          vertragsbezogenen Anfragen Art. 6 Abs. 1 lit. b DSGVO. Wir löschen die Nachrichten,
          sobald die Anfrage erledigt ist und keine Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2>Werbung und Reichweitenmessung</h2>
        {CONSENT_REQUIRING_SERVICES.length === 0 ? (
          <p>
            Diese Website setzt derzeit <strong>keine Werbe- oder Analysedienste</strong> ein. Es
            findet keine Reichweitenmessung statt, es werden keine Profile gebildet und keine
            Inhalte Dritter nachgeladen. Sollte sich das ändern, holen wir vorher deine
            Einwilligung ein und aktualisieren diese Erklärung.
          </p>
        ) : (
          <>
            <p>
              Wir setzen die folgenden Dienste nur ein, wenn du eingewilligt hast. Rechtsgrundlage
              ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDG. Du kannst deine
              Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>
            <ul>
              {CONSENT_REQUIRING_SERVICES.map((service) => (
                <li key={service.name}>
                  <strong>{service.name}</strong> – {service.purpose}
                </li>
              ))}
            </ul>
            <p>
              <ConsentSettingsLink /> ändern.
            </p>
          </>
        )}

        <h2>Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft über die zu deiner Person gespeicherten Daten (Art. 15
          DSGVO), auf Berichtigung (Art. 16), auf Löschung (Art. 17), auf Einschränkung der
          Verarbeitung (Art. 18), auf Datenübertragbarkeit (Art. 20) sowie ein Widerspruchsrecht
          gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte
          Einwilligung kannst du jederzeit widerrufen.
        </p>
        <p>
          Außerdem steht dir ein Beschwerderecht bei einer Aufsichtsbehörde zu. Zuständig ist – der
          Sitz in Grasberg liegt trotz der Bremer Postleitzahl in Niedersachsen – die
          Landesbeauftragte für den Datenschutz Niedersachsen, Prinzenstraße 5, 30159 Hannover.
        </p>

        <h2>Änderungen</h2>
        <p>
          Wir passen diese Erklärung an, wenn sich das Angebot ändert — etwa wenn Nutzerkonten,
          Zahlungen oder Werbung hinzukommen. Es gilt jeweils die hier abrufbare Fassung.
        </p>

        <p className="legal__meta">
          Siehe auch das <Link href="/impressum">Impressum</Link>.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
