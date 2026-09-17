import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICE_EUR } from '@/lib/plan';
import { formatCurrency } from '@/lib/format';

const STEPS = [
  {
    title: 'Produkt einordnen',
    body: 'Kategorie und Artikelzustand wählen. Der Zustand entscheidet, ob 5 % oder bis zu 14 % Provision anfallen.',
  },
  {
    title: 'Preise eintragen',
    body: 'Verkaufspreis, Einkaufspreis und Versand. Die Berechnung läuft bei jeder Eingabe mit.',
  },
  {
    title: 'Echten Gewinn sehen',
    body: 'Auszahlung, Umsatzsteuer, Gewinn und Marge — und der Einkaufspreis, den du höchstens zahlen darfst.',
  },
];

const EXTENSION_FLOW = [
  'Händlerseite',
  'Produkt erkennen',
  'Kategorie vorschlagen',
  'Gebühr berechnen',
  'Gewinn sehen',
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <h1 className="hero__title">Finde heraus, ob sich ein Produkt wirklich lohnt.</h1>
          <p className="hero__subtitle">
            Berechne eBay-Gebühren, Auszahlung, Gewinn und Marge in wenigen Sekunden — mit
            Umsatzsteuer und dem reduzierten Satz für gebrauchte Ware.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary btn--lg" href="/rechner">
              Kostenlos berechnen
            </Link>
            <Link className="btn btn--ghost btn--lg" href="#extension">
              Chrome Extension entdecken
            </Link>
          </div>
        </section>

        <section className="section" aria-labelledby="steps-heading">
          <h2 className="section__heading" id="steps-heading">
            So funktioniert es
          </h2>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li className="step" key={step.title}>
                <span className="step__index">{index + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="extension" aria-labelledby="extension-heading">
          <h2 className="section__heading" id="extension-heading">
            Chrome Extension
            <span className="tag">In Entwicklung</span>
          </h2>
          <p className="section__lead">
            Statt Daten abzutippen, analysierst du ein Produkt direkt dort, wo du es findest. Die
            Extension liest die Produktdaten der Händlerseite aus, schlägt die passende
            eBay-Kategorie vor und rechnet mit derselben Logik wie der Rechner hier.
          </p>
          <ol className="flow">
            {EXTENSION_FLOW.map((step) => (
              <li className="flow__step" key={step}>
                {step}
              </li>
            ))}
          </ol>
          <p className="section__note">
            Die Extension ist noch nicht verfügbar. Sie erscheint als Teil von Pro, sobald geklärt
            ist, welche Produktdaten sich über offizielle Schnittstellen sauber und dauerhaft
            abrufen lassen.
          </p>
        </section>

        <section className="section" id="tarife" aria-labelledby="plans-heading">
          <h2 className="section__heading" id="plans-heading">
            Tarife
          </h2>
          <div className="plans">
            <article className="plan-card">
              <h3 className="plan-card__name">Free</h3>
              <p className="plan-card__price">
                0 €<span className="plan-card__period"> / Monat</span>
              </p>
              <p className="plan-card__lead">Der vollständige Rechner, dauerhaft kostenlos.</p>
              <ul className="plan-card__list">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="plan-card__note">Enthält eine dezente Werbefläche.</p>
              <Link className="btn btn--ghost" href="/rechner">
                Rechner öffnen
              </Link>
            </article>

            <article className="plan-card plan-card--highlight">
              <h3 className="plan-card__name">Pro</h3>
              <p className="plan-card__price">
                {formatCurrency(PRO_PRICE_EUR)}
                <span className="plan-card__period"> / Monat</span>
              </p>
              <p className="plan-card__lead">Alles aus Free, plus Analyse direkt im Browser.</p>
              <ul className="plan-card__list">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="plan-card__note">Noch nicht buchbar — die Pro-Funktionen entstehen gerade.</p>
              <button className="btn btn--primary" type="button" disabled>
                Bald verfügbar
              </button>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
