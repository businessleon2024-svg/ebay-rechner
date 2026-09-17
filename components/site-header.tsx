import Link from 'next/link';
import { Logo } from './logo';

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="topbar__brand" href="/" aria-label="Gebührenkompass, zur Startseite">
        <Logo />
      </Link>

      <nav className="topbar__nav" aria-label="Hauptnavigation">
        <Link href="/rechner">Rechner</Link>
        <Link href="/#tarife">Tarife</Link>
      </nav>
    </header>
  );
}
