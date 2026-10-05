# Politique de confidentialité — Manzi-mfa

**Brouillon à compléter et à faire valider avant publication.** Rédaction : 5 octobre 2026. Date d’entrée en vigueur : **[À RENSEIGNER APRÈS VALIDATION]**.

Ce document décrit la version actuelle de Manzi-mfa. Il ne constitue pas un avis juridique. Les mentions **[⚠️ LEGAL REVIEW REQUIRED]** signalent des points à vérifier avec un professionnel du droit de la protection des données. Les informations entre crochets doivent être renseignées avant de mettre cette politique à disposition des visiteurs comme politique applicable.

## Partie 1 — Résumé

| Sujet | Situation actuelle |
| --- | --- |
| Service | Manzi-mfa, projet du Collectif Mongulu facilitant l’accès à l’emploi IT grâce à un échange avec un senior ; cette fonctionnalité n’est pas encore ouverte sur les sites |
| Périmètre | Vitrine : https://manzi-mfa-2.mongulu.cm ; plateforme : https://app.manzi-mfa-2.mongulu.cm |
| Collecte directe | Aucun formulaire, compte, CV, message ou paiement dans les pages actuelles ; `/login` est une page d’information |
| Données techniques | Données nécessaires à l’acheminement des requêtes, à la sécurité et au diagnostic ; stockage local éventuel du thème |
| Prestataire actuel | Cloudflare pour l’hébergement, la distribution et la protection du trafic ; polices et logo servis par les sites |
| Juridictions | Pays d’établissement et publics visés à confirmer ; droit camerounais à examiner, RGPD si ses critères territoriaux sont remplis |
| Conservation | Journaux Workers : durée effective à confirmer ; préférence de thème sans expiration automatique du module, effaçable dans le navigateur ; autres durées à compléter |
| Droits | Selon le droit applicable : accès, rectification, effacement, opposition et autres droits décrits ci-dessous |
| Responsable et contact | **[DÉNOMINATION JURIDIQUE, ADRESSE, E-MAIL CONFIDENTIALITÉ À RENSEIGNER]** |

## Partie 2 — Texte de la politique

### 1. Qui est responsable de vos données ?

Manzi-mfa est présenté sous le nom Collectif Mongulu. Le responsable du traitement, c’est-à-dire la personne ou l’organisme qui détermine pourquoi et comment vos données sont utilisées, est :

- Dénomination juridique et statut : **[À RENSEIGNER]**.
- Adresse : **[À RENSEIGNER]**.
- E-mail pour la confidentialité : **[À RENSEIGNER]**.
- Pays d’établissement : **[À RENSEIGNER]**.
- Délégué à la protection des données ou représentant, lorsqu’une désignation est nécessaire : **[À CONFIRMER]**.

**[⚠️ LEGAL REVIEW REQUIRED]** Vérifier l’identité du responsable, les pays concernés et les obligations de représentation. Le nom du projet et le domaine `.cm` ne suffisent pas à établir ces éléments.

### 2. À quels services cette politique s’applique-t-elle ?

Elle couvre la consultation de la vitrine et de la plateforme aux deux adresses mentionnées dans le résumé. La plateforme affiche actuellement une présentation du futur espace connecté : elle ne permet pas encore de créer un compte ou de se connecter.

Cette version ne couvre pas des fonctions qui seraient ajoutées ultérieurement, telles que réservation, messagerie, dépôt de CV, paiement ou authentification. Nous actualiserons les informations avant leur mise en service et vous informerons au moment de la collecte.

### 3. Quelles informations sont traitées et comment ?

**Lors de la consultation.** Votre navigateur transmet des informations nécessaires à la connexion : notamment une adresse IP, l’adresse demandée et des en-têtes techniques pouvant indiquer le navigateur, la langue ou la page d’origine. Cloudflare reçoit ce trafic pour vous livrer le site et le protéger. Ces informations peuvent permettre d’identifier indirectement un visiteur.

**Pour le diagnostic.** Les journaux techniques des Workers sont activés. Ils peuvent contenir des métadonnées d’exécution, comme l’horodatage, la méthode et l’adresse de la requête, le résultat de l’exécution et les erreurs. Cela ne signifie pas que tous les en-têtes ou toutes les adresses IP sont enregistrés dans chaque journal. Évitez de placer des informations confidentielles dans les adresses de pages ou leurs paramètres.

**Dans votre navigateur.** Le module de thème peut lire ou mémoriser une préférence d’affichage sous la clé `nuxt-color-mode` dans le stockage local. Cette valeur concerne l’affichage ; ce n’est pas un identifiant de compte.

Les pages actuelles ne demandent ni nom, ni e-mail, ni mot de passe, ni CV, ni données de paiement. Elles ne demandent pas d’accès à votre localisation précise, votre caméra ou votre microphone. Aucun outil de mesure d’audience, publicité, profilage métier ou décision automatisée de recrutement n’est intégré dans le code examiné.

**[⚠️ LEGAL REVIEW REQUIRED]** Vérifier les traitements supplémentaires qui pourraient être activés dans le tableau de bord Cloudflare ou dans des services administrés hors du dépôt. Si un canal de contact est ouvert, préciser les données de correspondance, le prestataire de messagerie et la durée de conservation ; aucun formulaire de contact n’existe actuellement sur ces pages.

### 4. Pourquoi utilisons-nous ces informations ?

Les finalités actuelles sont de livrer les pages et leurs ressources, préserver leur disponibilité, protéger les sites contre les requêtes abusives et diagnostiquer les erreurs techniques. La préférence d’affichage sert à assurer un rendu cohérent dans votre navigateur.

Le code actuel ne transmet pas les données à des annonceurs et ne comporte pas de mécanisme de vente de données. Les informations techniques ne servent pas à évaluer votre aptitude à un emploi ni à vous attribuer un mentor.

**[⚠️ LEGAL REVIEW REQUIRED]** Confirmer ces engagements à l’échelle de l’organisme et de ses prestataires avant publication. Ils ne décrivent pas les traitements d’autres projets du collectif.

### 5. Sur quelle base juridique ?

**[⚠️ LEGAL REVIEW REQUIRED]** Les bases juridiques doivent être validées pour chaque finalité selon la législation applicable. Si le RGPD s’applique, l’intérêt légitime à assurer la disponibilité et la sécurité du site est une base envisagée pour les traitements techniques, sous réserve d’une analyse de nécessité, de proportionnalité et de vos droits. Une obligation légale ne pourra être invoquée que si un texte précis l’impose.

La simple visite du site n’est pas considérée comme un consentement général au traitement de vos données. Si des traceurs non nécessaires sont ajoutés et nécessitent un consentement, ils devront attendre votre choix. Il n’existe pas actuellement de traitement fondé sur un contrat de compte utilisateur, puisqu’aucun compte ne peut être créé.

### 6. Qui peut recevoir ces informations ?

Les personnes habilitées à administrer le service peuvent consulter les journaux pour le diagnostic et la sécurité. Cloudflare intervient pour l’hébergement et le traitement technique du trafic. Les données pourront également être communiquées à une autorité lorsque le droit applicable impose une communication valable et proportionnée.

Les polices Alegreya et Hanken Grotesk et le logo sont servis par nos sites : leur chargement ne nécessite pas de requête vers Google Fonts. Supabase n’est pas utilisé par les pages ou les endpoints actuels pour collecter des données de visiteurs ; sa présence dans l’environnement de développement ne constitue pas une intégration du service en production.

**[⚠️ LEGAL REVIEW REQUIRED]** Confirmer l’entité Cloudflare contractante, les rôles respectifs, l’accord de sous-traitance applicable et la liste des sous-traitants ultérieurs. Voir l’[accord de traitement des données de Cloudflare](https://www.cloudflare.com/cloudflare-customer-dpa/) et sa [politique de confidentialité](https://www.cloudflare.com/privacypolicy/).

### 7. Les données quittent-elles votre pays ?

Cloudflare exploite une infrastructure internationale. Des traitements peuvent avoir lieu dans d’autres pays que votre pays de résidence. Nous ne garantissons pas, dans ce brouillon, une conservation exclusivement au Cameroun ou dans l’Union européenne.

**[⚠️ LEGAL REVIEW REQUIRED]** Identifier les lieux de traitement, les flux et les garanties réellement applicables. Lorsque le RGPD s’applique, vérifier les conditions des transferts hors de l’Espace économique européen, notamment les clauses contractuelles types ou un autre mécanisme valable, et les évaluations nécessaires. Les obligations camerounaises doivent également être examinées. Préciser comment obtenir des informations ou une copie des garanties pertinentes auprès du contact indiqué en section 1.

### 8. Combien de temps les informations sont-elles conservées ?

| Données | Durée à indiquer dans la version publiée |
| --- | --- |
| Journaux d’exécution Workers consultables dans Cloudflare | **[DURÉE EFFECTIVE À CONFIRMER DANS L’OFFRE ET LES RÉGLAGES]** |
| Autres données de sécurité ou de trafic traitées par Cloudflare | **[CATÉGORIES ET DURÉES CONTRACTUELLES À CONFIRMER]** ; ne pas leur appliquer automatiquement la durée des journaux Workers |
| Préférence locale `nuxt-color-mode`, si mémorisée | Pas d’expiration automatique configurée par le module ; jusqu’à suppression des données du site par le navigateur ou remplacement de la préférence |
| Demandes d’exercice de droits et justificatifs éventuels | **[DURÉE À DÉFINIR]**, limitée à la gestion de la demande et à la preuve nécessaire de son traitement |

Aucune durée de conservation de compte, CV, réservation ou paiement n’est applicable aux fonctions actuelles. Ces durées devront être définies avant d’ouvrir les fonctions correspondantes.

**[⚠️ LEGAL REVIEW REQUIRED]** Renseigner les durées, les justifications et les règles de suppression. Ne pas promettre la suppression immédiate de toutes les copies ou de tous les traitements d’un prestataire sans vérifier sa procédure.

### 9. Cookies, stockage local et choix du navigateur

Le code applicatif examiné ne dépose pas de cookie publicitaire ou de mesure d’audience. Le stockage local éventuel du thème est distinct d’un cookie et contient une préférence d’affichage.

Cloudflare peut utiliser des cookies de sécurité selon les protections activées. Leur présence sur ces domaines, leurs noms et leurs durées doivent être vérifiés : la liste générale des cookies Cloudflare ne signifie pas qu’ils sont tous utilisés ici. Sa [documentation sur les cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/) décrit leurs fonctions.

Vous pouvez effacer les cookies et le stockage local des deux domaines dans les paramètres de votre navigateur. Certains mécanismes de sécurité ou préférences d’affichage peuvent alors être réinitialisés. Il n’existe pas de choix publicitaire à gérer dans l’application actuelle.

**[⚠️ LEGAL REVIEW REQUIRED]** Finaliser l’inventaire réel des traceurs et leur qualification juridique. Tout futur traceur soumis au consentement doit être bloqué avant acceptation, permettre un refus aussi simple que l’acceptation et un retrait ultérieur. La navigation seule ne vaut pas acceptation.

### 10. Quels sont vos droits et comment les exercer ?

**[⚠️ LEGAL REVIEW REQUIRED]** Selon la législation applicable et les conditions prévues par celle-ci, vous pouvez demander l’accès à vos données, leur rectification ou leur effacement et vous opposer à certains traitements. Si le RGPD s’applique, les droits à la limitation et à la portabilité peuvent également s’appliquer ; la portabilité dépend notamment de la base juridique et de la nature du traitement. Un consentement peut être retiré lorsqu’il constitue la base du traitement.

Adressez votre demande à **[E-MAIL CONFIDENTIALITÉ À RENSEIGNER]**, en indiquant le site concerné, votre demande et les éléments permettant de retrouver les informations pertinentes. Nous ne demandons pas systématiquement une copie d’identité ; un complément proportionné peut être nécessaire en cas de doute raisonnable sur votre identité.

Si le RGPD s’applique, une réponse doit intervenir en principe dans un mois. Une prolongation jusqu’à deux mois supplémentaires peut être nécessaire dans les conditions prévues par ce règlement et doit être expliquée dans le premier mois. Pour les autres régimes, **[DÉLAIS APPLICABLES À VALIDER]**.

Vous pouvez saisir l’autorité de protection des données compétente. Si le RGPD s’applique, cela peut notamment être l’autorité du pays de votre résidence habituelle, de votre lieu de travail ou du lieu de la violation alléguée. **[AUTORITÉ CAMEROUNAISE ET COORDONNÉES OPÉRATIONNELLES À CONFIRMER]**. Les coordonnées de Cloudflare ne remplacent pas notre propre contact pour vos demandes.

### 11. Sécurité

Les deux sites sont accessibles en HTTPS, qui chiffre le transport entre votre navigateur et le point de terminaison du service. Cloudflare assure l’hébergement et des protections du trafic. Nous limitons les informations demandées par les pages actuelles, qui ne comportent aucun formulaire de collecte.

**[⚠️ LEGAL REVIEW REQUIRED]** Confirmer les contrôles d’accès administratifs, les procédures d’incident, la gestion des journaux et les mesures contractuelles. Ce texte ne garantit ni audits réguliers, ni chiffrement de toute donnée au repos, ni procédure de notification déjà opérationnelle sans preuve. Aucun système ne garantit une sécurité absolue.

### 12. Mineurs et informations sensibles

Les pages actuelles ne demandent ni âge ni information sensible. Aucun mécanisme de vérification d’âge ou d’autorisation parentale n’y est intégré. La collecte technique liée à une visite peut néanmoins concerner un mineur.

**[⚠️ LEGAL REVIEW REQUIRED]** Déterminer les publics autorisés et les règles applicables avant l’ouverture des comptes ou du mentorat. Ne pas fixer un âge minimal arbitraire. Les règles spécifiques aux mineurs, y compris celles de pays ciblés, et tout traitement futur de données sensibles doivent être évalués avant sa mise en œuvre.

### 13. Changements et liens vers d’autres services

La date et la version de cette politique seront mises à jour lors de changements. Une nouvelle finalité ou une nouvelle collecte fera l’objet d’une information adaptée avant sa mise en œuvre et, lorsque cela est requis, d’un nouveau choix ou consentement. Nous ne promettons pas une notification par e-mail tant qu’aucun service de comptes ou de notifications n’existe.

Les deux sites Manzi-mfa sont couverts par ce même texte. Les sites tiers ouverts à partir de liens, dont les sources juridiques et les documents Cloudflare, appliquent leurs propres informations de confidentialité. Ce constat ne supprime pas nos obligations concernant les traitements dont nous sommes responsables.

## Partie 3 — Personnalisation et validation

### État de l’inventaire technique

Examen du 5 octobre 2026 : pages et configurations de `apps/vitrine`, `apps/plateforme` et `layers/mongulu`, ainsi que les pages publiques des deux domaines. Le dépôt n’est pas indexé dans le service codebase-memory ; les constats reposent sur les sources lues directement. Cet examen ne constitue pas un audit exhaustif des paramètres Cloudflare ou des pratiques de l’organisme.

- Les deux `wrangler.jsonc` activent `observability.enabled` ; le compte-rendu de configuration précédent indique des journaux d’invocation activés et aucune destination d’export configurée à ce moment-là. Recontrôler ces réglages avant publication.
- Le module de thème utilise par défaut `localStorage` et la clé `nuxt-color-mode`. La configuration commune choisit un affichage clair ; aucune interface de changement de thème n’est présente actuellement. Vérifier sa persistance réelle dans un navigateur neuf.
- Les polices sont installées avec Fontsource et la configuration désactive le chargement de polices par Nuxt UI ; aucun appel métier à Supabase n’apparaît dans le code des applications examiné.
- Les durées documentées au 5 octobre 2026 sont de 3 jours pour Workers Logs en offre Free et 7 jours en offre Paid. Cela ne couvre pas tous les traitements Cloudflare. La documentation annonce un changement au 1er décembre 2026 : revalider la durée effective à la publication et après un changement d’offre. Source : [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

### Droit applicable à examiner

**[⚠️ LEGAL REVIEW REQUIRED]** La [loi camerounaise n° 2024/017 du 23 décembre 2024](https://www.prc.cm/fr/actualites/actes/lois/7588-loi-n-2024-017-du-23-decembre-2024-autorisant-le-president-de-la-republique-a-ratifier-le-traite-de-beijing-sur-les-interpretations-et-executions-audiovisuelles-adopte-le-24-juin-2012-a-beijing-chine-9) doit être examinée avec ses modalités d’application, formalités et éventuelles dispositions transitoires. Le titre du document officiel concerne bien la protection des données malgré son adresse longue.

Le [champ territorial du RGPD, article 3](https://www.cnil.fr/reglement-europeen-protection-donnees/chapitre1), dépend notamment de l’établissement, du ciblage de personnes dans l’Union ou du suivi de leur comportement. Une simple accessibilité depuis l’Europe ne suffit pas, à elle seule, à conclure. Le consentement n’est pas la seule base juridique possible. Les obligations d’information et les modalités d’exercice des droits sont décrites dans le [chapitre III du RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3).

Une présence de visiteurs californiens ne suffit pas non plus à présumer l’application du CCPA/CPRA : examiner les critères légaux si ce marché est visé. Ne pas ajouter des clauses HIPAA, de paiement ou de vente de données qui ne correspondent pas au service. Réévaluer les lois concernées si les pays ciblés ou les fonctions changent.

### Décisions avant publication

- [ ] Renseigner le responsable juridique, son adresse, les pays ciblés et un contact fonctionnel.
- [ ] Faire relire et valider le texte final par un juriste spécialisé ; renseigner la date d’entrée en vigueur après validation.
- [ ] Vérifier les réglages Cloudflare effectifs, les journaux, leurs champs, les cookies, la rétention et toute mesure d’audience activée hors du code.
- [ ] Confirmer le contrat de traitement, les sous-traitants, les transferts et les garanties ; examiner les formalités camerounaises et les obligations européennes si applicables.
- [ ] Documenter les bases juridiques, les habilitations, la suppression et les réponses aux demandes ; vérifier les délais et l’autorité compétente.
- [ ] Évaluer la nécessité d’un délégué, d’un représentant ou d’une analyse d’impact selon les traitements réellement envisagés, sans les présenter comme systématiquement obligatoires.
- [ ] Définir les règles relatives aux mineurs avant l’ouverture du service.
- [ ] Remplacer toutes les mentions à compléter et retirer les notes de travail de la version publique validée.
- [ ] Publier cette version validée via une page accessible depuis le pied de page des deux applications.
- [ ] Actualiser la politique et l’inventaire avant d’activer comptes, Supabase, réservation, messagerie, CV, statistiques ou paiement.

Ce fichier est une source de rédaction conservée dans le dépôt. Il n’est ni servi comme page de l’application, ni présenté aux visiteurs comme une politique entrée en vigueur.
