import { describe, expect, it } from 'vitest';
import { werteAntwortAus } from './browse';

/*
  Die Antwortform ist der Beschreibung der Browse API nachgebildet
  (`itemSummaries[].leafCategoryIds`, in der Reihenfolge primär/sekundär).
  Geprüft wird hier das Auswerten, nicht der Abruf — deshalb ohne Netzwerk.

  Die Zahlen stammen aus dem Fall, der die ganze Sache ausgelöst hat: Die
  Logitech MX Brio steht bei eBay unter Webcams, nicht unter Computern, und
  wird deshalb mit 12 % statt 7 % abgerechnet.
*/

const antwort = (kategorien: Array<string[] | { ids: string[]; name?: string; titel?: string }>) => ({
  itemSummaries: kategorien.map((eintrag) => {
    const normalisiert = Array.isArray(eintrag) ? { ids: eintrag } : eintrag;
    return {
      title: normalisiert.titel ?? 'Logitech MX Brio 4K Webcam',
      leafCategoryIds: normalisiert.ids,
      ...(normalisiert.name
        ? { categories: [{ categoryId: normalisiert.ids[0], categoryName: normalisiert.name }] }
        : {}),
    };
  }),
});

describe('werteAntwortAus', () => {
  it('zählt die häufigste Blattkategorie zuerst', () => {
    const befund = werteAntwortAus(
      '5099206113503',
      antwort([['175672'], ['175672'], ['175672'], ['58058']]),
    );

    expect(befund.ausgewertet).toBe(4);
    expect(befund.kategorien[0]).toEqual({ id: '175672', name: undefined, anzahl: 3, anteil: 0.75 });
    expect(befund.kategorien[1].id).toBe('58058');
  });

  it('nimmt nur die primäre Blattkategorie, nicht die sekundäre', () => {
    // eBay liefert bei zwei Blattkategorien primär zuerst. Die sekundäre
    // darf nicht mitgezählt werden, abgerechnet wird nach der primären.
    const befund = werteAntwortAus('5099206113503', antwort([['175672', '58058']]));

    expect(befund.kategorien).toHaveLength(1);
    expect(befund.kategorien[0].id).toBe('175672');
  });

  it('übernimmt den Klarnamen, auch wenn ihn nur ein Angebot mitliefert', () => {
    const befund = werteAntwortAus(
      '5099206113503',
      antwort([['175672'], { ids: ['175672'], name: 'Webcams' }]),
    );

    expect(befund.kategorien[0].name).toBe('Webcams');
    expect(befund.kategorien[0].anzahl).toBe(2);
  });

  it('übergeht Angebote ohne verwertbare Kategorie', () => {
    const befund = werteAntwortAus('5099206113503', {
      itemSummaries: [{ title: 'Ohne Kategorie' }, { leafCategoryIds: [] }, { leafCategoryIds: ['175672'] }],
    });

    expect(befund.ausgewertet).toBe(1);
    expect(befund.kategorien[0].anteil).toBe(1);
  });

  it('kommt mit einer leeren oder unerwarteten Antwort zurecht', () => {
    for (const eingabe of [null, undefined, {}, { itemSummaries: null }, 'kaputt']) {
      const befund = werteAntwortAus('5099206113503', eingabe);
      expect(befund).toEqual({ gtin: '5099206113503', ausgewertet: 0, kategorien: [], beispielTitel: undefined });
    }
  });

  it('gibt einen Beispieltitel als Beleg zurück', () => {
    const befund = werteAntwortAus('5099206113503', antwort([{ ids: ['175672'], titel: 'Logitech MX Brio Ultra Grafit' }]));
    expect(befund.beispielTitel).toBe('Logitech MX Brio Ultra Grafit');
  });

  it('sortiert bei Gleichstand nach Kategorienummer, damit das Ergebnis reproduzierbar ist', () => {
    const befund = werteAntwortAus('5099206113503', antwort([['58058'], ['175672']]));
    expect(befund.kategorien.map((k) => k.id)).toEqual(['175672', '58058']);
  });
});
