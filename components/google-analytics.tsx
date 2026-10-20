'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { readConsent } from '@/lib/consent';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics (Leon-Vorgabe, 2026-10-19: "eine Auswertung bekomme, wie
 * oft meine Seite geklickt wird, wie viele Minuten/Sekunden gesurft wurde").
 *
 * Lädt NICHTS, solange keine `analytics`-Einwilligung vorliegt — reagiert auf
 * dasselbe `consentchange`-Event wie `ConsentBanner`. Ohne gesetzte
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` rendert die Komponente nichts (Leon muss
 * dafür selbst eine GA4-Property unter analytics.google.com anlegen —
 * Google-Konto/Property-Erstellung ist nicht delegierbar).
 */
export function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(readConsent()?.decision.analytics === true);
    sync();
    window.addEventListener('consentchange', sync);
    return () => window.removeEventListener('consentchange', sync);
  }, []);

  if (!GA_MEASUREMENT_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
