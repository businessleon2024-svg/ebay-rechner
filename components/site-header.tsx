import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="topbar__brand" href="/">
        <span className="topbar__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9" />
            <path d="M3 12h6" />
            <path d="M13.5 8.5c1.8 0 2.8 1.1 2.8 2.6 0 1.9-1.6 2.3-2.8 2.9-1 .5-1.7 1-1.7 2" />
            <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span>
          <span className="topbar__title">Gebührenrechner</span>
          <span className="topbar__subtitle">eBay Provision, Umsatzsteuer &amp; Marge</span>
        </span>
      </Link>

      <nav className="topbar__nav" aria-label="Hauptnavigation">
        <Link href="/rechner">Rechner</Link>
        <Link href="/#tarife">Tarife</Link>
      </nav>
    </header>
  );
}
