import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SupportForm } from '@/components/support-form';
import { OPERATOR } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hilfe & Kontakt',
  description:
    'Fragen zur Gebührenberechnung, Meldung abweichender Sätze, Fehlerberichte und Vorschläge zum Gebührenkompass.',
};

const SELBSTHILFE = [
  {
    titel: 'Meine Gebühr weicht von der Abrechnung ab',
    text: 'Das ist der häufigste Fall und meist kein Rechenfehler: Unterkategorien werden oft anders abgerechnet als die Hauptkategorie, unter der sie auf der Abrechnung erscheinen. Im Rechner gibt es unter dem Ergebnis ein Formular, mit dem du die tatsächlichen Werte meldest — damit wird der Rechner für alle genauer.',
    ziel: '/rechner',
    linkText: 'Zum Rechner',
  },
  {
    titel: 'Welcher Satz gilt für meine Kategorie?',
    text: 'Die vollständige Übersicht führt alle hinterlegten Sätze für eBay und Kaufland auf, samt reduziertem Satz für gebrauchte Ware und Staffelungen. Darunter stehen die häufigsten Fragen zur Gebührenstruktur.',
    ziel: '/gebuehren',
    linkText: 'Zur Gebührenübersicht',
  },
  {
    titel: 'Wie werden Umsatzsteuer und Vorsteuer behandelt?',
    text: 'Der Rechner kennt Regelbesteuerung, Differenzbesteuerung nach § 25a und die Kleinunternehmerregelung. Die Auswahl steht ganz oben im Formular; die Vorsteuer-Schalter stellen sich passend dazu um.',
    ziel: '/gebuehren#faq',
    linkText: 'Häufige Fragen',
  },
];

export default function SupportPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Hilfe &amp; Kontakt</h1>
          <p className="hero__subtitle">
            Der Gebührenkompass lebt von Rückmeldungen. Wenn etwas nicht stimmt, nicht
            funktioniert oder fehlt, schreib uns — jede Meldung macht den Rechner genauer.
          </p>
        </section>

        <section className="section" aria-labelledby="selbsthilfe-heading">
          <h2 className="section__heading" id="selbsthilfe-heading">
            Vielleicht steht die Antwort schon hier
          </h2>
          <div className="steps">
            {SELBSTHILFE.map((eintrag) => (
              <div className="step" key={eintrag.titel}>
                <h3 className="step__title">{eintrag.titel}</h3>
                <p className="step__body">{eintrag.text}</p>
                <Link className="support__link" href={eintrag.ziel}>
                  {eintrag.linkText}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="kontakt" aria-labelledby="kontakt-heading">
          <h2 className="section__heading" id="kontakt-heading">
            Schreib uns
          </h2>
          <p className="section__lead">
            Anfragen werden per E-Mail beantwortet, in der Regel innerhalb eines Werktages. Eine
            Telefonnummer wird nicht vorgehalten.
          </p>

          <div className="support">
            <SupportForm />

            <aside className="support__aside">
              <h3 className="support__aside-heading">Direkt per E-Mail</h3>
              <p>
                Lieber ohne Formular?{' '}
                <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
              </p>

              <h3 className="support__aside-heading">Was hilft uns weiter</h3>
              <ul>
                <li>bei Gebührenabweichungen: Kategorie, Artikel und die Beträge der Abrechnung</li>
                <li>bei Fehlern: welches Gerät, welcher Browser, was genau passiert ist</li>
                <li>bei Vorschlägen: woran du gerade beim Rechnen hängen geblieben bist</li>
              </ul>

              <h3 className="support__aside-heading">Keine Rechtsberatung</h3>
              <p>
                Wir helfen bei der Bedienung des Rechners und bei Gebührensätzen. Fragen zur
                eigenen Steuer- oder Rechtslage gehören zum Steuerberater — dazu können wir keine
                Auskunft geben.
              </p>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
