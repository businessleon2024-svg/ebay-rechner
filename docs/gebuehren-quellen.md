# Gebührensätze: Herkunft und offene Punkte

Ein falscher Gebührensatz führt hier unmittelbar zu einer falschen Kaufentscheidung.
Deshalb trägt jede Kategorie in `lib/fees/categories.ts` ein `confidence`-Feld, und
die Oberfläche weist ungeprüfte Sätze aus, statt Genauigkeit vorzutäuschen.

| Stufe | Bedeutung |
| --- | --- |
| `official` | Direkt aus eBays eigener Gebührenübersicht belegt. |
| `press` | Aus Berichterstattung zur Reform, nicht gegen eBay gegengeprüft. |
| `unverified` | Quellen widersprechen sich. In der UI wird gewarnt. |

## Regeln, die der Rechner abbildet

**Bemessungsgrundlage.** Die Verkaufsprovision wird nicht auf den Artikelpreis
allein berechnet, sondern auf den gesamten Transaktionsbetrag: Artikelpreis,
Bearbeitungsgebühren, die vom Käufer gewählten Versandkosten und die
Umsatzsteuer. Die ursprüngliche Fassung des Rechners hat nur den Artikelpreis
angesetzt und die Gebühren dadurch systematisch zu niedrig ausgewiesen.

**Feste Verkaufsgebühr pro Bestellung.** Bis *einschließlich* 10,00 €
Bestellwert 0,35 €, erst darüber 0,45 € (erhöht zum 12.02.2026). Die Schwelle
selbst zählt zum niedrigeren Satz — eine Bestellung über genau 10,00 € kostet
0,35 €, nicht 0,45 €. Die Gebühr fällt **pro Bestellung** an, nicht pro Artikel:
drei Artikel in einer Bestellung kosten einmal die feste Gebühr.

**Der reduzierte Satz gilt nicht pauschal.** Die 5 % greifen nur in den
Kategorien, die eBay dafür ausdrücklich ausweist. Kategorien ohne Beleg tragen
im Code `reducedPercent: null` und bleiben beim Standardsatz — im Zweifel wird
die Gebühr also eher zu hoch als zu niedrig angesetzt, weil das die für eine
Kaufentscheidung ungefährlichere Richtung ist.

**Reform zum 01.07.2026.** In etwa 43 von 80 Kategorien entfällt die Staffelung
zugunsten eines einheitlichen Satzes zwischen 7 % und 14 %. Gleichzeitig sinkt
die Provision für gebrauchte, generalüberholte und als „Neu: Sonstige“
eingestellte Artikel auf pauschal 5 %. Für den Wiederverkauf gebrauchter Ware
ist das der mit Abstand wichtigste Hebel — und genau die Unterscheidung, die die
ursprüngliche Fassung überhaupt nicht kannte.

**Nicht reformierte Kategorien.** Dort bleibt die Staffelung bestehen: bis 990 €
der reguläre Satz, für den Anteil darüber 3 %. Betrifft Kleidung & Accessoires,
Auto- & Motorradteile, Bücher & Zeitschriften, Filme & Serien, Musik, PC- &
Videospiele, Sammeln & Seltenes sowie Uhren & Schmuck. **Ohne** Staffelung, aber
ebenfalls nicht reformiert: Spielzeug und Beauty & Gesundheit mit flachen 14 %.

**Shop-Abo.** Bei **Uhren & Schmuck** verschiebt ein Shop-Abo die Staffelgrenze
von 990 € auf 500 € — dort ist der Shop also von Vorteil, weil der reduzierte
Satz von 3 % früher greift. In allen anderen Kategorien ändert der Shop-Status
die Schwelle nicht.

## Unterkategorien

Hinterlegt sind die **Hauptkategorien**. eBay und Kaufland veröffentlichen ihre
Sätze nicht auf Ebene jeder einzelnen Unterkategorie, weshalb sich diese nicht
vollständig abbilden lassen — einzelne Unterkategorien können abweichen. Darauf
weist die Oberfläche direkt an der Kategorieauswahl hin, zusätzlich zum
Haftungsausschluss im Fußbereich. Maßgeblich ist immer die tatsächliche
Abrechnung des Marktplatzes.

## Offene Punkte

- **Kategorie-IDs**: siehe unten, bisher nur für neun Kategorien hinterlegt.
- **Shop-Abo**: Der Shop-Status verschiebt bisher nur bei Uhren & Schmuck die
  Staffelgrenze (990 € ohne Shop, 500 € mit Shop). Ob er in weiteren Kategorien
  wirkt, ist nicht abschließend geprüft.
- **Kategorie-IDs**: Erst neun der 53 Kategorien tragen eBays numerische ID
  (58058 Computer/Tablets/Netzwerk, 1245 Drucker, 171833 Ersatzteile & Werkzeuge
  PC/Videospiele, 625 Foto & Camcorder, 18871 und 96991 Speicherkarten, 3323
  Objektive, 15032 Handys & Kommunikation, 20710 Haushaltsgeräte). Für die
  automatische Kategorie-Erkennung der Extension werden die übrigen gebraucht.
- **Nicht abgebildet**: Deckelungen einzelner Kategorien, internationale
  Verkaufsgebühren, Angebotsgebühren oberhalb des Freikontingents,
  Shop-Abogebühren.

## Kaufland

Die Sätze stammen vollständig aus Kauflands eigener Konditionenseite und sind
damit durchgehend `official`. Markt Deutschland; Kaufland weist für Polen
abweichende, niedrigere Sätze aus, die hier nicht abgebildet sind.

Die Kategorien sind bewusst **einzeln** hinterlegt und nicht zu Gruppen
zusammengefasst. Die Zusammenfassung war fehleranfällig: „Küche & Haushalt"
(14 %) gehört nicht zu den Haushaltselektronik-Kleingeräten (13 %), und ein
Staubsaugerroboter (7 %) wird anders abgerechnet als ein gewöhnlicher
Staubsauger (13 %).

Ein Tarif gilt für alle Kaufland-Marktplätze — ein zusätzlicher Marktplatz
kostet keine weitere Grundgebühr. Provision fällt nur bei tatsächlichem Verkauf
an; Retouren und Stornierungen werden laut Kaufland nicht belastet.

Drei Unterschiede zu eBay, die der Rechner berücksichtigt:

- **Keine Gebühr pro Bestellung.** Stattdessen eine monatliche Grundgebühr von
  39,95 € (Basic) oder 59,95 € (Plus), jeweils netto. Sie lässt sich anteilig
  auf den einzelnen Verkauf umlegen — ohne diese Umlage wirkt jeder Verkauf
  profitabler, als das Geschäft in Summe ist.
- **Kein reduzierter Satz für gebrauchte Ware.** Der Artikelzustand spielt für
  die Provision keine Rolle, die Auswahl wird dort deshalb nicht angeboten.
- **Zahlungsabwicklung ist in der Provision enthalten**, es fällt keine
  separate Gebühr an.

Die Bemessungsgrundlage ist wie bei eBay der Bruttoverkaufspreis einschließlich
Versandkosten. Einzige Ausnahme von der reinen Prozentprovision: die Kategorie
Medien mit zusätzlich 0,70 € je Artikel.

**Nicht abgebildet**: Gutschein-Einlösegebühr (0,49 € bzw. 0,99 € ab 100 €),
EPR-Servicegebühr, Performance Coach.

## Nicht abgebildete Verkäufertypen

Die V1 rechnet ausschließlich für **gewerbliche Verkäufer in der
Regelbesteuerung**. Bewusst noch nicht abgebildet:

- **Differenzbesteuerung nach § 25a UStG** — für Händler gebrauchter Ware der
  praktische Normalfall. Umsatzsteuer fällt dann nur auf die Marge an, nicht auf
  den vollen Verkaufspreis. Das ist die wichtigste noch fehlende Rechenvariante.
- **Kleinunternehmer nach § 19 UStG** — keine USt auf den Verkauf, dafür sind
  die eBay-Gebühren brutto zu tragen.
- **Privatverkäufer** — zahlen auf ebay.de seit dem 01.03.2023 innerhalb
  Deutschlands überhaupt keine Verkaufsprovision.

## Wie die Sätze zu prüfen sind

Die belastbarste Quelle ist die eigene eBay-Gebührenabrechnung: Dort steht für
jede reale Bestellung der tatsächlich angesetzte Satz. Ein Abgleich weniger
echter Verkäufe je Kategorie ersetzt jede Sekundärquelle.
