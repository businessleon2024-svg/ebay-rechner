import { describe, expect, it } from 'vitest';
import { checkGtin, isValidGtin, normalizeGtin } from './gtin';

/*
  Die echten Nummern stammen aus den Abrechnungen und Beispielen, mit denen
  auch der Rechenkern geprüft wird — insbesondere die Logitech-Webcam, an der
  die Unterkategorie-Falle aufgefallen ist.
*/

describe('normalizeGtin', () => {
  it('entfernt Leerzeichen und Bindestriche', () => {
    expect(normalizeGtin(' 5099206 113503 ')).toBe('5099206113503');
    expect(normalizeGtin('4-251192-110466')).toBe('4251192110466');
  });
});

describe('checkGtin', () => {
  it('erkennt die EAN der Logitech MX Brio als gültig', () => {
    expect(checkGtin('5099206113503')).toEqual({
      status: 'gueltig',
      normalized: '5099206113503',
      laenge: 13,
    });
  });

  it('akzeptiert GTIN-8, UPC-A und ITF-14', () => {
    // Prüfziffern nach demselben Verfahren, jeweils gegengerechnet.
    expect(isValidGtin('96385074')).toBe(true); // GTIN-8
    expect(isValidGtin('036000291452')).toBe(true); // UPC-A
    expect(isValidGtin('10614141000415')).toBe(true); // ITF-14
  });

  it('meldet eine leere Eingabe getrennt, damit sie nicht als Fehler erscheint', () => {
    expect(checkGtin('')).toEqual({ status: 'leer' });
    expect(checkGtin('   ')).toEqual({ status: 'leer' });
  });

  it('weist Buchstaben zurück', () => {
    expect(checkGtin('50992O6113503')).toEqual({ status: 'keine_ziffern' });
  });

  it('weist unzulässige Längen zurück', () => {
    // Zehn Stellen: keine GTIN-Länge. Zwölf wären gültig (UPC-A), deshalb
    // taugt eine abgeschnittene EAN-13 hier nicht als Beispiel.
    expect(checkGtin('5099206113')).toEqual({ status: 'laenge', laenge: 10 });
  });

  it('nennt die erwartete Prüfziffer, wenn sie nicht stimmt', () => {
    // Letzte Stelle von 3 auf 4 geändert.
    expect(checkGtin('5099206113504')).toEqual({ status: 'pruefziffer', erwartet: 3 });
  });

  it('erkennt einen vertauschten Ziffernpaar-Tippfehler', () => {
    // 5099206113503 mit vertauschten Stellen 4 und 5 (92 → 29).
    expect(isValidGtin('5092906113503')).toBe(false);
  });
});
