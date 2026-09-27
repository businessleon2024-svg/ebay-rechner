import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className="hero">
        <p className="notfound__code">404</p>
        <h1 className="hero__title">Diese Seite gibt es nicht.</h1>
        <p className="hero__subtitle">
          Möglicherweise hat sich die Adresse geändert oder ein Link zeigt ins Leere. Der Rechner
          und die Gebührenübersicht sind weiterhin da.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary btn--lg" href="/rechner">
            Zum Rechner
          </Link>
          <Link className="btn btn--ghost btn--lg" href="/gebuehren">
            Gebührenübersicht
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
