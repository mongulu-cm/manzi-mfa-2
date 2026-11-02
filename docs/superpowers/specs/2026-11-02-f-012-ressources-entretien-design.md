# Spécification de conception — F-012 : Consulter des ressources d’entretien qualifiées

- **Feature ID** : `F-012`
- **Issue** : [mongulu-cm/manzi-mfa-2#11](https://github.com/mongulu-cm/manzi-mfa-2/issues/11)
- **Epic** : E-004 — Job Board et Ressources
- **Vague** : 1
- **Exigences sources** : `R-020`
- **Éléments d’architecture** : `AR-003`, `AR-005`, `AR-007`, `AR-008`
- **Date** : 2026-11-02
- **Statut** : Proposition validée (canal, source des données et sélection)

---

## 1. Contexte et objectif

Un visiteur doit trouver une sélection qualifiée de services externes pour préparer ses entretiens techniques et y accéder, sans confondre cette section avec une fonctionnalité de Manzi-mfa. Les entretiens blancs générés par IA sont hors périmètre (issue).

### Décisions prises

| Question | Décision | Raison |
| --- | --- | --- |
| Canal | **Vitrine publique**, page `/ressources` rendue en SSR et indexable | L’issue vise « un visiteur » ; aucune donnée de compte n’est nécessaire |
| Source des données | **Fichier typé versionné** dans la vitrine, modifié par PR | Pas de table de ressources aujourd’hui ; F-013 (Vague 3) ajoutera proposition, modération et statut `publiée` en base |
| Contenu initial | Sélection proposée et validée (§ 3) | Le design fonctionnel et la maquette Stitch ne sont pas accessibles sans compte |

### Critères d’acceptation et réponse apportée

| Critère (issue #11) | Réponse de conception |
| --- | --- |
| Ressources qualifiées avec titre, description et lien externe | Carte par ressource : titre, description, catégorie, langue, domaine et lien (§ 4) |
| Distinction claire entre ressource externe et fonctionnalité Manzi-mfa | Badge « Ressource externe », domaine affiché, icône et libellé accessible de lien externe, encadré explicatif en tête de page (§ 4.2) |
| Liens invalides ou indisponibles gérés | Validation stricte du fichier en test unitaire (CI) ; vérification réseau opt-in hors CI ; lien « Signaler un lien cassé » (§ 5) |
| Consultation sur le site public ou la PWA | Vitrine publique en SSR, responsive dès 320 px (§ 4) |

### Hors périmètre

- Proposition, modération, publication et dépublication de ressources (F-013, Vague 3).
- Recherche plein texte, favoris, notes ou avis.
- Toute génération de contenu ou d’entretien par IA.

---

## 2. Modèle de données

```ts
type ResourceCategory = 'methode' | 'entretiens-blancs' | 'algorithmique' | 'conception-systemes' | 'front-end' | 'pratique' | 'parcours'
type ResourceLanguage = 'fr' | 'en'

interface InterviewResource {
  id: string // slug stable, unique
  title: string
  description: string // français, une phrase, sans promesse commerciale
  url: string // HTTPS, sans identifiant, mot de passe ni paramètre de suivi
  category: ResourceCategory
  language: ResourceLanguage
}
```

- Fichier : `apps/vitrine/app/data/interview-resources.ts` (données) et `apps/vitrine/app/utils/interview-resources.ts` (types, libellés des catégories, `validateResources`, `resourceDomain`).
- Le contrat est celui que F-013 exposera pour les ressources `publiée` : la page ne dépend que d’une liste d’`InterviewResource`, la source pourra devenir une table sans modifier l’affichage.
- Aucune information non vérifiée (prix, gratuité, popularité) n’est publiée.

---

## 3. Sélection initiale

Liens vérifiés le 2026-11-02 par requête HTTP.

| Ressource | Catégorie | Langue | Lien |
| --- | --- | --- | --- |
| Tech Interview Handbook | Méthode | en | https://www.techinterviewhandbook.org/ |
| interviewing.io | Entretiens blancs | en | https://interviewing.io/ |
| Pramp | Entretiens blancs | en | https://www.pramp.com/ |
| NeetCode Roadmap | Algorithmique | en | https://neetcode.io/roadmap |
| LeetCode | Algorithmique | en | https://leetcode.com/ (403 aux robots, accessible en navigateur) |
| System Design Primer | Conception de systèmes | en | https://github.com/donnemartin/system-design-primer |
| Front End Interview Handbook | Front-end | en | https://www.frontendinterviewhandbook.com/ |
| Exercism | Pratique | en | https://exercism.org/ |
| roadmap.sh | Parcours | en | https://roadmap.sh/ |

---

## 4. Page `/ressources`

### 4.1 Structure

1. **En-tête** : titre H1 « Ressources pour préparer vos entretiens », introduction courte.
2. **Encadré « Ressources externes »** (`UAlert`, ton neutre) : ces services sont édités par des tiers, recommandés par le collectif ; Manzi-mfa ne génère pas d’entretiens par IA ; leurs conditions et confidentialité s’appliquent.
3. **Groupes par catégorie** : H2 par catégorie, grille de cartes (`grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3`, gap `20px`, cartes conformes à `DESIGN.md` : fond blanc, bordure `#D9D9D9`, rayon `16px`, sans ombre).
4. **Pied de section** : « Un lien ne fonctionne plus ? » → `mailto:collectif@mongulu.cm` avec sujet prérempli.

### 4.2 Carte de ressource (`ResourceCard`)

- Titre (H3, Alegreya), description, badges `UBadge` : « Ressource externe » et langue (« En anglais » / « En français »).
- Domaine affiché (ex. `exercism.org`) : le visiteur sait où il va.
- Lien `ULink` externe : libellé visible « Consulter la ressource », nom accessible « Consulter <titre> sur <domaine> (site externe) », icône `i-lucide-external-link` décorative (`aria-hidden`), `rel="noopener noreferrer"`, `target="_blank"` annoncé dans le nom accessible.
- Cible tactile ≥ 44 × 44 px, focus visible, pas d’état transmis par la seule couleur.

### 4.3 Navigation et SEO

- Lien « Ressources » dans l’en-tête de la vitrine (`SiteHeaderActions`) et dans le pied de page.
- `useSeoMeta` : titre et description propres ; page incluse dans le rendu SSR.

---

## 5. Liens invalides ou indisponibles

| Niveau | Mécanisme | Effet |
| --- | --- | --- |
| Contenu (CI) | `validateResources` testé unitairement : champs requis, `id` uniques, URL `https:` sans identifiant ni `utm_*`/`ref`, URL et titres uniques, catégorie et langue connues | Une ressource invalide fait échouer la CI ; elle n’est jamais publiée |
| Rendu | La page n’affiche que des ressources validées ; une catégorie vide n’est pas rendue | Pas de section vide |
| Disponibilité (opt-in, hors CI) | `npm run test:resource-links` : requête GET avec délai, classe `ok` (2xx/3xx), `à vérifier` (401, 403, 429 : protections anti-robot), `cassé` (404, 410, 5xx, erreur réseau) | Rapport pour décider d’une PR de correction ; aucune requête réseau en CI |
| Visiteur | Lien « Signaler un lien cassé » vers le collectif | Remontée humaine des liens morts |

---

## 6. Tests

| Niveau | Contenu |
| --- | --- |
| Unitaires (`tests/unit/interview-resources.test.ts`) | Données réelles valides ; un cas invalide par règle ; `resourceDomain` ; groupement par catégorie dans l’ordre défini |
| Stories (`apps/vitrine/stories/resources/`) | `ResourceCard` : défaut, titre et description longs, ressource en français ; section complète ; mobile ; axe a11y |
| E2E (`tests/e2e/sites.test.mjs`) | `/ressources` en SSR (titre, encadré, toutes les cartes), noms accessibles des liens externes, lien depuis l’en-tête et le pied de page, clavier, 320 px et desktop |
| Smoke opt-in | `npm run test:resource-links` sur la sélection réelle |

Seuils de couverture existants inchangés.

---

## 7. Confidentialité

Aucune donnée collectée. Les liens externes portent `noreferrer` : l’adresse de la page Manzi-mfa n’est pas transmise aux services tiers. Le texte public de `PRIVACY.md` mentionne déjà que les services tiers appliquent leurs propres politiques ; aucune mise à jour nécessaire.

---

## 8. Décisions à confirmer

1. **Libellé de navigation** — « Ressources » dans l’en-tête et le pied de page.
2. **Ressources francophones** — à ajouter dès qu’une page précise et pérenne est identifiée.
3. **Fréquence de vérification des liens** — proposition : avant chaque PR de contenu et une fois par mois.
