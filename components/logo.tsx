/**
 * Bildmarke: ein Kompass, dessen Nadel durch den offenen Ring hinauszeigt.
 *
 * Der Ring ist bewusst oben rechts unterbrochen – die Nadel bricht aus, statt
 * im Kreis zu bleiben. Das ist die Aussage des Produkts: Orientierung, die zu
 * einer Entscheidung führt. Zwei Flächen, eine Linie, keine Verläufe; damit
 * bleibt die Marke bis 16 px lesbar und funktioniert einfarbig.
 */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ring mit Lücke im Nordosten */}
      <path
        d="M20.46 8.92 A 9 9 0 1 1 15.08 3.54"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Nadel, Nordhälfte: zeigt durch die Lücke nach außen */}
      <path d="M20.6 3.4 14.26 14.26 9.74 9.74 Z" fill="currentColor" />
      {/* Nadel, Südhälfte: zurückgenommen */}
      <path d="M14.26 14.26 7.76 16.24 9.74 9.74 Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

/** Bildmarke mit Schriftzug, wie sie in der Kopfzeile steht. */
export function Logo() {
  return (
    <span className="logo">
      <span className="logo__mark" aria-hidden="true">
        <LogoMark size={20} />
      </span>
      <span className="logo__word">
        Gebühren<span className="logo__word-accent">kompass</span>
      </span>
    </span>
  );
}
