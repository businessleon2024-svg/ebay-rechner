import { describe, expect, it } from 'vitest';
import { schlageKategorienVor } from './suggest';

/*
  Geprüft wird vor allem eines: dass belegte Vorschläge nicht mit Vermutungen
  verwechselt werden. Ein geratener Satz, der aussieht wie ein geprüfter, ist
  schlimmer als gar keiner.
*/

describe('schlageKategorienVor', () => {
  it('schlägt für eine Webcam die Zubehör-Kategorie vor, nicht die Computer-Kategorie', () => {
    // Der Fall, der den ganzen Rechner in Frage gestellt hat: 7 % angenommen,
    // 12 % abgerechnet.
    const [erster] = schlageKategorienVor('Logitech MX Brio 4K Webcam');

    expect(erster.category.id).toBe('tastaturen-maeuse');
    expect(erster.category.standardPercent).toBe(12);
    expect(erster.sicherheit).toBe('belegt');
  });

  it('trennt Streaming-Sticks von der Hauptkategorie TV, Video & Audio', () => {
    const [erster] = schlageKategorienVor('Amazon Fire TV Stick 4K');

    expect(erster.category.id).toBe('streaming-geraete');
    expect(erster.category.standardPercent).toBe(12);
  });

  it('kennzeichnet Reinigungsmittel ausdrücklich als Vermutung', () => {
    // Genau der Dyson-Probiotic-Fall. Hier gibt es keine Abrechnung, und das
    // muss sichtbar bleiben.
    const treffer = schlageKategorienVor('Dyson Probiotic Reinigungsmittel für Hartböden');
    const reinigung = treffer.find((v) => v.category.id === 'moebel-wohnen');

    expect(reinigung?.sicherheit).toBe('vermutung');
    expect(reinigung?.grund).toContain('prüfen');
  });

  it('stellt belegte Treffer vor Vermutungen', () => {
    // „Staubsauger" ist belegt und führt zu Haushaltsgeräten, „Kabel" ist eine
    // Vermutung und führt woanders hin. Die Reihenfolge zählt.
    const treffer = schlageKategorienVor('Staubsauger mit Kabel');

    expect(treffer[0].sicherheit).toBe('belegt');
    expect(treffer[0].category.id).toBe('haushaltsgeraete');
    expect(treffer.some((v) => v.sicherheit === 'vermutung')).toBe(true);
  });

  it('nennt dieselbe Kategorie nur einmal, auch bei mehreren Stichwörtern', () => {
    // „Staubsauger" (belegt) und „Filter" (Vermutung) zeigen beide auf
    // Haushaltsgeräte. Dann gilt der belegte Treffer, nicht beide.
    const treffer = schlageKategorienVor('Staubsauger Filter Ersatzteil');

    expect(treffer).toHaveLength(1);
    expect(treffer[0].sicherheit).toBe('belegt');
  });

  it('nennt das auslösende Stichwort, damit der Vorschlag nachvollziehbar ist', () => {
    const [erster] = schlageKategorienVor('Bosch Akkuschrauber 18V');
    expect(erster.ausloeser).toBe('akkuschrauber');
    expect(erster.category.id).toBe('heimwerker');
  });

  it('unterscheidet elektrische Zahnpflege von Beauty & Gesundheit', () => {
    // Beide liegen inhaltlich nah beieinander, kosten aber 7 % und 12 %.
    const [zahn] = schlageKategorienVor('Oral-B Zahnbürste');
    const [parfum] = schlageKategorienVor('Gisada Eau de Parfum');

    expect(zahn.category.standardPercent).toBe(7);
    expect(parfum.category.standardPercent).toBe(12);
  });

  it('schweigt bei zu kurzer oder nichtssagender Eingabe', () => {
    expect(schlageKategorienVor('')).toEqual([]);
    expect(schlageKategorienVor('ab')).toEqual([]);
    expect(schlageKategorienVor('xyz123 ohne Bezug')).toEqual([]);
  });

  it('nennt jede Kategorie höchstens einmal und hält die Obergrenze ein', () => {
    const treffer = schlageKategorienVor('Staubsauger Wasserkocher Toaster Mixer Kabel Hülle');
    const ids = treffer.map((v) => v.category.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(treffer.length).toBeLessThanOrEqual(3);
  });

  it('ist unabhängig von Groß- und Kleinschreibung', () => {
    expect(schlageKategorienVor('WEBCAM')[0].category.id).toBe('tastaturen-maeuse');
  });
});
