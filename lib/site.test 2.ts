import { describe, expect, it } from 'vitest';
import { SITE } from './site';

/*
  Die Adresse der Seite steckt in Metadaten, Sitemap, robots.txt, strukturierten
  Daten und Vorschaubildern. Stimmt sie nicht, zeigt alles davon ins Leere —
  und zwar still, ohne dass irgendwo etwas abstürzt.
*/

describe('SITE', () => {
  it('ist eine vollständige, absolute Adresse', () => {
    expect(() => new URL(SITE.url)).not.toThrow();
    expect(SITE.url).toMatch(/^https?:\/\//);
  });

  it('endet nicht auf einem Schrägstrich', () => {
    // Sonst entstünden Adressen wie „…/.de//rechner".
    expect(SITE.url).not.toMatch(/\/$/);
    expect(`${SITE.url}/rechner`).not.toContain('//rechner');
  });

  it('nennt als Domain genau den Rechnernamen der Adresse', () => {
    // Beides wird getrennt verwendet — in Texten die Domain, in Verweisen die
    // Adresse. Laufen sie auseinander, steht im Formular eine andere Seite als
    // die, von der es stammt.
    expect(SITE.domain).toBe(new URL(SITE.url).host);
  });

  it('verweist nicht auf eine Domain, die uns nicht gehört', () => {
    /*
      gebuehrenkompass.de gehört einem Domainhändler und steht zum Verkauf.
      Solange das so ist, darf keine Ausgabe der Seite dorthin zeigen.
    */
    expect(SITE.domain).not.toContain('gebuehrenkompass.de');
  });
});
