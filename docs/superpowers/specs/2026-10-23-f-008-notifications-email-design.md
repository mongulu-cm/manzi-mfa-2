# Spécification de conception — F-008 : Notifier les participants par email

- **Feature ID** : `F-008`
- **Issue** : [mongulu-cm/manzi-mfa-2#10](https://github.com/mongulu-cm/manzi-mfa-2/issues/10)
- **Epic** : E-003 — Quick Chat
- **Vague** : 1
- **Exigences sources** : `R-047`, `R-053`
- **Éléments d’architecture** : `AR-001`, `AR-007`, `AR-010`, `AR-013`
- **Fournisseur d’envoi** : Cloudflare Email Service — bloc « Emails notifications (Cloudflare) » du [schéma d’architecture](https://excalidraw.com/#room=f17469760dd1911404bd,5M2wWCDP2uLqjd_XvCQhxw) lié à l’issue
- **Date** : 2026-10-23
- **Statut** : Proposition à valider

---

## 1. Contexte et objectif

Lorsqu’un Quick Chat est créé ou modifié, le mentor et le mentoré doivent recevoir un email qui identifie l’échange, donne son horaire et indique l’action attendue.

Le Quick Chat lui-même n’existe pas encore : la réservation relève de F-007 (#25) et aucune table `quick_chats` n’est prévue par F-017 (#13, PR #35). L’issue n’impose aucune dépendance dure et le premier critère d’acceptation demande explicitement un déclenchement **par fixtures avant intégration complète**. F-008 livre donc un **module de notification autonome**, piloté par un contrat d’événement, que F-007 appellera ensuite sans modification du module.

### Critères d’acceptation et réponse apportée

| Critère (issue #10) | Réponse de conception |
| --- | --- |
| Les événements de création et modification peuvent déclencher un email via des fixtures | Contrat `QuickChatEvent` + fixtures typées ; tests unitaires de bout en bout avec un transport mémoire ; smoke test opt-in d’envoi réel (§ 7) |
| Chaque email identifie le Quick Chat, son horaire et l’action attendue | Gabarits par couple (événement, rôle) avec référence courte, date/heure/fuseau, durée et action explicite (§ 4) |
| Destinataires et événements configurables et testables | Politique de notification pure, alimentée par `runtimeConfig` serveur, testée unitairement (§ 3) |
| Échecs observables, sans doublons silencieux | Clé d’idempotence déterministe, journal des envois en base (seule protection, aucune idempotence n’étant documentée par Cloudflare), statut `uncertain` jamais renvoyé automatiquement, journaux structurés sans donnée personnelle (§ 5, § 6) |

### Hors périmètre

- Création, modification ou annulation d’un Quick Chat (F-007) et toute interface utilisateur.
- **Annulation** et **rappels avant l’échange** : l’issue ne cite que création et modification ; le contrat d’événement reste extensible (§ 2).
- Relances automatiques planifiées (cron / file d’attente) : « les règles de relance restent à confirmer » (issue). La V1 rend le renvoi **possible et sûr**, sans le planifier.
- Préférences de notification par utilisateur (désinscription) : emails transactionnels uniquement.

---

## 2. Contrat d’événement

Le module ne lit pas la base pour reconstituer un Quick Chat : l’appelant (F-007, ou une fixture) fournit un événement complet et validé.

```ts
type QuickChatEventType = 'quick_chat.created' | 'quick_chat.updated'
type ParticipantRole = 'mentor' | 'mentee'

interface QuickChatParticipant {
  userId: string // uuid auth.users
  displayName: string | null
  email: string // lu côté serveur depuis Supabase Auth par l’appelant, jamais fourni par le navigateur
}

interface QuickChatEvent {
  type: QuickChatEventType
  quickChatId: string // uuid
  version: number // entier ≥ 1, incrémenté à chaque modification du Quick Chat
  startsAt: string // ISO 8601 avec fuseau (timestamptz)
  durationMinutes: number // 15 à 30 (design fonctionnel)
  previousStartsAt?: string // présent pour une modification d’horaire
  mentor: QuickChatParticipant
  mentee: QuickChatParticipant
}
```

- `validateQuickChatEvent(input: unknown)` est une fonction pure : uuid, type connu, `version` entière ≥ 1, dates ISO valides, durée 15–30, emails syntaxiquement valides, mentor et mentoré distincts. Un événement invalide est refusé avant tout envoi (`invalid_event`).
- `version` est la clé de corrélation des modifications : deux modifications successives produisent deux emails distincts ; le rejeu d’une même version n’en produit aucun nouveau.
- F-007 devra persister cette version (colonne `version` du Quick Chat). C’est la seule exigence que F-008 impose à F-007 ; elle est consignée dans § 9.

---

## 3. Politique : événements et destinataires configurables

```ts
interface NotificationPolicy {
  events: Record<QuickChatEventType, { enabled: boolean, recipients: ParticipantRole[] }>
}
```

- **Valeur par défaut** : les deux événements activés, les deux rôles destinataires.
- **Configuration** : `runtimeConfig.notifications.policy` (serveur, jamais `public`), surchargeable par `NUXT_NOTIFICATIONS_POLICY` (JSON). Une configuration invalide est rejetée au démarrage de l’envoi (`config_invalid`) plutôt qu’ignorée silencieusement.
- `planNotifications(event, policy)` est pure et retourne la liste des messages à envoyer, chacun avec sa clé d’idempotence. Elle est le point testé pour « destinataires et événements configurables ».

---

## 4. Contenu des emails

Gabarits en français, fonctions pures `(event, role, options) → { subject, text, html }`. Le HTML est minimal (pas d’image distante, pas de pixel de suivi), toutes les valeurs dynamiques sont échappées, et une version texte est toujours fournie.

Chaque email contient :

1. **Identification** : « Quick Chat QC-XXXXXX » (6 premiers caractères hexadécimaux de l’uuid, en majuscules) et le nom de l’autre participant.
2. **Horaire** : date et heure longues en français, fuseau nommé et décalage UTC explicites (ex. « jeudi 5 novembre 2026, 18 h 30 (heure de Douala, UTC+1) — 30 min »). Pour une modification d’horaire, l’ancien horaire est rappelé et barré dans le HTML, préfixé « Ancien horaire : » dans le texte.
3. **Action attendue**, selon le couple :

| Événement | Mentor | Mentoré |
| --- | --- | --- |
| `quick_chat.created` | « Consultez la demande et confirmez votre disponibilité. » | « Votre demande est envoyée : ajoutez le créneau à votre agenda et préparez vos questions. » |
| `quick_chat.updated` | « Vérifiez le nouvel horaire et prévenez le mentoré en cas d’empêchement. » | « Vérifiez le nouvel horaire et mettez à jour votre agenda. » |

4. **Lien d’action** vers `${NUXT_PUBLIC_APP_URL}/quick-chats/<id>` — la page sera créée par F-007 ; d’ici là le lien mène à la plateforme qui redirige vers `/login` ou `/`. Aucun jeton dans l’URL.
5. **Pied de page** : expéditeur Collectif Mongulu, contact `collectif@mongulu.cm`, lien vers `/confidentialite` de la vitrine.

**Fuseau d’affichage** : `runtimeConfig.notifications.timeZone`, par défaut `Africa/Douala`. Le fuseau individuel des participants n’est pas encore collecté (voir § 9).

---

## 5. Envoi : transport, idempotence et journal

### 5.1 Transport

```ts
interface EmailTransport {
  send(message: EmailMessage): Promise<{ providerMessageId: string }>
}
```

- **`memory`** : conserve les messages en mémoire ; utilisé par les tests et les fixtures.
- **`log`** (défaut hors production) : n’envoie rien, journalise l’événement d’envoi **sans** adresse ni contenu.
- **Fournisseur réel : [Cloudflare Email Service](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)**, choix fixé par le schéma d’architecture. Envoi par la liaison Workers `send_email` déclarée dans `apps/plateforme/wrangler.jsonc` (`"send_email": [{ "name": "EMAIL" }]`) : **aucune clé d’API** à gérer, aucune dépendance npm. L’assemblage (F-007) lit la liaison via `event.context.cloudflare.env.EMAIL` ; le module ne reçoit qu’une interface minimale `EmailSendBinding` (`send({ to, from, replyTo, subject, text, html }) → { messageId }`) déclarée localement, sans dépendre de `@cloudflare/workers-types`.
- L’adaptateur `createCloudflareEmailTransport({ binding, timeoutMs = 10_000 })` traduit le `code` des erreurs levées par la liaison en erreurs typées :

| Code Cloudflare | Code F-008 |
| --- | --- |
| `E_VALIDATION_ERROR`, `E_FIELD_MISSING`, `E_TOO_MANY_RECIPIENTS`, `E_TOO_MANY_ATTACHMENTS`, `E_CONTENT_TOO_LARGE`, `E_HEADER_*`, `E_HEADERS_*` | `provider_rejected` |
| `E_SENDER_NOT_VERIFIED`, `E_SENDER_DOMAIN_NOT_AVAILABLE`, `E_RECIPIENT_NOT_ALLOWED`, `E_RECIPIENT_SUPPRESSED`, `E_ACCOUNT_SUSPENDED` | `provider_rejected` |
| `E_RATE_LIMIT_EXCEEDED`, `E_DAILY_LIMIT_EXCEEDED`, `E_DELIVERY_FAILED`, `E_INTERNAL_SERVER_ERROR`, code inconnu | `provider_unavailable` |
| Délai dépassé (`timeoutMs`) | `provider_timeout` |

  `provider_timeout` est distinct : abandonner l’attente n’annule pas l’appel, Cloudflare a pu accepter le message. L’issue de l’envoi est donc **inconnue** et traitée comme telle (§ 5.4), jamais comme un échec renvoyable.

  Le code Cloudflare d’origine (ex. `E_RECIPIENT_SUPPRESSED`), qui ne contient aucune donnée personnelle, est conservé dans `providerCode` pour le diagnostic ; le message de l’erreur ne l’est jamais.
- Sélection par `runtimeConfig.notifications.provider` (`log` | `cloudflare`), expéditeur dans `NUXT_NOTIFICATIONS_FROM` (ex. `Manzi-mfa <notifications@mongulu.cm>`). L’adresse doit appartenir à un domaine d’envoi intégré au compte Cloudflare : `mongulu.cm` l’est déjà (exemple d’envoi fourni par Cloudflare depuis `welcome@mongulu.cm`) ; un autre domaine demanderait `npx wrangler email sending enable <domaine>`. Tant qu’aucun domaine n’est intégré, Cloudflare n’envoie qu’aux adresses de destination vérifiées du compte. Les enregistrements DNS d’authentification (SPF, DKIM, DMARC) ne sont pas détaillés dans la documentation consultée : relever ceux en place sur `mongulu.cm` et les consigner dans le README.
- **Limites à connaître** : service en bêta ; quota journalier conservateur pour un nouveau compte, relevé automatiquement ensuite ; 50 destinataires et 5 Mio par message (sans incidence ici : un email par destinataire, sans pièce jointe). Les emails envoyés par la liaison apparaissent « dropped » dans le résumé Email Routing : suivre les métriques **Email Sending** du tableau de bord.
- Le reste du module ne dépend que de l’interface `EmailTransport` : changer de fournisseur reviendrait à écrire un autre adaptateur.

### 5.2 Idempotence

Clé déterministe : `quick-chat:<quickChatId>:v<version>:<type>:<role>`, clé primaire du journal en base.

- La documentation de Cloudflare Email Service ne mentionne **aucune** clé d’idempotence : le module n’en suppose pas, et le journal en base est la seule protection contre les doublons, d’où la règle « journal indisponible ⇒ aucun envoi » (§ 6).
- **Issue inconnue ⇒ pas de renvoi automatique.** Deux situations ne permettent pas de savoir si l’email est parti : le délai dépassé (`provider_timeout`) et une ligne restée `pending` au-delà de son expiration (envoi interrompu, ou écriture `sent` échouée après un envoi réussi). Ces lignes passent au statut `uncertain`, que ni le rejeu de l’événement ni une nouvelle tentative ne renvoient. On préfère un email possiblement manquant, signalé, à un doublon : aucun des deux n’est silencieux.
- **Résolution manuelle** d’une ligne `uncertain` (procédure documentée dans le README) : vérifier dans les métriques et journaux **Email Sending** de Cloudflare si un message est parti vers ce destinataire à l’heure indiquée, puis passer la ligne à `sent` (rien à faire) ou à `failed` (le prochain rejeu de l’événement renverra l’email).

### 5.3 Journal des envois

Table `public.notification_deliveries`, déclarée dans `supabase/schemas/notifications.sql` puis migrée par `declarative sync` (AGENTS.md) :

| Colonne | Type | Rôle |
| --- | --- | --- |
| `idempotency_key` | `text` PK | Clé du § 5.2 |
| `quick_chat_id` | `uuid` | Corrélation (pas de FK tant que F-007 n’a pas créé la table) |
| `event_type`, `recipient_role` | `text` + `CHECK` | Valeurs du contrat |
| `recipient_id` | `uuid` FK `auth.users` `ON DELETE CASCADE` | Pas d’adresse email stockée |
| `status` | `text` `CHECK (pending, sent, failed, uncertain)` | État courant (§ 5.2 pour `uncertain`) |
| `attempts` | `int` | Nombre de tentatives |
| `provider_message_id` | `text` | `messageId` renvoyé par Cloudflare, pour le support |
| `last_error_code` | `text` | Code typé (§ 6), jamais le message brut du fournisseur |
| `last_provider_code` | `text` | Code Cloudflare d’origine (ex. `E_RATE_LIMIT_EXCEEDED`), sans donnée personnelle |
| `created_at`, `updated_at` | `timestamptz` | Horodatage |

- RLS activée, **aucune politique** pour `anon` / `authenticated` ; `REVOKE ALL` sauf `service_role`. Seul le serveur y accède.
- **Accès serveur** : client administrateur via `@supabase/server` (`createAdminClient`, clé `secret` — jamais la clé `service_role` legacy), conformément à la skill `supabase-server`. C’est la première clé secrète côté Worker : elle est ajoutée comme binding Secret Cloudflare et documentée dans le README, jamais dans `runtimeConfig.public`.
- Pas de contenu d’email ni d’adresse en base : le journal sert à l’idempotence et au diagnostic, pas à l’archivage.

### 5.4 Algorithme d’envoi d’un message

1. **Réserver** : `INSERT … ON CONFLICT DO NOTHING` puis lecture de la ligne.
   - `sent` → ne rien envoyer, résultat `duplicate` (journalisé, non silencieux).
   - `pending` récent (< 2 min, `updated_at`) → résultat `in_progress` (un autre appel envoie).
   - `pending` expiré → passer à `uncertain`, résultat `uncertain`, rien n’est envoyé.
   - `uncertain` → résultat `uncertain`, rien n’est envoyé (résolution manuelle, § 5.2).
   - `failed` → nouvelle tentative autorisée.
2. Passer à `pending`, `attempts + 1`.
3. Envoyer via le transport.
4. Succès → `sent` + `provider_message_id`. Délai dépassé → `uncertain` + `last_error_code = provider_timeout`. Autre échec → `failed` + `last_error_code` (+ `last_provider_code`).

Les transitions de l’étape 1 sont conditionnelles (`UPDATE … WHERE status = <statut lu> AND updated_at = <valeur lue>`) : deux appels concurrents ne peuvent pas réserver le même envoi.

`notifyQuickChat(event)` retourne un rapport `{ results: Array<{ role, status: 'sent' | 'duplicate' | 'in_progress' | 'uncertain' | 'failed' | 'skipped', errorCode? }> }` : l’appelant (F-007) sait exactement ce qui a été envoyé. Un échec d’email **ne fait pas échouer** l’opération métier du Quick Chat ; il reste visible dans le rapport, les journaux et la table.

---

## 6. Observabilité et erreurs

Journaux JSON sur une ligne (`console.info` / `console.error`), collectés par l’observabilité Workers déjà activée :

```json
{ "scope": "notifications", "event": "email.failed", "quickChatId": "…", "eventType": "quick_chat.created", "role": "mentor", "attempt": 2, "errorCode": "provider_unavailable", "providerCode": "E_RATE_LIMIT_EXCEEDED" }
```

- Événements : `email.sent`, `email.duplicate`, `email.in_progress`, `email.uncertain` (niveau erreur : action manuelle requise), `email.skipped`, `email.failed`.
- **Jamais** d’adresse email, de nom, de contenu, de jeton d’API ni de message d’erreur brut du fournisseur (il peut citer l’adresse du destinataire) ; seul le `code` Cloudflare est conservé.
- Codes d’erreur : `invalid_event`, `config_invalid`, `config_missing`, `journal_unavailable`, `provider_rejected`, `provider_unavailable`, `provider_timeout`.
- Si le journal est indisponible, **aucun email n’est envoyé** (`journal_unavailable`) : on préfère un échec visible à un doublon possible.

---

## 7. Fixtures et tests

| Niveau | Contenu |
| --- | --- |
| Fixtures (`tests/fixtures/quick-chat-events.ts`) | Création, modification d’horaire, double modification (v2, v3), participants sans nom, noms longs/HTML à échapper |
| Unitaires (Vitest, `tests/unit/`) | Validation d’événement ; politique (désactivation d’un événement, destinataire unique, config invalide) ; gabarits (référence, horaire avec fuseau, action par couple, échappement HTML) ; adaptateur Cloudflare avec liaison `EMAIL` simulée (champs transmis, `messageId`, délai dépassé → `provider_timeout`, correspondance de chaque famille de codes, code inconnu, message brut jamais propagé) ; orchestrateur avec journal et transport en mémoire (nominal, doublon, en cours, échec puis renvoi, délai dépassé puis rejeu sans renvoi, `pending` expiré → `uncertain`, journal indisponible) ; absence de donnée personnelle dans les journaux |
| Base (pgTAP, `supabase/tests/notifications.test.sql`) | Contraintes `CHECK`, unicité de la clé, `anon` et `authenticated` sans lecture ni écriture, cascade à la suppression du compte |
| Smoke opt-in (`npm run test:email`, hors CI) | Envoie les fixtures « création » et « modification » à `E2E_EMAIL_TO` par Cloudflare Email Service, puis rejoue pour vérifier le `duplicate`. La liaison Workers n’existant pas sous Node, le smoke fournit à `createCloudflareEmailTransport` une liaison de test qui appelle l’[API REST](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/) (`POST /accounts/{account_id}/email/sending/send`, jeton `CLOUDFLARE_EMAIL_API_TOKEN` limité à l’envoi d’emails, hors dépôt) ; l’adaptateur de production reste unique |

Les seuils de couverture existants (95 % statements, 85 % branches, 100 % fonctions et lignes) s’appliquent au module. Aucun appel réseau réel en CI.

---

## 8. Organisation du code

```
apps/plateforme/server/notifications/
  event.ts        # contrat + validateQuickChatEvent
  policy.ts       # NotificationPolicy, planNotifications, lecture de la config
  templates.ts    # gabarits + formatage de l’horaire
  transport.ts    # interface EmailTransport, transports memory et log
  cloudflare.ts   # adaptateur Cloudflare Email Service (liaison send_email)
  journal.ts      # interface DeliveryJournal + implémentation Supabase
  notify.ts       # notifyQuickChat : orchestration
  logger.ts       # journaux structurés sans donnée personnelle
```

- Modules purs et injectables (transport, journal, horloge, logger passés en paramètres) : testables sans Nitro. L’assemblage avec `useRuntimeConfig` se fera dans F-007, au point d’appel ; d’ici là le smoke test est le point d’entrée réel, déclaré dans `.fallowrc.json`.
- Liaison `send_email` (`EMAIL`) ajoutée à `apps/plateforme/wrangler.jsonc`. Variables documentées dans `.env.example` et le README (section Notifications).
- **`PRIVACY.md`** : ajout du traitement « emails transactionnels Quick Chat » et de Cloudflare Email Service comme prestataire d’envoi (adresse, nom et contenu transmis à Cloudflare), **avant** la mise en production (README : réviser la politique avant toute nouvelle collecte ou transmission).

---

## 9. Décisions

**Décidé**

- **Fournisseur d’envoi** — Cloudflare Email Service, d’après le schéma d’architecture lié à l’issue (« Emails notifications (Cloudflare) »). Cohérent avec l’hébergement sur Cloudflare Workers : liaison native, pas de clé d’API, pas de nouveau prestataire hors Cloudflare.
- **Canal d’envoi de F-008** — liaison Workers `send_email`, et non le relais SMTP que Cloudflare Email Service propose aussi (`smtp.mx.cloudflare.net`, port 465 en TLS implicite, utilisateur littéral `api_token`, mot de passe = jeton d’API). Le SMTP imposerait un secret côté Worker, des sockets TCP et une bibliothèque SMTP, sans `messageId` ni codes d’erreur typés.
- **Emails d’authentification Supabase** (hors périmètre F-008) — le même relais SMTP peut être configuré comme SMTP personnalisé du projet Supabase pour unifier l’expéditeur. À régler dans le tableau de bord (**Authentication → Emails → SMTP Settings**), jamais dans `supabase/config.toml` : l’activer localement enverrait de vrais emails au lieu de les capturer par `local_smtp`, et `supabase config push` écraserait la configuration d’authentification distante. Le jeton reste hors du dépôt ; relever ensuite la limite `email_sent` (2 par heure par défaut).

**À confirmer**

1. **Domaine d’envoi** — `mongulu.cm` semble déjà intégré à Cloudflare Email Service (exemple d’envoi fourni depuis `welcome@mongulu.cm`) : confirmer son statut dans le tableau de bord, et vérifier l’offre Workers requise pour envoyer à des destinataires quelconques (service en bêta).
2. **Adresse d’expédition** — proposition `Manzi-mfa <notifications@mongulu.cm>`, adresse de réponse `collectif@mongulu.cm`.
3. **Fuseau d’affichage** — `Africa/Douala` par défaut ; fuseau par participant à prévoir dans le profil (F-004 / F-017).
4. **Événements** — création et modification seulement ; annulation et rappel J-1 à décider pour F-007.
5. **Exigence envers F-007** — persister une `version` entière incrémentée à chaque modification et appeler `notifyQuickChat` après validation de la transaction.
6. **Relances** — V1 : renvoi manuel sûr (rejouer l’événement renvoie les `failed`, jamais les `uncertain`) ; relance automatique à définir.
