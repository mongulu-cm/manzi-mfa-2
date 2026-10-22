PR #44 : exempter uniquement les PR dont l’auteur GitHub est dependabot[bot] du contrôle Infographie de la PR.
Problème : les PR Dependabot sans image échouent au contrôle.
Changement : comparer exactement user.login renvoyé par l’API GitHub ; jamais le titre, la branche ou l’acteur du workflow.
Résultat : Dependabot sans image ; infographie toujours obligatoire pour les autres auteurs Ready. Une PR humaine au même SHA reste contrôlée. Tous les autres contrôles sont conservés.
Validation locale : 132 tests réussis ; npm run check réussi.
