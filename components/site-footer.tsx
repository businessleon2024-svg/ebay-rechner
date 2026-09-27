import Link from 'next/link';
import { ConsentSettingsLink } from './consent-settings-link';

export function SiteFooter() {
  return (
    <footer className="footer">
      <h2 className="footer__heading">Hinweis zur Berechnung</h2>
      <p>
        Die Berechnung dient ausschließlich als <strong>unverbindliche Orientierung</strong>. Die
        tatsächlichen Gebühren können abhängig von Verkäuferkonto, Kategorie, Artikelzustand,
        Shop-Abo, Aktionen, Zahlungsabwicklung und weiteren Faktoren abweichen. Maßgeblich ist
        ausschließlich die tatsächliche Gebührenabrechnung des jeweiligen Marktplatzes.
      </p>
      <p>
        Hinterlegt sind die Hauptkategorien von eBay und Kaufland.{' '}
        <strong>Unterkategorien können abweichende Provisionssätze haben</strong> — die Marktplätze
        weisen ihre Sätze nicht für jede einzelne Unterkategorie öffentlich aus, sodass sich diese
        hier nicht vollständig abbilden lassen.
      </p>
      <p>Der Rechner stellt keine Steuer-, Rechts- oder Finanzberatung dar.</p>

      <nav className="footer__links" aria-label="Rechtliches">
        <Link href="/gebuehren">Gebührenübersicht</Link>
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <ConsentSettingsLink label="Einwilligung ändern" />
      </nav>

      <p className="footer__meta">
        Berechnet wahlweise für Regelbesteuerung, Differenzbesteuerung nach § 25a UStG oder
        Kleinunternehmer nach § 19 UStG. Provision auf den Gesamtbetrag einschließlich des vom
        Käufer gezahlten Versands, zuzüglich etwaiger Fixgebühren. Gebührenstand eBay Juli 2026,
        Kaufland Juni 2026.
      </p>
    </footer>
  );
}
