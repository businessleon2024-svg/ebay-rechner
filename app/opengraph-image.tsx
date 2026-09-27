import { ImageResponse } from 'next/og';

/**
 * Vorschaubild für geteilte Links.
 *
 * Wird beim Bauen einmal erzeugt. Bewusst ohne externe Schriftart, damit der
 * Build nicht von einem Netzwerkabruf abhängt.
 */
export const alt = 'Gebührenkompass – Gebühren, Gewinn und Marge für eBay und Kaufland';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0c100f',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: '#2f9e6e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.46 8.92 A 9 9 0 1 1 15.08 3.54"
                stroke="#04150e"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path d="M20.6 3.4 14.26 14.26 9.74 9.74 Z" fill="#04150e" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#e7ecea' }}>
            Gebührenkompass
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 700,
              color: '#e7ecea',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            Lohnt sich dieser Verkauf wirklich?
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#9aa8a3', lineHeight: 1.4 }}>
            Gebühren, Auszahlung, Umsatzsteuer und Marge für eBay und Kaufland
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 26, color: '#6d7b77' }}>
          <div style={{ display: 'flex' }}>Beide Marktplätze</div>
          <div style={{ display: 'flex' }}>Mit Umsatzsteuer</div>
          <div style={{ display: 'flex' }}>Kostenlos</div>
        </div>
      </div>
    ),
    size,
  );
}
