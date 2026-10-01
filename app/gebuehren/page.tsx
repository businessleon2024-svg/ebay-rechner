import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  describePerItemFee,
  describeReducedRate,
  describeStandardRate,
} from '@/lib/fees/describe';
import { EBAY, KAUFLAND } from '@/lib/fees/marketplaces';
import {
  BELOW_STANDARD_SURCHARGE_PERCENT,
  FIXED_FEE_ABOVE_THRESHOLD,
  FIXED_FEE_THRESHOLD_EUR,
  FIXED_FEE_UP_TO_THRESHOLD,
} from '@/lib/fees/ebay';
import { formatCurrency, formatMonth } from '@/lib/format';
import { JsonLd, faqSchema } from '@/lib/structured-data';
import type { FeeCategory, Marketplace } from '@/lib/fees/types';

export const metadata: Metadata = {
  title: 'eBay- und Kaufland-Gebühren 2026 im Überblick',
  description:
    'Alle Verkaufsprovisionen für eBay und Kaufland nach Kategorie, inklusive reduziertem Satz für gebrauchte Artikel, Staffelungen und fester Verkaufsgebühr. Stand Juli 2026.',
  alternates: { canonical: '/gebuehren' },
};

/** Kategorien nach ihrer Gruppe bündeln, Reihenfolge wie in der Konfiguration. */
function grouped(marketplace: Marketplace): Array<[string, FeeCategory[]]> {
  const groups = new Map<string, FeeCategory[]>();
  for (const category of marketplace.categories) {
    const key = category.group ?? 'Kategorien';
    const existing = groups.get(key);
    if (existing) existing.push(category);
    else groups.set(key, [category]);
  }
  return [...groups.entries()];
}

const FAQ = [
  {
    frage: 'Worauf berechnet eBay die Verkaufsprovision?',
    antwort:
      'Nicht auf den Artikelpreis allein, sondern auf den gesamten Transaktionsbetrag: Artikelpreis, Bearbeitungsgebühren, die vom Käufer gewählten Versandkosten und die Umsatzsteuer. Wer nur mit dem Artikelpreis rechnet, setzt die Gebühr zu niedrig an. Bei Kaufland gilt dieselbe Bemessungsgrundlage.',
  },
  {
    frage: 'Wie hoch ist die feste Verkaufsgebühr?',
    antwort: `Bis einschließlich ${formatCurrency(FIXED_FEE_THRESHOLD_EUR)} Bestellwert ${formatCurrency(FIXED_FEE_UP_TO_THRESHOLD)}, darüber ${formatCurrency(FIXED_FEE_ABOVE_THRESHOLD)}. Sie fällt pro Bestellung an, nicht pro Artikel: Drei Artikel in einer Bestellung kosten nur einmal die feste Gebühr. Kaufland erhebt keine Gebühr pro Bestellung, dafür eine monatliche Grundgebühr.`,
  },
  {
    frage: 'Wann gilt der reduzierte Satz von 5 %?',
    antwort:
      'Wenn zwei Bedingungen zusammenkommen. Erstens muss der Artikelzustand passen: „Neu: Sonstige“, alle Refurbished-Abstufungen, „Vom Verkäufer generalüberholt“ sowie alle Gebraucht-Abstufungen. Zweitens muss die Kategorie daran teilnehmen — das tun längst nicht alle. In der Tabelle oben steht bei jeder Kategorie, ob ein reduzierter Satz gilt. Kaufland kennt keinen Zustandsrabatt.',
  },
  {
    frage: 'Was kostet ein unterdurchschnittlicher Servicestatus?',
    antwort: `Zusätzlich zur regulären Provision ${BELOW_STANDARD_SURCHARGE_PERCENT} % des Transaktionsbetrags. Auf der Abrechnung steht die Position als „Erhöhte Verkaufsprovision bei Servicestatus Unterdurchschnittlich“. Sie wiegt schwerer, als die Zahl vermuten lässt: Bei einer Kamera für 738,99 € standen 39,67 € reguläre Provision und 39,60 € Zuschlag nebeneinander — die Gebühr hat sich damit fast verdoppelt. Anders als die Provision folgt der Zuschlag keiner Staffelung; bei einem Lautsprecher für 638,49 € lag die Provision wegen der Staffel bei 5,74 %, der Zuschlag aber bei vollen 6,00 %. Beides ist an echten Abrechnungen abgelesen. Im Rechner lässt sich der Zuschlag unter „Weitere Kosten & Zielgewinn“ zuschalten.`,
  },
  {
    frage: 'Warum weichen meine tatsächlichen Gebühren ab?',
    antwort:
      'Dafür gibt es mehrere übliche Gründe. Die Tabelle führt Hauptkategorien; einzelne Unterkategorien können abweichende Sätze haben, die die Marktplätze nicht vollständig öffentlich ausweisen — ein Streaming-Stick etwa erscheint unter „TV, Video & Audio“ mit 7 %, kostet aber 12 %. Dazu kommen ein Shop-Abo, laufende Aktionen, Werbekosten, internationale Verkäufe und der Servicestatus des Kontos. Maßgeblich ist immer die tatsächliche Abrechnung.',
  },
  {
    frage: 'Sind die genannten Sätze netto oder brutto?',
    antwort:
      'Die Provisionssätze sind Nettosätze. Auf die Gebühren kommt Umsatzsteuer, die auf der Abrechnung erscheint. Wer regelbesteuert ist, zieht sie als Vorsteuer ab — wirtschaftlich zählt dann der Nettobetrag. Für Kleinunternehmer ist die Bruttogebühr der echte Kostenfaktor.',
  },
  {
    frage: 'Was kostet Kaufland im Monat?',
    antwort: `Das Paket Basic kostet ${formatCurrency(KAUFLAND.plans![0].priceNet)} netto im Monat, Plus ${formatCurrency(KAUFLAND.plans![1].priceNet)} netto. Ein Paket gilt für alle Kaufland-Marktplätze, ein zusätzlicher Marktplatz kostet keine weitere Grundgebühr. Im Rechner lässt sich diese Gebühr anteilig auf den einzelnen Verkauf umlegen — ohne das wirkt jeder Verkauf profitabler, als das Geschäft in Summe ist.`,
  },
];

function FeeTable({ marketplace }: { marketplace: Marketplace }) {
  const zeigtZustand = marketplace.hasConditionDiscount;

  return (
    <div className="table-wrap">
      <table className="fee-table">
        <thead>
          <tr>
            <th scope="col">Kategorie</th>
            <th scope="col">Provision</th>
            {zeigtZustand && <th scope="col">Gebraucht</th>}
          </tr>
        </thead>
        {grouped(marketplace).map(([group, categories]) => (
          <tbody key={group}>
            <tr className="fee-table__group">
              <th scope="colgroup" colSpan={zeigtZustand ? 3 : 2}>
                {group}
              </th>
            </tr>
            {categories.map((category) => {
              const perItem = describePerItemFee(category);
              return (
                <tr key={category.id}>
                  <th scope="row">
                    {category.name}
                    {perItem && <span className="fee-table__note">{perItem}</span>}
                  </th>
                  {/*
                    data-label trägt die Spaltenüberschrift mit. Auf schmalen
                    Bildschirmen wird die Tabelle zu gestapelten Zeilen, die
                    Kopfzeile ist dann nicht mehr sichtbar — ohne Beschriftung
                    stünden dort bloß Zahlen ohne Bedeutung.
                  */}
                  <td data-label="Provision">{describeStandardRate(category)}</td>
                  {zeigtZustand && (
                    <td
                      data-label="Gebraucht"
                      className={category.reducedPercent === null ? 'is-muted' : undefined}
                    >
                      {describeReducedRate(category)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default function GebuehrenPage() {
  return (
    <>
      {/* Deckt sich eins zu eins mit dem Abschnitt „Häufige Fragen“ weiter unten. */}
      <JsonLd data={faqSchema(FAQ)} />
      <SiteHeader />

      <main>
        <section className="hero hero--compact">
          <h1 className="hero__title">Gebühren von eBay und Kaufland im Überblick</h1>
          <p className="hero__subtitle">
            Alle Verkaufsprovisionen nach Kategorie — dieselben Werte, mit denen auch der Rechner
            arbeitet. Stand eBay {formatMonth(EBAY.ratesEffectiveFrom)}, Kaufland{' '}
            {formatMonth(KAUFLAND.ratesEffectiveFrom)}.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary btn--lg" href="/rechner">
              Zum Rechner
            </Link>
          </div>
        </section>

        <section className="section" id="ebay" aria-labelledby="ebay-heading">
          <h2 className="section__heading" id="ebay-heading">
            eBay
          </h2>
          <p className="section__lead">
            Die Gebühr besteht aus einer prozentualen Verkaufsprovision und einer festen Gebühr pro
            Bestellung von {formatCurrency(FIXED_FEE_UP_TO_THRESHOLD)} bis einschließlich{' '}
            {formatCurrency(FIXED_FEE_THRESHOLD_EUR)} Bestellwert, darüber{' '}
            {formatCurrency(FIXED_FEE_ABOVE_THRESHOLD)}. Berechnet wird auf den gesamten
            Transaktionsbetrag einschließlich Versand und Umsatzsteuer. In den dafür ausgewiesenen
            Kategorien kostet gebrauchte und generalüberholte Ware nur 5 %.
          </p>
          <FeeTable marketplace={EBAY} />
          <p className="section__note">
            Bei Uhren &amp; Schmuck verschiebt ein Shop-Abo die Staffelgrenze auf{' '}
            {describeStandardRate(
              EBAY.categories.find((category) => category.id === 'uhren-schmuck')!,
              true,
            )}
            . Zu dieser Schwelle widersprechen sich die verfügbaren Quellen — bitte an der eigenen
            Abrechnung prüfen.
          </p>
        </section>

        <section className="section" id="kaufland" aria-labelledby="kaufland-heading">
          <h2 className="section__heading" id="kaufland-heading">
            Kaufland
          </h2>
          <p className="section__lead">
            Kaufland erhebt keine Gebühr pro Bestellung, dafür eine monatliche Grundgebühr von{' '}
            {formatCurrency(KAUFLAND.plans![0].priceNet)} (Basic) beziehungsweise{' '}
            {formatCurrency(KAUFLAND.plans![1].priceNet)} (Plus), jeweils netto. Der Artikelzustand
            wirkt sich nicht auf die Provision aus. Die Zahlungsabwicklung ist in der Provision
            enthalten, das Einstellen von Angeboten ist kostenlos.
          </p>
          <FeeTable marketplace={KAUFLAND} />
        </section>

        <section className="section" id="faq" aria-labelledby="faq-heading">
          <h2 className="section__heading" id="faq-heading">
            Häufige Fragen
          </h2>
          <div className="faq">
            {FAQ.map((eintrag) => (
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
