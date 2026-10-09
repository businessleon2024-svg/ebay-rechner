import { describe, expect, it } from 'vitest';
import { eanAusSuche } from './start-params';

describe('eanAusSuche', () => {
  it('nimmt eine gültige EAN an', () => {
    expect(eanAusSuche('?ean=4006381333931')).toBe('4006381333931');
  });

  it('versteht auch den Namen gtin', () => {
    expect(eanAusSuche('?gtin=4006381333931')).toBe('4006381333931');
  });

  it('kommt ohne führendes Fragezeichen aus', () => {
    expect(eanAusSuche('ean=4006381333931')).toBe('4006381333931');
  });

  it('übergeht andere Parameter', () => {
    expect(eanAusSuche('?ext=1&ean=4006381333931&x=y')).toBe('4006381333931');
  });

  it('räumt Leerzeichen und Trennstriche weg', () => {
    expect(eanAusSuche('?ean=4006381%20333931')).toBe('4006381333931');
  });

  /*
    Der Grund, warum hier überhaupt geprüft wird: Eine fremde Seite kann auf
    den Rechner verlinken und beliebige Werte mitgeben. Eine Zahl, die die
    Prüfziffer nicht besteht, führt nur zu einer vergeblichen Abfrage gegen
    das Tageskontingent — und zu einem Feld, das befüllt aussieht, ohne es zu
    sein.
  */
  it('verwirft eine Nummer mit falscher Prüfziffer', () => {
    expect(eanAusSuche('?ean=4006381333932')).toBe('');
  });

  it('verwirft Buchstabensalat', () => {
    expect(eanAusSuche('?ean=bitte-hier-klicken')).toBe('');
  });

  it('verwirft eine zu kurze Nummer', () => {
    expect(eanAusSuche('?ean=12345')).toBe('');
  });

  it('bleibt leer, wenn nichts mitgegeben wurde', () => {
    expect(eanAusSuche('')).toBe('');
    expect(eanAusSuche('?ext=1')).toBe('');
  });
});
