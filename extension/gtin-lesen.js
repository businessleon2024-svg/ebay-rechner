/*
  Liest die Artikelnummer der offenen Produktseite.

  Wird vom Popup per `chrome.scripting.executeScript` in den aktiven Tab
  eingespielt; der Rückgabewert dieser Funktion ist das Ergebnis.

  Bewusst kurz gehalten und nur an Standards entlang: JSON-LD nach schema.org,
  Produkt-Meta-Tags und Microdata. Diese drei geben über 90 % der deutschen
  Shops heraus, weil Google sie für die Produktsuche verlangt — kein Shop
  verzichtet freiwillig darauf.

  Keine Liste einzelner Shops mit eigenen CSS-Pfaden. Solche Listen sehen
  mächtig aus, veralten aber mit jedem Relaunch still: Der Pfad greift ins
  Leere, die Erweiterung meldet "nichts gefunden", und niemand merkt, welcher
  Shop es war. Was an Standards hängt, hält.

  Geraten wird nie. Jede Zahl muss die Prüfziffer bestehen — sonst landet eine
  beliebige 13-stellige Zahl von der Seite im Feld und sieht aus wie ein
  Befund.
*/

(function () {
  'use strict';

  /**
   * Prüfziffer nach GS1. Gilt für EAN-13, UPC-A (12), EAN-8 und GTIN-14:
   * Von rechts nach links abwechselnd mit 3 und 1 gewichtet, die letzte
   * Stelle ist die Prüfziffer.
   */
  function pruefzifferStimmt(ziffern) {
    if (!/^\d{8}$|^\d{12,14}$/.test(ziffern)) return false;

    const stellen = ziffern.split('').map(Number);
    const pruefziffer = stellen.pop();
    let summe = 0;
    for (let i = stellen.length - 1, gewicht = 3; i >= 0; i--, gewicht = gewicht === 3 ? 1 : 3) {
      summe += stellen[i] * gewicht;
    }
    return (10 - (summe % 10)) % 10 === pruefziffer;
  }

  function saeubern(wert) {
    return String(wert ?? '').replace(/[\s-]/g, '');
  }

  /** Erste gültige Nummer aus einer Liste von Kandidaten. */
  function ersteGueltige(kandidaten) {
    for (const kandidat of kandidaten) {
      const nummer = saeubern(kandidat);
      if (pruefzifferStimmt(nummer)) return nummer;
    }
    return null;
  }

  /*
    JSON-LD darf beliebig verschachtelt sein: `@graph`, Listen, ein Angebot im
    Produkt. Deshalb wird der Baum durchlaufen statt an festen Stellen
    nachgesehen. Die Tiefe ist begrenzt, damit eine zyklische oder absurd
    verschachtelte Struktur die Seite nicht anhält.
  */
  const GTIN_FELDER = ['gtin13', 'gtin12', 'gtin14', 'gtin8', 'gtin'];

  function ausJsonLd() {
    const gefunden = [];

    function durchlaufen(knoten, tiefe) {
      if (tiefe > 8 || knoten === null || typeof knoten !== 'object') return;

      if (Array.isArray(knoten)) {
        for (const eintrag of knoten) durchlaufen(eintrag, tiefe + 1);
        return;
      }

      for (const feld of GTIN_FELDER) {
        if (knoten[feld]) gefunden.push(knoten[feld]);
      }
      for (const schluessel of Object.keys(knoten)) {
        durchlaufen(knoten[schluessel], tiefe + 1);
      }
    }

    for (const skript of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        durchlaufen(JSON.parse(skript.textContent), 0);
      } catch {
        // Ungültiges JSON ist auf Produktseiten keine Seltenheit. Still
        // übergehen — die nächste Quelle greift vielleicht.
      }
    }

    return gefunden;
  }

  function ausMetaUndMicrodata() {
    const auswahl = [
      'meta[property="product:ean"]',
      'meta[property="product:gtin"]',
      'meta[property="og:product:gtin"]',
      'meta[name="ean"]',
      'meta[name="gtin"]',
      'meta[itemprop="gtin13"]',
      'meta[itemprop="gtin12"]',
      'meta[itemprop="gtin"]',
    ];

    const gefunden = [];
    for (const pfad of auswahl) {
      for (const knoten of document.querySelectorAll(pfad)) {
        const wert = knoten.getAttribute('content');
        if (wert) gefunden.push(wert);
      }
    }

    // Microdata ohne Meta-Tag, etwa <span itemprop="gtin13">…</span>
    for (const knoten of document.querySelectorAll('[itemprop^="gtin"]')) {
      gefunden.push(knoten.getAttribute('content') ?? knoten.textContent);
    }

    return gefunden;
  }

  /*
    Letzte Zuflucht: eine Zahl, die unmittelbar hinter einer Beschriftung wie
    "EAN" steht. Nur mit Beschriftung — eine freistehende 13-stellige Zahl auf
    einer Seite ist genauso oft eine Bestellnummer oder eine Telefonnummer.
  */
  function ausBeschriftetemText() {
    const text = document.body?.innerText ?? '';
    const treffer = text.match(/\b(?:EAN|GTIN|UPC)[\s:/-]*((?:\d[\s-]?){8,14})/gi) ?? [];
    return treffer.map((zeile) => zeile.replace(/^[^\d]*/, ''));
  }

  const nummer =
    ersteGueltige(ausJsonLd()) ??
    ersteGueltige(ausMetaUndMicrodata()) ??
    ersteGueltige(ausBeschriftetemText());

  return { gtin: nummer, titel: document.title, adresse: location.href };
})();
