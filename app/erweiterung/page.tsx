import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Als Chrome-Erweiterung einrichten',
  description:
    'Den Gebührenkompass neben der Produktseite laufen lassen: Seitenpanel in Chrome, Schritt für Schritt eingerichtet.',
  alternates: { canonical: '/erweiterung' },
};

const SCHRITTE = [
  {
    titel: 'Herunterladen und entpacken',
    text: 'Lade die Datei über die Schaltfläche oben. Dann im Downloads-Ordner doppelklicken — es entsteht ein Ordner namens „gebuehrenkompass-extension". Den brauchst du gleich, also merk dir, wo er liegt.',
  },
  {
    titel: 'Erweiterungsseite öffnen',
    text: 'Tippe in die Adresszeile von Chrome: chrome://extensions — und Enter. Diese Seite lässt sich nicht verlinken, Chrome erlaubt das aus Sicherheitsgründen nicht.',
  },
  {
    titel: 'Entwicklermodus einschalten',
    text: 'Oben rechts auf der Seite liegt ein Schalter „Entwicklermodus“. Einschalten. Danach erscheinen oben links drei neue Schaltflächen.',
  },
  {
    titel: 'Ordner laden',
    text: 'Auf „Entpackte Erweiterung laden“ klicken und den entpackten Ordner auswählen — den, in dem die Datei manifest.json liegt. Nicht die ZIP-Datei selbst, sondern den entpackten Ordner.',
  },
  {
    titel: 'Anheften',
    text: 'Rechts oben in Chrome auf das Puzzleteil-Symbol, dann beim Gebührenkompass auf die Stecknadel. Jetzt liegt das Symbol dauerhaft in der Leiste.',
  },
  {
    titel: 'Benutzen',
    text: 'Geh auf eine Produktseite und klick auf das Symbol. Der Rechner öffnet sich rechts neben der Seite und bleibt offen, während du weiterklickst.',
  },
];

const FRAGEN = [
  {
    frage: 'Warum nicht einfach aus dem Chrome Web Store?',
    antwort:
      'Weil die Erweiterung dort noch nicht veröffentlicht ist. Das ist geplant; bis dahin ist der Weg über den Entwicklermodus der einzige. Er funktioniert vollständig — nur die Einrichtung ist umständlicher.',
  },
  {
    frage: 'Chrome warnt vor Erweiterungen im Entwicklermodus. Ist das schlimm?',
    antwort:
      'Die Warnung ist berechtigt und du solltest sie ernst nehmen — bei jeder Erweiterung aus unbekannter Quelle. Deshalb liegt der gesamte Quelltext offen: Du kannst vor dem Laden hineinsehen, was die Erweiterung tut. Sie fordert vier Berechtigungen an, und keine davon erlaubt es, im Hintergrund mitzulesen.',
  },
  {
    frage: 'Welche Daten werden übertragen?',
    antwort:
      'Keine. Es gibt kein Konto, keine Anmeldung und keinen Speicher. Die Erweiterung liest auf Produktseiten die Artikelnummer (EAN) und gibt sie an den Rechner weiter — mehr nicht. Deine Preise bleiben in deinem Browser.',
  },
  {
    frage: 'Funktioniert das auch in Edge, Firefox oder Safari?',
    antwort:
      'Edge ja, der Weg ist fast identisch. Firefox und Safari benutzen ein anderes Erweiterungsformat und brauchen eine eigene Fassung — die gibt es noch nicht. Auf dem iPhone kannst du den Rechner stattdessen über „Zum Home-Bildschirm“ als App installieren.',
  },
  {
    frage: 'Muss ich sie aktualisieren?',
    antwort:
      'Fast nie. Die Erweiterung zeigt die Website in einem Rahmen — Gestaltung und Gebührensätze kommen also immer frisch aus dem Netz. Nur wenn sich an der Erweiterung selbst etwas ändert, lädst du den Ordner neu.',
  },
];

export default function ErweiterungPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Den Rechner neben die Produktseite legen</h1>
          <p className="hero__subtitle">
            Als Chrome-Seitenpanel läuft der Gebührenkompass rechts neben Amazon, eBay oder jedem
            anderen Shop — und bleibt offen, während du weiterklickst. Die Artikelnummer der
            offenen Seite übernimmt er auf Wunsch.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="/gebuehrenkompass-extension.zip" download>
              Erweiterung herunterladen
            </a>
            <Link className="btn btn--ghost" href="/rechner">
              Erst im Browser ausprobieren
            </Link>
          </div>
        </section>

        <section className="section" aria-labelledby="schritte">
          <h2 className="section__heading" id="schritte">
            Einrichten in sechs Schritten
          </h2>
          <p className="section__lead">
            Dauert etwa zwei Minuten. Du brauchst Chrome oder Edge am Rechner — auf dem Handy gibt
            es keine Erweiterungen.
          </p>
          <ol className="steps">
            {SCHRITTE.map((schritt, i) => (
              <li className="step" key={schritt.titel}>
                <span className="step__index">{i + 1}</span>
                <h3 className="step__title">{schritt.titel}</h3>
                <p className="step__body">{schritt.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="erweiterung-rechte">
          <h2 className="section__heading" id="erweiterung-rechte">
            Welche Rechte sie anfordert
          </h2>
          <p className="section__lead">
            Chrome zeigt dir das beim Laden an. Hier steht, wofür jedes einzelne gebraucht wird.
          </p>
          <div className="table-wrap">
            <table className="fee-table">
              <thead>
                <tr>
                  <th scope="col">Recht</th>
                  <th scope="col">Wofür</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">sidePanel</th>
                  <td data-label="Wofür">Das Panel überhaupt öffnen dürfen.</td>
                </tr>
                <tr>
                  <th scope="row">tabs</th>
                  <td data-label="Wofür">
                    Die Adresse des Tabs sehen, den du gerade offen hast — damit das Panel merkt,
                    wenn du auf eine andere Produktseite wechselst.
                  </td>
                </tr>
                <tr>
                  <th scope="row">activeTab</th>
                  <td data-label="Wofür">Die offene Seite lesen, nachdem du aufs Symbol geklickt hast.</td>
                </tr>
                <tr>
                  <th scope="row">scripting</th>
                  <td data-label="Wofür">
                    Das Stück Code einspielen, das die Artikelnummer aus der Seite liest.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section__note">
            Bewusst <strong>nicht</strong> angefordert: der Zugriff auf alle Websites. Deshalb
            zeigt Chrome beim Einrichten auch keine Warnung über „Daten auf allen Websites lesen“
            — die Erweiterung kann schlicht nicht im Hintergrund mitlesen.
          </p>
        </section>

        <section className="section" aria-labelledby="erweiterung-faq">
          <h2 className="section__heading" id="erweiterung-faq">
            Häufige Fragen
          </h2>
          <div className="faq">
            {FRAGEN.map((eintrag) => (
              <div className="faq__item" key={eintrag.frage}>
                <h3 className="faq__question">{eintrag.frage}</h3>
                <p className="faq__answer">{eintrag.antwort}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
