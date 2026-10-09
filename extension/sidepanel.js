/*
  Gebührenkompass im Seitenpanel.

  Der Unterschied zum Popup ist nicht die Darstellung, sondern die Lebensdauer:
  Das Panel bleibt offen, während man weiterklickt. Damit wird aus einer
  einmaligen Frage ("welche Nummer steht auf dieser Seite?") eine fortlaufende
  — und daraus ergibt sich die einzige wirklich heikle Entscheidung hier.

  Der Rechner wird **nicht** selbsttätig neu geladen, wenn man die Seite
  wechselt. Stattdessen erscheint eine Leiste mit der gefundenen Nummer und
  einer Schaltfläche. Grund: Das Neuladen verwirft, was gerade eingetippt
  wurde. Wer beim Stöbern seine halb eingegebenen Preise verliert, benutzt die
  Erweiterung kein zweites Mal.
*/

/* Eine einzige Stelle für die Adresse. Nach dem Domainumzug hier ändern. */
const APP_URL = 'https://ebay-rechner-sage.vercel.app';

const laden = document.getElementById('laden');
const rahmen = document.getElementById('rahmen');
const fehler = document.getElementById('fehler');
const fehlertext = document.getElementById('fehlertext');
const imBrowser = document.getElementById('imBrowser');
const angebot = document.getElementById('angebot');
const angebotGtin = document.getElementById('angebotGtin');

/** Nummer, mit der der Rechner gerade geladen ist. */
let geladeneGtin = null;
/** Nummer, die angeboten, aber weggeklickt wurde — nicht erneut anbieten. */
let abgelehnteGtin = null;

const zeigen = (el) => el.classList.remove('versteckt');
const verstecken = (el) => el.classList.add('versteckt');

function mitFrist(versprechen, ms) {
  return Promise.race([versprechen, new Promise((fertig) => setTimeout(() => fertig(null), ms))]);
}

/**
 * Artikelnummer des aktiven Tabs.
 *
 * Anders als im Popup reicht `activeTab` hier nicht: Diese Berechtigung gilt
 * nur nach einem Klick auf das Symbol. Das Panel liest aber auch, während man
 * weitersurft — dafür braucht es `tabs`, um die Adresse zu sehen, und
 * `scripting` zum Einspielen. Gelesen wird trotzdem nur der Tab, den man
 * gerade vor sich hat, und nur die Artikelnummer.
 */
async function gtinDerSeite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/i.test(tab.url ?? '')) return null;

    const [ergebnis] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['gtin-lesen.js'],
    });
    return ergebnis?.result?.gtin ?? null;
  } catch {
    // Auf Seiten, die kein Einspielen erlauben (Web Store, chrome://, PDF),
    // ist das der Normalfall und kein Fehler.
    return null;
  }
}

function adresseMit(gtin) {
  const parameter = new URLSearchParams({ ext: '1' });
  if (gtin) parameter.set('ean', gtin);
  return `${APP_URL}/rechner?${parameter}`;
}

function laedtRechner(gtin) {
  geladeneGtin = gtin;
  verstecken(angebot);
  verstecken(fehler);
  zeigen(laden);
  verstecken(rahmen);

  const aufgebenNach = setTimeout(() => {
    verstecken(laden);
    fehlertext.textContent = 'Der Rechner lädt nicht. Prüfe deine Verbindung.';
    imBrowser.href = adresseMit(gtin);
    zeigen(fehler);
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

  rahmen.src = adresseMit(gtin);
}

/** Leiste anbieten — nur wenn die Nummer neu und nicht schon abgelehnt ist. */
async function pruefeSeite() {
  const gtin = await mitFrist(gtinDerSeite(), 1500);
  if (!gtin || gtin === geladeneGtin || gtin === abgelehnteGtin) {
    if (!gtin) verstecken(angebot);
    return;
  }

  angebotGtin.textContent = gtin;
  zeigen(angebot);
}

document.getElementById('uebernehmen').addEventListener('click', () => {
  const gtin = angebotGtin.textContent;
  abgelehnteGtin = null;
  laedtRechner(gtin);
});

document.getElementById('verwerfen').addEventListener('click', () => {
  abgelehnteGtin = angebotGtin.textContent;
  verstecken(angebot);
});

/*
  Auf Tabwechsel und auf das Fertigladen einer Seite hören. Beides ist nötig:
  Der Wechsel allein greift zu früh, wenn der Tab noch lädt, und `onUpdated`
  allein verpasst den Sprung zu einem längst geladenen Tab.
*/
chrome.tabs.onActivated.addListener(() => void pruefeSeite());
chrome.tabs.onUpdated.addListener((_tabId, aenderung, tab) => {
  if (aenderung.status === 'complete' && tab.active) void pruefeSeite();
});

(async function start() {
  const gtin = await mitFrist(gtinDerSeite(), 1500);
  laedtRechner(gtin);
})();
