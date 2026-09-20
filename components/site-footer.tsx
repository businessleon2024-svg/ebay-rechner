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
      <p className="footer__meta">
        Berechnet für gewerbliche Verkäufer in der Regelbesteuerung: Provision auf den Gesamtbetrag
        einschließlich des vom Käufer gezahlten Versands, zuzüglich etwaiger Fixgebühren, abzüglich
        19 % Umsatzsteuer auf den Verkauf. Gebührenstand eBay Juli 2026, Kaufland Juni 2026.
      </p>
    </footer>
  );
}
