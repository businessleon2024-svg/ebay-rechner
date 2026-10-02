import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
  Im Wurzel-Layout steht `alternates: { canonical: '/' }`. Next.js vererbt
  Metadaten an Unterseiten, die das Feld nicht selbst setzen — dadurch hatten
  Rechner, Gebührenübersicht und Hilfeseite alle die Startseite als kanonische
  Adresse ausgewiesen und sich damit selbst als Dubletten markiert.

  Der Test liest den Quelltext, statt die Seitenmodule zu importieren: Die
  Seiten ziehen den gesamten Komponentenbaum und Next-interne Module nach, was
  für die Prüfung einer einzigen Zeile viel zu viel Apparat wäre.
*/

const ROOT = join(import.meta.dirname, '..');

/** Seiten, die indexiert werden sollen, mit ihrer erwarteten kanonischen Adresse. */
const INDEXIERTE_SEITEN = [
  ['app/rechner/page.tsx', '/rechner'],
  ['app/gebuehren/page.tsx', '/gebuehren'],
  ['app/support/page.tsx', '/support'],
] as const;

/** Seiten, die per robots-Angabe ausgeschlossen sind und daher keine brauchen. */
const AUSGESCHLOSSENE_SEITEN = ['app/impressum/page.tsx', 'app/datenschutz/page.tsx'] as const;

function quelltext(pfad: string): string {
  return readFileSync(join(ROOT, pfad), 'utf8');
}

describe('kanonische Adressen', () => {
  it.each(INDEXIERTE_SEITEN)('%s weist %s als kanonische Adresse aus', (pfad, erwartet) => {
    expect(quelltext(pfad)).toContain(`alternates: { canonical: '${erwartet}' }`);
  });

  it.each(AUSGESCHLOSSENE_SEITEN)('%s bleibt von der Indexierung ausgenommen', (pfad) => {
    expect(quelltext(pfad)).toContain('robots: { index: false');
  });

  it('die eigene Adresse ist nicht fest eingetragen, sondern kommt aus der Umgebung', () => {
    /*
      Hier stand fest `https://gebuehrenkompass.de` — eine Domain, die einem
      Händler gehört. Kanonische Adresse, Sitemap und robots.txt wiesen
      Suchmaschinen damit auf eine fremde Verkaufsseite.
    */
    expect(quelltext('lib/site.ts')).toContain('process.env.NEXT_PUBLIC_SITE_URL');
    // Die alte Adresse darf nur noch in der Begründung vorkommen, nicht als Wert.
    expect(quelltext('lib/site.ts')).not.toMatch(/url:\s*'https:\/\/gebuehrenkompass\.de'/);
  });

  it('nur das Wurzel-Layout setzt die Startseite als kanonische Adresse', () => {
    expect(quelltext('app/layout.tsx')).toContain("canonical: '/'");
    for (const [pfad] of INDEXIERTE_SEITEN) {
      expect(quelltext(pfad)).not.toContain("canonical: '/'");
    }
  });
});
