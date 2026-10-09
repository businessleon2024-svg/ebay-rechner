/*
  Lädt den Gebührenkompass im Popup und gibt ihm die Artikelnummer der
  offenen Produktseite mit.

  Keine Anmeldung, kein Konto, kein Server dazwischen. Der Kompass ist frei
  benutzbar; eine Zugangshürde einzubauen, hinter der nichts Kostenpflichtiges
  liegt, würde nur Nutzer kosten.
*/

/*
  Eine einzige Stelle für die Adresse. Nach dem Domainumzug hier ändern —
  sonst zeigt die Erweiterung weiter auf die Vercel-Adresse.
*/
const APP_URL = 'https://ebay-rechner-sage.vercel.app';

const laden = document.getElementById('laden');
const rahmen = document.getElementById('rahmen');
const fehler = document.getElementById('fehler');
const fehlertext = document.getElementById('fehlertext');
const imBrowser = document.getElementById('imBrowser');

/** Wie lange auf die Seitenauswertung gewartet wird, bevor es ohne sie weitergeht. */
const LESEFRIST_MS = 1500;

function zeigen(element) {
  element.classList.remove('versteckt');
}

function verstecken(element) {
  element.classList.add('versteckt');
}

function mitFrist(versprechen, ms) {
  return Promise.race([
    versprechen,
    new Promise((aufloesen) => setTimeout(() => aufloesen(null), ms)),
  ]);
}

/**
 * Artikelnummer aus dem aktiven Tab.
 *
 * `activeTab` erlaubt das Einspielen nur, solange das Popup offen ist, und
 * nur im Tab, den der Nutzer gerade ansieht. Deshalb kommt die Erweiterung
 * ohne `host_permissions` aus — sie darf nicht im Hintergrund mitlesen, und
 * Chrome zeigt beim Installieren entsprechend keine Warnung über „Daten auf
 * allen Websites lesen".
 */
async function gtinDerSeite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Auf chrome://-Seiten, im Web Store und in leeren Tabs ist kein
    // Einspielen erlaubt. Das ist kein Fehler, dort gibt es nur nichts zu holen.
    if (!tab?.id || !/^https?:/i.test(tab.url ?? '')) return null;

    const [ergebnis] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['gtin-lesen.js'],
    });

    return ergebnis?.result?.gtin ?? null;
  } catch {
    return null;
  }
}

function zeigeFehler(text, adresse) {
  verstecken(laden);
  verstecken(rahmen);
  fehlertext.textContent = text;
  imBrowser.href = adresse;
  zeigen(fehler);
}

(async function start() {
  const gtin = await mitFrist(gtinDerSeite(), LESEFRIST_MS);

  const parameter = new URLSearchParams({ ext: '1' });
  if (gtin) parameter.set('ean', gtin);
  const adresse = `${APP_URL}/rechner?${parameter}`;

  /*
    Manche Seiten verbieten das Einbetten per `X-Frame-Options`. Beim eigenen
    Server ist das nicht zu erwarten, aber ein Popup, das ewig den Kreisel
    dreht, wäre die schlechteste Art das zu erfahren. Nach der Frist steht
    stattdessen ein Weg in den normalen Browser bereit.
  */
  const aufgebenNach = setTimeout(() => {
    zeigeFehler('Der Rechner lädt nicht. Prüfe deine Verbindung.', adresse);
  }, 10000);

  rahmen.addEventListener(
    'load',
    () => {
      clearTimeout(aufgebenNach);
      verstecken(laden);
      zeigen(rahmen);
    },
    { once: true },
  );

  rahmen.src = adresse;
})();
