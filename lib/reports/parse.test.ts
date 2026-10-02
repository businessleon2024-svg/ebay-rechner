import { describe, expect, it } from 'vitest';
import { leseMeldungen } from './parse';

/*
  Die Beispiele sind so aufgebaut, wie Meldungen tatsächlich ankommen: mit
  Begleittext davor, Zitatzeichen vom Weiterleiten, Signatur dahinter. Ein
  Parser, der nur den Idealfall versteht, wirft Daten weg, die sich jemand die
  Mühe gemacht hat einzutippen.
*/

const WEBCAM = `Meine Abrechnung weicht vom Rechner ab. Die Angaben unten stammen aus der
tatsächlichen Gebührenabrechnung.

--- GEBUEHRENKOMPASS-MELDUNG v1 ---
marktplatz: ebay
kategorie_gewaehlt: computer-tablets-netzwerk
kategorie_angebot: Computer, Tablets & Netzwerk › Webcams
zustand: new
genauigkeit: main_category
grundlage: 153.99
satz_gerechnet: 7
satz_tatsaechlich: 12
provision_gerechnet: 10.78
provision_tatsaechlich: 18.48
produkt: Logitech MX Brio Ultra Grafit 4K Webcam
ean: 5099206113503
artikelnummer: 820175879319
--- ENDE ---`;

describe('leseMeldungen', () => {
  it('liest eine vollständige Meldung', () => {
    const [meldung] = leseMeldungen(WEBCAM);

    expect(meldung.version).toBe(1);
    expect(meldung.marktplatz).toBe('ebay');
    expect(meldung.kategorieGewaehlt).toBe('computer-tablets-netzwerk');
    expect(meldung.satzTatsaechlich).toBe(12);
    expect(meldung.provisionTatsaechlich).toBe(18.48);
    expect(meldung.ean).toBe('5099206113503');
  });

  it('übergeht Begleittext vor und nach dem Block', () => {
    const text = `Hallo,\n\nhier meine Meldung.\n\n${WEBCAM}\n\nViele Grüße\nLeon\n--\nGesendet von meinem iPhone`;
    const meldungen = leseMeldungen(text);

    expect(meldungen).toHaveLength(1);
    expect(meldungen[0].produkt).toBe('Logitech MX Brio Ultra Grafit 4K Webcam');
  });

  it('kommt mit Zitatzeichen aus weitergeleiteten Nachrichten zurecht', () => {
    const zitiert = WEBCAM.split('\n').map((z) => `> ${z}`).join('\n');
    const [meldung] = leseMeldungen(zitiert);

    expect(meldung.satzTatsaechlich).toBe(12);
    expect(meldung.kategorieAngebot).toBe('Computer, Tablets & Netzwerk › Webcams');
  });

  it('liest mehrere Meldungen aus einer Sammelnachricht', () => {
    const meldungen = leseMeldungen(`${WEBCAM}\n\nund noch eine:\n\n${WEBCAM}`);
    expect(meldungen).toHaveLength(2);
  });

  it('nimmt eine Meldung auch ohne Endmarke an', () => {
    // Abgeschnittene Mail: Das Gesammelte ist trotzdem brauchbar.
    const ohneEnde = WEBCAM.replace('--- ENDE ---', '');
    const [meldung] = leseMeldungen(ohneEnde);

    expect(meldung.produkt).toBe('Logitech MX Brio Ultra Grafit 4K Webcam');
  });

  it('versteht deutsche wie englische Zahlen und Einheiten', () => {
    const text = `--- GEBUEHRENKOMPASS-MELDUNG v1 ---
satz_tatsaechlich: 12,5 %
provision_tatsaechlich: 1.024,99 €
grundlage: 1,024.99
--- ENDE ---`;
    const [meldung] = leseMeldungen(text);

    expect(meldung.satzTatsaechlich).toBe(12.5);
    expect(meldung.provisionTatsaechlich).toBe(1024.99);
    expect(meldung.grundlage).toBe(1024.99);
  });

  it('verwirft unlesbare Zahlen, statt sie zu raten', () => {
    const text = `--- GEBUEHRENKOMPASS-MELDUNG v1 ---
satz_tatsaechlich: weiß ich nicht
produkt: Irgendwas
--- ENDE ---`;
    const [meldung] = leseMeldungen(text);

    expect(meldung.satzTatsaechlich).toBeUndefined();
    expect(meldung.produkt).toBe('Irgendwas');
  });

  it('vereinheitlicht die EAN-Schreibweise', () => {
    // Sonst gälten „4-251192-110466" und „4251192110466" als zwei Artikel.
    const text = `--- GEBUEHRENKOMPASS-MELDUNG v1 ---
ean: 4-251192-110466
--- ENDE ---`;
    expect(leseMeldungen(text)[0].ean).toBe('4251192110466');
  });

  it('übergeht unbekannte Felder, statt die Meldung zu verwerfen', () => {
    // Eine spätere Fassung des Formulars darf Felder ergänzen.
    const text = `--- GEBUEHRENKOMPASS-MELDUNG v2 ---
marktplatz: ebay
voellig_neues_feld: egal
satz_tatsaechlich: 13
--- ENDE ---`;
    const [meldung] = leseMeldungen(text);

    expect(meldung.version).toBe(2);
    expect(meldung.satzTatsaechlich).toBe(13);
  });

  it('gibt nichts zurück, wenn kein Block enthalten ist', () => {
    expect(leseMeldungen('Hallo, der Rechner ist super. Viele Grüße')).toEqual([]);
    expect(leseMeldungen('')).toEqual([]);
  });
});
