# eBay Gebühren- & Gewinnrechner

Ein Reseller soll in wenigen Sekunden erkennen, ob sich Einkauf und Weiterverkauf
eines Artikels lohnen. Der Gebührenrechner ist der Kern dieses Produkts.

## Stand

Der ursprüngliche Rechner (eine einzelne HTML-Datei, weiterhin unter
[`legacy/index.html`](legacy/index.html)) ist die Grundlage dieser Fassung:
Rechenlogik, Design-Sprache und Bedienablauf wurden übernommen und überarbeitet.
Erhalten geblieben sind Live-Berechnung bei jeder Eingabe, das Speichern der
letzten Eingaben, „Zurücksetzen“ und „Ergebnis kopieren“.

Fachlich neu gegenüber der ursprünglichen Fassung:

- Die Provision wird auf den **gesamten Transaktionsbetrag** berechnet,
  einschließlich des vom Käufer gezahlten Versands — vorher nur auf den
  Artikelpreis.
- **Artikelzustand** als Eingabe: gebrauchte und generalüberholte Ware kostet
  seit dem 01.07.2026 in vielen Kategorien nur noch 5 %.
- Korrekte, nach Bestellwert **gestaffelte Fixgebühr** (0,35 € / 0,45 €).
- **Umsatzsteuer** auf den Verkauf und Vorsteuerabzug je Kostenposition.
- **Auszahlung**, **ROI**, **Break-even** und der **maximale Einkaufspreis** für
  einen gewünschten Zielgewinn.

Zielgruppe der aktuellen Fassung sind gewerbliche Verkäufer in der
Regelbesteuerung. Differenzbesteuerung, Kleinunternehmer und Privatverkäufer
sind noch nicht abgebildet — siehe [`docs/gebuehren-quellen.md`](docs/gebuehren-quellen.md).

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Rechenkern (Vitest)
npm run typecheck
npm run lint
```

## Aufbau

```
app/              Next.js App Router, Seite und Stylesheet
components/       Formular und Ergebnisdarstellung
lib/fees/         Rechenkern – frei von React, vollständig getestet
legacy/           ursprüngliche Einzeldatei-Fassung
docs/             Herkunft der Gebührensätze, offene Punkte
```

Der Rechenkern unter `lib/fees/` hängt bewusst an keinem Framework: Web-App und
die geplante Chrome Extension sollen dieselbe Logik verwenden, damit beide
niemals unterschiedliche Zahlen anzeigen.

## Gebührensätze

Jede Kategorie trägt eine Angabe dazu, wie gut ihr Satz belegt ist. Sätze ohne
offiziellen Beleg werden in der Oberfläche als ungeprüft gekennzeichnet, statt
Genauigkeit vorzutäuschen. Hintergrund und offene Punkte:
[`docs/gebuehren-quellen.md`](docs/gebuehren-quellen.md).

## Hinweis zum Deployment

GitHub Pages liefert derzeit die ursprüngliche `index.html` aus dem
Wurzelverzeichnis von `main` aus. Diese Fassung ist eine Next.js-Anwendung und
braucht ein eigenes Deployment; ein Zusammenführen nach `main` ohne vorherige
Umstellung würde die bestehende Seite offline nehmen.
