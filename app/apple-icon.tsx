import { ImageResponse } from 'next/og';

/**
 * Symbol für den iOS-Startbildschirm.
 *
 * iOS liest kein `purpose: maskable` aus dem Manifest und legt stattdessen
 * selbst abgerundete Ecken an. Deshalb ein eigenes Symbol: randlos gefüllt,
 * die Nadel mittig und weit genug innen, damit die Rundung sie nicht trifft.
 *
 * 180 × 180 ist die Größe, die Apple für aktuelle Geräte erwartet.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Dieselbe Kompassnadel wie in `components/logo.tsx`, in Weiß. */
const MARKE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="112" height="112" fill="none">
<path d="M20.46 8.92 A 9 9 0 1 1 15.08 3.54" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>
<path d="M20.6 3.4 14.26 14.26 9.74 9.74 Z" fill="#ffffff"/>
<path d="M14.26 14.26 7.76 16.24 9.74 9.74 Z" fill="#ffffff" opacity="0.4"/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // --accent aus globals.css, heller Modus.
          background: '#10714e',
        }}
      >
        <img
          width={112}
          height={112}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(MARKE)}`}
        />
      </div>
    ),
    size,
  );
}
