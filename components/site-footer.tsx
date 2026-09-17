export function SiteFooter() {
  return (
    <footer className="footer">
      <h2 className="footer__heading">Hinweis zu den Gebührensätzen</h2>
      <p>
        Der Gebührenkompass ist ein Kalkulationswerkzeug und liefert{' '}
        <strong>unverbindliche Schätzungen</strong>. Hinterlegt sind die Hauptkategorien von eBay
        und Kaufland. <strong>Unterkategorien können abweichende Provisionssätze haben.</strong>{' '}
        Die Marktplätze veröffentlichen ihre Sätze nicht auf Ebene jeder einzelnen Unterkategorie,
        sodass sich diese hier nicht vollständig abbilden lassen.
      </p>
      <p>
        Gebühren, Kategoriezuordnungen und Steuersätze ändern sich zudem laufend und können
        einzelvertraglich, je nach Verkäuferkonto, Shop-Abo oder laufenden Aktionen abweichen.
        Maßgeblich ist immer die tatsächliche Abrechnung des jeweiligen Marktplatzes — nicht das
        hier angezeigte Ergebnis.
      </p>
      <p>
        Alle Angaben ohne Gewähr. Eine Haftung für die Richtigkeit, Vollständigkeit und Aktualität
        der Berechnung ist ausgeschlossen; insbesondere wird keine Haftung für wirtschaftliche
        Entscheidungen übernommen, die auf den Ergebnissen beruhen. Die Berechnung stellt keine
        Steuer- oder Rechtsberatung dar.
      </p>
      <p className="footer__meta">
        Berechnet für gewerbliche Verkäufer in der Regelbesteuerung: Provision auf den Gesamtbetrag
        einschließlich des vom Käufer gezahlten Versands, zuzüglich etwaiger Fixgebühren, abzüglich
        19 % Umsatzsteuer auf den Verkauf. Gebührenstand eBay Juli 2026, Kaufland Juni 2026.
      </p>
    </footer>
  );
}
