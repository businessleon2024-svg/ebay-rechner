'use client';

import { useSyncExternalStore } from 'react';

export const THEME_KEY = 'ebayCalc.theme';

export type Theme = 'light' | 'dark';

/**
 * Setzt das Thema vor dem ersten Rendern, damit die Seite nicht kurz in der
 * falschen Helligkeit aufblitzt. Läuft als Inline-Skript im <head>, deshalb
 * bewusst ohne Abhängigkeiten und in einer Zeile lesbar gehalten.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('themechange', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('themechange', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Serverseitig ist die Systemeinstellung unbekannt; das Skript korrigiert es. */
const getServerSnapshot = (): Theme => 'light';

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={next === 'dark' ? 'Zu dunkler Ansicht wechseln' : 'Zu heller Ansicht wechseln'}
      title={next === 'dark' ? 'Dunkle Ansicht' : 'Helle Ansicht'}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z" />
        </svg>
      )}
    </button>
  );
}
