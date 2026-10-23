# Spécification de conception — F-008 : Notifier les participants par email

- **Feature ID** : `F-008`
- **Issue** : [mongulu-cm/manzi-mfa-2#10](https://github.com/mongulu-cm/manzi-mfa-2/issues/10)
- **Epic** : E-003 — Quick Chat
- **Vague** : 1
- **Exigences sources** : `R-047`, `R-053`
- **Éléments d’architecture** : `AR-001`, `AR-007`, `AR-010`, `AR-013`
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
| Échecs observables, sans doublons silencieux | Clé d’idempotence déterministe, journal des envois en base, statut explicite, journaux structurés sans donnée personnelle (§ 5, § 6) |

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
  send(message: EmailMessage, options: { idempotencyKey: string }): Promise<{ providerMessageId: string }>
}
```

- **`memory`** : conserve les messages en mémoire ; utilisé par les tests et les fixtures.
- **`log`** (défaut hors production) : n’envoie rien, journalise l’événement d’envoi **sans** adresse ni contenu.
- **Fournisseur réel — recommandation : Resend** (API HTTP compatible Workers, en-tête `Idempotency-Key` natif, offre gratuite suffisante pour la phase 1). Appel `fetch` avec `AbortSignal.timeout(10_000)`, sans SDK supplémentaire (AGENTS.md : pas de bibliothèque sans besoin concret). L’adaptateur traduit les réponses en erreurs typées : `provider_rejected` (4xx hors 429), `provider_unavailable` (429, 5xx, timeout, réseau).
- Sélection par `runtimeConfig.notifications.provider` (`log` | `resend`), clé dans `NUXT_NOTIFICATIONS_RESEND_API_KEY` (secret serveur, binding Cloudflare de type Secret), expéditeur dans `NUXT_NOTIFICATIONS_FROM` (ex. `Manzi-mfa <notifications@manzi-mfa-2.mongulu.cm>`).
- **Le choix du fournisseur est à confirmer** (§ 9). Le reste du module ne dépend que de l’interface : changer de fournisseur revient à écrire un adaptateur.

### 5.2 Idempotence

Clé déterministe : `quick-chat:<quickChatId>:v<version>:<type>:<role>`.

- Transmise au fournisseur (protection contre un double envoi dans sa fenêtre d’idempotence).
- Clé primaire du journal en base (protection durable, indépendante du fournisseur).

### 5.3 Journal des envois

Table `public.notification_deliveries`, déclarée dans `supabase/schemas/notifications.sql` puis migrée par `declarative sync` (AGENTS.md) :

| Colonne | Type | Rôle |
| --- | --- | --- |
| `idempotency_key` | `text` PK | Clé du § 5.2 |
| `quick_chat_id` | `uuid` | Corrélation (pas de FK tant que F-007 n’a pas créé la table) |
| `event_type`, `recipient_role` | `text` + `CHECK` | Valeurs du contrat |
| `recipient_id` | `uuid` FK `auth.users` `ON DELETE CASCADE` | Pas d’adresse email stockée |
| `status` | `text` `CHECK (pending, sent, failed)` | État courant |
| `attempts` | `int` | Nombre de tentatives |
| `provider_message_id` | `text` | Identifiant fournisseur pour le support |
| `last_error_code` | `text` | Code typé (§ 6), jamais le message brut du fournisseur |
| `created_at`, `updated_at` | `timestamptz` | Horodatage |

- RLS activée, **aucune politique** pour `anon` / `authenticated` ; `REVOKE ALL` sauf `service_role`. Seul le serveur y accède.
- **Accès serveur** : client administrateur via `@supabase/server` (`createAdminClient`, clé `secret` — jamais la clé `service_role` legacy), conformément à la skill `supabase-server`. C’est la première clé secrète côté Worker : elle est ajoutée comme binding Secret Cloudflare et documentée dans le README, jamais dans `runtimeConfig.public`.
- Pas de contenu d’email ni d’adresse en base : le journal sert à l’idempotence et au diagnostic, pas à l’archivage.

### 5.4 Algorithme d’envoi d’un message

1. **Réserver** : `INSERT … ON CONFLICT DO NOTHING` puis lecture de la ligne.
   - `sent` → ne rien envoyer, résultat `duplicate` (journalisé, non silencieux).
   - `pending` récent (< 2 min, `updated_at`) → résultat `in_progress` (un autre appel envoie).
   - `failed` ou `pending` expiré → nouvelle tentative autorisée.
2. Passer à `pending`, `attempts + 1`.
3. Envoyer via le transport avec la clé d’idempotence.
4. Succès → `sent` + `provider_message_id`. Échec → `failed` + `last_error_code`.

`notifyQuickChat(event)` retourne un rapport `{ results: Array<{ role, status: 'sent' | 'duplicate' | 'in_progress' | 'failed' | 'skipped', errorCode? }> }` : l’appelant (F-007) sait exactement ce qui a été envoyé. Un échec d’email **ne fait pas échouer** l’opération métier du Quick Chat ; il reste visible dans le rapport, les journaux et la table.

---

## 6. Observabilité et erreurs

Journaux JSON sur une ligne (`console.info` / `console.error`), collectés par l’observabilité Workers déjà activée :

```json
{ "scope": "notifications", "event": "email.failed", "quickChatId": "…", "eventType": "quick_chat.created", "role": "mentor", "attempt": 2, "errorCode": "provider_unavailable" }
```

- Événements : `email.sent`, `email.duplicate`, `email.in_progress`, `email.skipped`, `email.failed`.
- **Jamais** d’adresse email, de nom, de contenu, de clé API ou de corps de réponse du fournisseur.
- Codes d’erreur : `invalid_event`, `config_invalid`, `config_missing`, `journal_unavailable`, `provider_rejected`, `provider_unavailable`.
- Si le journal est indisponible, **aucun email n’est envoyé** (`journal_unavailable`) : on préfère un échec visible à un doublon possible.

---

## 7. Fixtures et tests

| Niveau | Contenu |
| --- | --- |
| Fixtures (`tests/fixtures/quick-chat-events.ts`) | Création, modification d’horaire, double modification (v2, v3), participants sans nom, noms longs/HTML à échapper |
| Unitaires (Vitest, `tests/unit/`) | Validation d’événement ; politique (désactivation d’un événement, destinataire unique, config invalide) ; gabarits (référence, horaire avec fuseau, action par couple, échappement HTML) ; adaptateur Resend avec `fetch` simulé (en-têtes, idempotence, timeout, mapping 4xx/429/5xx) ; orchestrateur avec journal et transport en mémoire (nominal, doublon, en cours, échec puis renvoi, journal indisponible) ; absence de donnée personnelle dans les journaux |
| Base (pgTAP, `supabase/tests/notifications.test.sql`) | Contraintes `CHECK`, unicité de la clé, `anon` et `authenticated` sans lecture ni écriture, cascade à la suppression du compte |
| Smoke opt-in (`npm run test:email`, hors CI) | Envoie les fixtures « création » et « modification » à `E2E_EMAIL_TO` via le fournisseur configuré, puis rejoue pour vérifier le `duplicate` |

Les seuils de couverture existants (95 % statements, 85 % branches, 100 % fonctions et lignes) s’appliquent au module. Aucun appel réseau réel en CI.

---

## 8. Organisation du code

```
apps/plateforme/server/notifications/
  event.ts        # contrat + validateQuickChatEvent
  policy.ts       # NotificationPolicy, planNotifications, lecture de la config
  templates.ts    # gabarits + formatage de l’horaire
  transport.ts    # interface EmailTransport, transports memory et log
  resend.ts       # adaptateur Resend (fetch)
  journal.ts      # interface DeliveryJournal + implémentation Supabase
  notify.ts       # notifyQuickChat : orchestration
  logger.ts       # journaux structurés sans donnée personnelle
```

- Modules purs et injectables (transport, journal, horloge, logger passés en paramètres) : testables sans Nitro. L’assemblage avec `useRuntimeConfig` se fera dans F-007, au point d’appel ; d’ici là le smoke test est le point d’entrée réel, déclaré dans `.fallowrc.json`.
- Variables documentées dans `.env.example` et le README (section Notifications).
- **`PRIVACY.md`** : ajout du traitement « emails transactionnels Quick Chat » et du fournisseur d’envoi comme prestataire, **avant** la mise en production (README : réviser la politique avant toute nouvelle collecte ou transmission).

---

## 9. Décisions à confirmer

1. **Fournisseur d’envoi** — recommandation Resend ; alternatives : envoi d’emails Cloudflare, Brevo. Impacte uniquement `resend.ts`, la configuration DNS (SPF/DKIM du domaine expéditeur) et `PRIVACY.md`.
2. **Domaine et adresse d’expédition** — proposition `notifications@manzi-mfa-2.mongulu.cm`, adresse de réponse `collectif@mongulu.cm`.
3. **Fuseau d’affichage** — `Africa/Douala` par défaut ; fuseau par participant à prévoir dans le profil (F-004 / F-017).
4. **Événements** — création et modification seulement ; annulation et rappel J-1 à décider pour F-007.
5. **Exigence envers F-007** — persister une `version` entière incrémentée à chaque modification et appeler `notifyQuickChat` après validation de la transaction.
6. **Relances** — V1 : renvoi manuel sûr (rejouer l’événement) ; relance automatique à définir.
