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

**Fixgebühr pro Bestellung.** 0,35 € unter 10 € Bestellwert, 0,45 € ab 10 €
(erhöht zum 12.02.2026). Die ursprüngliche Fassung rechnete pauschal mit 0,50 €.

**Reform zum 01.07.2026.** In etwa 43 von 80 Kategorien entfällt die Staffelung
zugunsten eines einheitlichen Satzes zwischen 7 % und 14 %. Gleichzeitig sinkt
die Provision für gebrauchte, generalüberholte und als „Neu: Sonstige“
eingestellte Artikel auf pauschal 5 %. Für den Wiederverkauf gebrauchter Ware
ist das der mit Abstand wichtigste Hebel — und genau die Unterscheidung, die die
ursprüngliche Fassung überhaupt nicht kannte.

**Nicht reformierte Kategorien.** Dort bleibt die Staffelung bestehen: bis 990 €
der reguläre Satz, für den Anteil darüber 3 %. Betrifft unter anderem Kleidung &
Accessoires, Auto- & Motorradteile sowie Uhren & Schmuck.

## Offene Punkte

- **Medien- und Spielekategorien** (Bücher, Filme, Musik, Games, Sammeln): Eine
  Quelle nennt eine Anhebung von 11 % auf 12 %, eine andere 14 %. Aktuell mit
  12 % und `unverified` hinterlegt.
- **Uhren & Schmuck**: Der Satz von 16 % ist belegt, die Staffelgrenze wird je
  nach Quelle mit 500 € oder 990 € angegeben und hängt offenbar vom Shop-Status
  ab. Aktuell 990 €.
- **Kategorienliste**: Derzeit rund 30 Einträge gegenüber etwa 80 echten
  eBay-Kategorien. Für die Kategorie-Erkennung der Extension wird die
  vollständige Liste gebraucht.
- **Nicht abgebildet**: Deckelungen einzelner Kategorien, internationale
  Verkaufsgebühren, Angebotsgebühren oberhalb des Freikontingents,
  Shop-Abogebühren.

## Kaufland

Die Sätze stammen vollständig aus Kauflands eigener Konditionenseite und sind
damit durchgehend `official`. Markt Deutschland; Kaufland weist für Polen
abweichende, niedrigere Sätze aus, die hier nicht abgebildet sind.

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
