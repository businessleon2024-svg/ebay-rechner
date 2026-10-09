# Gebührenkompass — Browser-Erweiterung

Lädt den Rechner ins Popup und gibt ihm die Artikelnummer der Seite mit, auf
der du gerade stehst.

## Einbauen

1. Chrome öffnen → `chrome://extensions`
2. Oben rechts **Entwicklermodus** einschalten
3. **Entpackte Erweiterung laden** → diesen Ordner (`extension/`) wählen
4. Im Puzzle-Symbol der Symbolleiste den Kompass anheften

Zum Aktualisieren: auf der Seite `chrome://extensions` beim Kompass auf das
Neuladen-Symbol. Das ist nur für die Hülle nötig — Gestaltung und
Gebührensätze kommen aus dem Netz und sind immer aktuell.

## Warum ein Rahmen statt einer eigenen Oberfläche

Die Erweiterung zeigt die Webanwendung in einem `<iframe>`. Dadurch gibt es
die Gebührensätze nur an einer Stelle.

Das ist hier kein Komfort, sondern Voraussetzung: Eine Erweiterung mit einer
eigenen, mitgelieferten Gebührentabelle veraltet in dem Moment, in dem eBay
etwas ändert — und rechnet ihren Nutzern dann still Verluste schön, bis jeder
einzelne von ihnen aktualisiert hat.

## Berechtigungen

```
activeTab   Lesen der Seite, nur solange das Popup offen ist
scripting   Einspielen von gtin-lesen.js in genau diesen Tab
```

Bewusst **kein** `host_permissions`. Damit kann die Erweiterung nicht im
Hintergrund mitlesen, und Chrome zeigt beim Einbauen keine Warnung über
„Daten auf allen Websites lesen" — die schreckt zu Recht ab.

Kein `storage`, kein Konto, keine Anmeldung. Es wird nichts gespeichert.

## Wie die Artikelnummer gefunden wird

`gtin-lesen.js` sieht in dieser Reihenfolge nach:

1. **JSON-LD** nach schema.org (`gtin13`, `gtin12`, `gtin14`, `gtin8`, `gtin`)
2. **Meta-Tags und Microdata** (`product:ean`, `itemprop="gtin13"` …)
3. **Beschrifteter Text** — eine Zahl direkt hinter „EAN", „GTIN" oder „UPC"

Alle drei sind Standards, die Shops für die Google-Produktsuche ohnehin
ausliefern. Deshalb steht hier **keine Liste einzelner Shops mit eigenen
CSS-Pfaden**: Solche Listen sehen mächtig aus, veralten aber mit jedem
Relaunch still. Der Pfad greift ins Leere, die Erweiterung meldet „nichts
gefunden", und niemand erfährt, welcher Shop es war.

Jede gefundene Zahl muss die GS1-Prüfziffer bestehen. Ohne diese Hürde landet
die erste beste 13-stellige Zahl der Seite im Feld und sieht aus wie ein
Befund — Bestellnummern und Telefonnummern haben dieselbe Länge.

> Die Prüfziffer steht hier ein zweites Mal, weil klassisches Browser-JS
> `lib/gtin.ts` nicht importieren kann. `gtin-lesen.test.ts` hält beide
> Fassungen gegeneinander, damit sie nicht auseinanderlaufen.

## Nach dem Domainumzug

Eine Zeile in `popup.js`:

```js
const APP_URL = 'https://ebay-rechner-sage.vercel.app';
```

## Was noch nicht wirkt

Das Übergeben der EAN setzt voraus, dass die Kategorie-Abfrage läuft. Ohne
hinterlegte eBay-Zugangsdaten antwortet `/api/kategorie` mit 503, und der
Rechner blendet das EAN-Feld ganz aus — die Erweiterung ist dann der Rechner
im Popup, ohne die automatische Erkennung.
