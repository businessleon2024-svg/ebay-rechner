'use client';

import { consentRequired, revokeConsent } from '@/lib/consent';

/**
 * Öffnet den Einwilligungsdialog erneut, indem die gespeicherte Entscheidung
 * verworfen wird. Erscheint nur, wenn es überhaupt etwas einzuwilligen gibt —
 * sonst wäre es ein Link ins Leere.
 */
export function ConsentSettingsLink({ label = 'Einwilligung' }: { label?: string }) {
  if (!consentRequired()) return null;

  return (
    <button type="button" className="linkbutton" onClick={revokeConsent}>
      {label}
    </button>
  );
}
