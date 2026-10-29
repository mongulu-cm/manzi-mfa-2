# Guides d’installation de la PWA

Sources officielles consultées le **28 octobre 2026**. Les pages retenues ont été ouvertes et leur contenu lu, avec une réponse HTTP 200. Les procédures ci-dessous alimentent l’aide affichée après un clic sur le bouton mobile lorsqu’aucune proposition native n’est disponible, ou après un refus/échec.

## Procédures retenues

| Navigateur et système | Procédure documentée | Source |
| --- | --- | --- |
| Chrome Android | Plus (⋮) → Installer et créer un raccourci → Installer, puis suivre les instructions à l’écran. | [Aide Google Chrome, Android](https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DAndroid) |
| Chrome iPhone/iPad | Partager à droite de la barre d’adresse → Ajouter à l’écran d’accueil → vérifier le nom → Ajouter. | [Aide Google Chrome, iOS](https://support.google.com/chrome/answer/9658361?hl=fr&co=GENIE.Platform%3DiOS) |
| Firefox Android | Ouvrir le menu ⋮, choisir l’ajout à l’écran d’accueil, puis utiliser le panneau Android : Ajouter automatiquement ou faire glisser l’icône. | [Mozilla, Use Web Apps with Firefox for Android](https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android) |
| Firefox iOS | Partager dans la barre d’adresse → ajout à l’écran d’accueil → vérifier le nom → Ajouter. | [Mozilla, Add a website shortcut to your home screen on iOS](https://support.mozilla.org/en-US/kb/add-website-shortcut-your-home-screen-ios) |
| Safari iPhone | Menu de la page → Partager, ou bouton Partager selon la disposition → Sur l’écran d’accueil → Ouvrir comme app web → Ajouter. | [Apple, Transformer un site web en app](https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios) |

Sur Safari, l’aide mentionne « Ouvrir comme app web » si cette option apparaît, pour rester utilisable avec les versions antérieures. Le guide Apple indique aussi comment ajouter l’action « Sur l’écran d’accueil » lorsqu’elle manque dans la feuille de partage.

La page Mozilla Android consultée omet le libellé de l’action à son étape 4. Le [code officiel Firefox Android](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/values/strings.xml) contient les libellés anglais `Add to Home screen` et `Add app to Home screen`. Le texte français décrit donc l’action sans inventer un libellé de menu « Installer ». Les deux liens Mozilla retenus concernent Firefox ; la page proche « Add web page shortcuts to your Home screen » concerne Firefox Focus et n’est pas utilisée.

## Edge et navigateurs sans procédure mobile vérifiée

Les pages Microsoft consultées décrivent l’installation et la gestion sur ordinateur :

- [Installer, gérer ou désinstaller des applications dans Microsoft Edge](https://support.microsoft.com/fr-fr/edge/install-manage-or-uninstall-apps-in-microsoft-edge).
- [Use Progressive Web Apps (PWAs) in Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/ux), mise à jour affichée : 10 mars 2026.

Ces pages ne permettent pas de confirmer une séquence de menus pour Edge Android/iOS. L’aide de repli dirige donc explicitement vers la procédure vérifiée de Chrome sur Android ou de Safari sur iOS, avec le lien et le nom du navigateur de destination. La proposition native d’Edge, lorsqu’elle est fournie, reste prioritaire.

## Déclenchement natif et limites de validation

La [documentation MDN de `beforeinstallprompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event), mise à jour affichée : 26 octobre 2026, confirme le parcours utilisé : conserver l’événement fourni par le navigateur, puis appeler sa méthode `prompt()` au clic. Elle précise qu’aucun instant d’émission n’est garanti et que l’API a une disponibilité limitée.

L’aide reste masquée sur desktop. La mise à jour des procédures ne modifie pas le déclenchement natif, le cache, les sessions ou les préférences du navigateur. Les tests vérifient la sélection du texte et du lien selon le navigateur et le système, ainsi que la priorité de la proposition native. La consultation des documentations et les tests simulés ne valident pas l’installation sur un appareil physique.
