/*
  Service Worker für den Gebührenkompass.

  Zweck ist nicht Geschwindigkeit, sondern Verfügbarkeit: Reseller rechnen im
  Laden, im Keller, auf dem Flohmarkt — dort, wo das Netz wegbricht. Ohne
  Service Worker zeigt eine installierte Web-App in dem Moment die
  Offline-Seite des Browsers, obwohl der Rechner selbst gar kein Netz braucht.

  Bewusst klein gehalten und ohne Hilfsbibliothek. Ein Service Worker, den
  niemand mehr versteht, liefert im Zweifel monatelang veraltete Dateien aus.

  Absichtlich NICHT verwendet werden `skipWaiting` und `clients.claim`: Eine
  neue Fassung übernimmt erst, wenn alle Tabs geschlossen sind. Andernfalls
  könnte mitten in einer Sitzung der alte Zwischenspeicher gelöscht werden,
  während die offene Seite noch Bausteine daraus nachlädt — die Seite bliebe
  halb geladen stehen.
*/

// Bei jeder Änderung an dieser Datei hochzählen; ältere Speicher werden dann
// beim Aktivieren entfernt.
const VERSION = 'gk-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

/** Seiten, die auch ohne Netz erreichbar sein sollen. */
const VORRAT = ['/rechner', '/gebuehren'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((speicher) =>
      // Einzeln, damit eine nicht erreichbare Seite nicht die ganze
      // Installation scheitern lässt.
      Promise.all(VORRAT.map((pfad) => speicher.add(pfad).catch(() => undefined))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(
        namen.filter((name) => !name.startsWith(VERSION)).map((name) => caches.delete(name)),
      ),
    ),
  );
});

/** Unveränderliche Bausteine: Der Name enthält einen Hash, Inhalt ändert sich nie. */
function istUnveraenderlich(url) {
  return url.pathname.startsWith('/_next/static/') || /^\/icon-[\w-]+\.png$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /*
    Die EAN-Abfrage bleibt außen vor. Sie hat am Netzrand ihren eigenen
    Zwischenspeicher, und eine veraltete Kategorie wäre schlimmer als gar
    keine Antwort.
  */
  if (url.pathname.startsWith('/api/')) return;

  if (istUnveraenderlich(url)) {
    event.respondWith(
      caches.match(request).then(
        (treffer) =>
          treffer ??
          fetch(request).then((antwort) => {
            if (antwort.ok) {
              const kopie = antwort.clone();
              caches.open(ASSETS).then((speicher) => speicher.put(request, kopie));
            }
            return antwort;
          }),
      ),
    );
    return;
  }

  // Seitenaufrufe: erst das Netz, damit Inhalte und Gebührensätze aktuell
  // bleiben. Nur wenn es nicht erreichbar ist, greift der Zwischenspeicher.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((antwort) => {
          if (antwort.ok) {
            const kopie = antwort.clone();
            caches.open(SHELL).then((speicher) => speicher.put(request, kopie));
          }
          return antwort;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/rechner'))),
    );
  }
});
