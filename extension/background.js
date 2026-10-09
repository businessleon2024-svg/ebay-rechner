/*
  Lässt einen Klick auf das Symbol das Seitenpanel öffnen.

  Ohne diese Zeile passiert beim Klick nichts: Ein Manifest ohne
  `default_popup` hat sonst keine Wirkung, und das Panel ließe sich nur über
  das Seitenpanel-Menü von Chrome erreichen — dort sucht es niemand.

  `setPanelBehavior` gibt ein Versprechen zurück, das fehlschlagen kann (etwa
  in zu alten Chrome-Fassungen). Unbehandelt stünde dafür bei jedem Start ein
  Fehler in der Erweiterungsliste.
*/
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((fehler) => console.error('Seitenpanel lässt sich nicht öffnen:', fehler));
