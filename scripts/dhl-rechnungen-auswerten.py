#!/usr/bin/env python3
"""
Liest DHL-Rechnungen (PDF) aus und leitet daraus die Preisstaffel ab.

## Wofür das hier liegt

Die Preise in `lib/shipping/dhl.ts` stammen aus 345 echten Rechnungen, nicht
aus einer Preisliste. Ohne dieses Skript wäre diese Herkunft eine Behauptung:
Niemand könnte sie nachprüfen, und niemand könnte die Tabelle fortschreiben,
wenn DHL die Preise wieder ändert.

## Benutzung

    python3 scripts/dhl-rechnungen-auswerten.py ~/Downloads/*.pdf

Ausgegeben wird je Gewichtsstufe der abgerechnete Einzelpreis mit der Anzahl
der Sendungen, dazu eine Aufschlüsselung nach Rechnungsmonat. Die zweite ist
die wichtigere: An ihr war der Preiswechsel zum Jahreswechsel 2025/26
überhaupt erst zu erkennen — bis Dezember 5,05 € für die 1-kg-Stufe, ab
Januar 5,00 €.

## Warum ohne Fremdbibliothek

Die Textextraktion ist hier mit `zlib` und regulären Ausdrücken gebaut statt
mit einer PDF-Bibliothek. Das ist nicht elegant, hat aber einen Grund: Das
Skript soll laufen, ohne dass jemand erst etwas installieren muss. DHLs
Rechnungen sind maschinell erzeugt und immer gleich aufgebaut — die
Vereinfachung trägt für genau diese Dateien und wäre für beliebige PDFs
unzureichend.
"""

import collections
import re
import sys
import zlib

# Textoperatoren: "<hex> Tj" setzt Text, "x y Td" setzt die Schreibmarke.
# Die Y-Lage braucht es, um Zeilen wieder zusammenzusetzen — im Datenstrom
# steht jedes Textstück einzeln, ohne Zeilenbegriff.
OPERATOR = re.compile(rb'([\d.]+)\s+([\d.]+)\s+Td|<([0-9A-Fa-f]*)>\s*Tj')

# "DHL PAKET (GK) 6 kg 7  C1 60,90" — Gewicht, Stückzahl, Gesamtbetrag.
POSITION = re.compile(r'DHL PAKET \(GK\) ([\d,]+) kg\s+(\d+)\s+C1\s+([\d.]+,\d\d)')
DATUM = re.compile(r'Rechnungsdatum:\s*(\d\d)\.(\d\d)\.(\d{4})')


def seiten_text(pfad):
    """Zeilen einer PDF-Rechnung, von oben nach unten."""
    daten = open(pfad, 'rb').read()
    stuecke = []

    for treffer in re.finditer(rb'stream\r?\n(.*?)\r?\nendstream', daten, re.S):
        try:
            strom = zlib.decompress(treffer.group(1))
        except zlib.error:
            # Nicht jeder Strom ist Text — Schriften und Bilder liegen
            # daneben und lassen sich nicht auspacken. Übergehen.
            continue
        if b'Tj' not in strom:
            continue

        x = y = 0.0
        for op in OPERATOR.finditer(strom):
            if op.group(3) is not None:
                text = bytes.fromhex(op.group(3).decode()).decode('latin-1')
                stuecke.append((round(y, 1), x, text))
            else:
                x, y = float(op.group(1)), float(op.group(2))

    # Nach Y absteigend (Seite von oben), innerhalb der Zeile nach X.
    stuecke.sort(key=lambda s: (-s[0], s[1]))

    zeilen, letztes_y = [], None
    for y, _x, text in stuecke:
        # 1,5 Punkte Toleranz: Hoch- und Tiefstellungen sitzen minimal
        # versetzt, gehören aber in dieselbe Zeile.
        if letztes_y is None or abs(y - letztes_y) > 1.5:
            zeilen.append(text)
            letztes_y = y
        else:
            zeilen[-1] += ' ' + text
    return zeilen


def euro(text):
    """„1.234,56" → 1234.56"""
    return float(text.replace('.', '').replace(',', '.'))


def auswerten(pfade):
    gesamt = collections.defaultdict(collections.Counter)
    nach_monat = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    gelesen = 0

    for pfad in pfade:
        try:
            zeilen = seiten_text(pfad)
        except Exception as fehler:  # noqa: BLE001 - defekte Datei soll den Lauf nicht beenden
            print(f'  übersprungen: {pfad} ({fehler})', file=sys.stderr)
            continue
        gelesen += 1

        monat = None
        for zeile in zeilen:
            treffer = DATUM.search(zeile)
            if treffer:
                monat = f'{treffer.group(3)}-{treffer.group(2)}'
                break

        for zeile in zeilen:
            for pos in POSITION.finditer(zeile):
                kg = pos.group(1).replace(',', '.')
                anzahl = int(pos.group(2))
                if not anzahl:
                    continue
                # Der Einzelpreis steht nicht in der Zeile — nur Summe und
                # Stückzahl. Teilen statt raten.
                einzeln = round(euro(pos.group(3)) / anzahl, 2)
                gesamt[kg][einzeln] += anzahl
                if monat:
                    nach_monat[monat][kg][einzeln] += anzahl

    return gelesen, gesamt, nach_monat


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        return 1

    gelesen, gesamt, nach_monat = auswerten(sys.argv[1:])
    print(f'{gelesen} Rechnungen gelesen\n')

    print('Gewicht | abgerechneter Einzelpreis (Sendungen)')
    for kg in sorted(gesamt, key=float):
        verteilung = ', '.join(f'{p:.2f} € ×{n}' for p, n in gesamt[kg].most_common())
        print(f'{kg:>6} kg | {verteilung}')

    print('\nNach Rechnungsmonat — hier werden Preiswechsel sichtbar:')
    for monat in sorted(nach_monat):
        teile = [
            f'{kg}kg={nach_monat[monat][kg].most_common(1)[0][0]:.2f}'
            for kg in sorted(nach_monat[monat], key=float)
        ]
        print(f'  {monat}  {"  ".join(teile)}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
