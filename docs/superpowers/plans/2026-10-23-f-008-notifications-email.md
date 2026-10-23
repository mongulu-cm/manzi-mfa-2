# F-008 : Notifier les participants par email — Plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un module serveur autonome qui, à partir d’un événement Quick Chat (création ou modification), envoie au mentor et au mentoré un email identifiant l’échange, son horaire et l’action attendue — configurable, idempotent et observable, déclenchable par fixtures avant l’intégration de F-007.

**Architecture:** Modules purs et injectables sous `apps/plateforme/server/notifications/` (contrat, politique, gabarits, transports, journal, orchestration). Journal des envois dans `public.notification_deliveries` (RLS sans politique, accès serveur seulement). Fournisseur derrière une interface `EmailTransport` ; adaptateur Cloudflare Email Service par la liaison Workers `send_email` (`EMAIL`), choix fixé par le schéma d’architecture de l’issue.

**Tech Stack:** Nuxt 4 / Nitro (preset `cloudflare_module`), Cloudflare Email Service (liaison `send_email`), TypeScript strict, `@supabase/server` (client admin, clé `secret`), Supabase déclaratif + pgTAP, Vitest (V8 coverage).

**Spec:** `docs/superpowers/specs/2026-10-23-f-008-notifications-email-design.md`

## Global Constraints

- Lire et appliquer la skill `supabase-server` (`.agents/skills/supabase-server/SKILL.md`) avant la tâche 6 ; aucune clé legacy (`anon`, `service_role`).
- Schéma : modifier d’abord `supabase/schemas/`, puis `npx supabase db schema declarative sync -f notification_deliveries --no-apply` ; relire et versionner la migration générée avec le fichier déclaratif.
- Aucun secret dans `runtimeConfig.public`, ni dans le dépôt ; variables documentées dans `.env.example`.
- Aucune adresse email, nom, contenu d’email, clé ou corps de réponse fournisseur dans les journaux, la base ou les erreurs remontées.
- Aucune nouvelle dépendance npm (liaison `send_email` typée par une interface locale, sans `@cloudflare/workers-types`).
- Couverture unitaire : 95 % statements, 85 % branches, 100 % fonctions et lignes ; `npx fallow --ci` sans code ni export mort.
- Aucun appel réseau réel en CI.

## Review Focus

- Clé d’idempotence `quick-chat:<id>:v<version>:<type>:<role>` en clé primaire du journal : seule protection contre les doublons, aucune idempotence n’étant documentée par Cloudflare.
- Réservation en base avant envoi, transitions conditionnelles ; journal indisponible ⇒ aucun envoi.
- Issue inconnue (délai dépassé, `pending` expiré) ⇒ `uncertain`, jamais renvoyé automatiquement ni par rejeu.
- Échappement HTML de toutes les valeurs dynamiques des gabarits.
- Correspondance des codes Cloudflare (spec § 5.1) : validation, expéditeur/destinataire, compte suspendu, en-têtes → `provider_rejected` ; limites de débit/quota, `E_DELIVERY_FAILED`, `E_INTERNAL_SERVER_ERROR`, code inconnu → `provider_unavailable` ; délai dépassé → `provider_timeout`. Le message brut de l’erreur n’est jamais propagé.
- Politique RLS : `anon` et `authenticated` n’ont aucun accès à `notification_deliveries`.

---

### Task 1: Contrat d’événement et fixtures

**Files:**
- Create: `apps/plateforme/server/notifications/event.ts`
- Create: `tests/fixtures/quick-chat-events.ts`
- Test: `tests/unit/notifications-event.test.ts`

- [x] Définir `QuickChatEventType`, `ParticipantRole`, `QuickChatParticipant`, `QuickChatEvent` (spec § 2).
- [x] Implémenter `validateQuickChatEvent(input: unknown): QuickChatEvent` qui lève `NotificationError('invalid_event')` (uuid, type, version entière ≥ 1, ISO 8601 avec fuseau, durée 15–30, emails, participants distincts, `previousStartsAt` seulement pour `quick_chat.updated`).
- [x] Définir `NotificationError` (code typé, message générique sans donnée) dans `event.ts`.
- [x] Fixtures : `createdEvent`, `updatedEvent` (v2 avec `previousStartsAt`), `updatedAgainEvent` (v3), participant sans `displayName`, noms longs et contenant `<script>`.
- [x] Tests : fixtures valides ; un cas invalide par règle ; le message d’erreur ne contient aucune valeur d’entrée.

### Task 2: Politique de notification

**Files:**
- Create: `apps/plateforme/server/notifications/policy.ts`
- Test: `tests/unit/notifications-policy.test.ts`

- [x] `DEFAULT_POLICY` (deux événements, deux rôles), `parsePolicy(raw: unknown): NotificationPolicy` (accepte objet ou chaîne JSON, vide → défaut, événement absent → valeur par défaut, lève `config_invalid`).
- [x] `idempotencyKey(event, role)` et `planNotifications(event, policy): PlannedNotification[]` (`{ role, recipient, idempotencyKey }`).
- [x] Tests : défaut → 2 messages ; événement désactivé → 0 ; destinataire unique ; rôles dupliqués dédoublonnés ; JSON invalide / rôle inconnu → `config_invalid` ; clés stables et distinctes par version.

### Task 3: Gabarits d’email

**Files:**
- Create: `apps/plateforme/server/notifications/templates.ts`
- Test: `tests/unit/notifications-templates.test.ts`

- [x] `quickChatReference(id)` → `QC-` + 6 caractères hexadécimaux en majuscules.
- [x] `formatSchedule(startsAt, durationMinutes, timeZone)` via `Intl.DateTimeFormat('fr-FR', { timeZone, … })` avec décalage UTC explicite.
- [x] `renderEmail(event, role, { appUrl, siteUrl, timeZone }) → { subject, text, html }` avec les actions du tableau spec § 4, ancien horaire pour une modification, lien `/quick-chats/<id>`, pied de page.
- [x] `escapeHtml` appliqué à toute valeur dynamique.
- [x] Tests : sujet et corps contiennent référence, horaire, durée, fuseau et action pour chacun des 4 couples ; ancien horaire seulement si modification ; `<script>` échappé ; nom absent → libellé générique ; fuseau configurable (`Africa/Douala`, `Europe/Paris`).

### Task 4: Transports et journaux structurés

**Files:**
- Create: `apps/plateforme/server/notifications/transport.ts`
- Create: `apps/plateforme/server/notifications/logger.ts`
- Test: `tests/unit/notifications-transport.test.ts`

- [x] Interface `EmailTransport` et type `EmailMessage` (`to`, `from: { email, name? }` — forme acceptée par la liaison Cloudflare —, `replyTo`, `subject`, `text`, `html`).
- [x] `createMemoryTransport()` (expose `sent`, option d’échec programmable) et `createLogTransport(logger)`.
- [x] `createNotificationLogger(sink = console)` : émet une ligne JSON `{ scope: 'notifications', event, … }` avec une liste blanche de champs (`quickChatId`, `eventType`, `role`, `attempt`, `errorCode`, `providerCode`, `status`).
- [x] Tests : le transport log n’émet ni adresse, ni sujet, ni contenu ; un champ hors liste blanche est ignoré.

### Task 5: Adaptateur Cloudflare Email Service

**Files:**
- Create: `apps/plateforme/server/notifications/cloudflare.ts`
- Modify: `apps/plateforme/wrangler.jsonc` (`"send_email": [{ "name": "EMAIL" }]`)
- Test: `tests/unit/notifications-cloudflare.test.ts`

- [x] Interface locale `EmailSendBinding` : `send({ to, from, replyTo, subject, text, html }): Promise<{ messageId: string }>` (sous-ensemble de l’[API Workers](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)).
- [x] `createCloudflareEmailTransport({ binding, timeoutMs = 10_000 })` : transmet le message, retourne `{ providerMessageId }` depuis `messageId` ; résultat sans `messageId` → `provider_unavailable`.
- [x] Liaison absente → `config_missing` à la création du transport.
- [x] Correspondance des codes (spec § 5.1, Review Focus) ; `NotificationError` porte `providerCode` (le `code` Cloudflare) mais jamais le message de l’erreur d’origine ; délai dépassé → `provider_timeout` sans `providerCode`.
- [x] Ajouter la liaison `send_email` à `apps/plateforme/wrangler.jsonc` ; vérifier que `npm run build` et `wrangler deploy --dry-run` l’acceptent.
- [x] Tests avec liaison simulée : champs transmis ; succès ; un code par famille (`E_VALIDATION_ERROR`, `E_RECIPIENT_SUPPRESSED`, `E_SENDER_NOT_VERIFIED`, `E_HEADER_NOT_ALLOWED`, `E_RATE_LIMIT_EXCEEDED`, `E_DAILY_LIMIT_EXCEEDED`, `E_INTERNAL_SERVER_ERROR`) ; code inconnu ; erreur sans code ; délai dépassé (horloge simulée) → `provider_timeout` ; le message d’origine contenant une adresse n’apparaît pas dans l’erreur levée.

### Task 6: Schéma et journal des envois

**Files:**
- Create: `supabase/schemas/notifications.sql`
- Create: `supabase/migrations/<horodatage>_notification_deliveries.sql` (généré)
- Create: `supabase/tests/notifications.test.sql`
- Create: `apps/plateforme/server/notifications/journal.ts`
- Test: `tests/unit/notifications-journal.test.ts`

- [ ] Lire la skill `supabase-server`.
- [ ] Déclarer `public.notification_deliveries` (spec § 5.3, `status` ∈ `pending`, `sent`, `failed`, `uncertain`), RLS activée, `REVOKE ALL … FROM PUBLIC, anon, authenticated`, `GRANT ALL … TO service_role`, trigger `updated_at` (réutiliser `private.set_updated_at()` si PR #35 est fusionnée, sinon le déclarer ici et signaler le conflit dans la PR).
- [ ] Générer la migration par `declarative sync`, la relire.
- [ ] pgTAP : colonnes et `CHECK`, PK, aucun `SELECT`/`INSERT` possible pour `anon` et `authenticated`, cascade à la suppression d’un utilisateur.
- [ ] `DeliveryJournal` : `reserve(planned, event, now)` → `'send' | 'duplicate' | 'in_progress' | 'uncertain'` (spec § 5.4, `pending` expiré passé à `uncertain`), `markSent(key, providerMessageId)`, `markFailed(key, errorCode, providerCode?)` (colonne `last_provider_code`), `markUncertain(key, errorCode)`.
- [ ] Transitions conditionnelles (`UPDATE … WHERE status = … AND updated_at = …`) : une réservation concurrente perdue → `in_progress`.
- [ ] `createMemoryJournal()` (tests) et `createSupabaseJournal(client)` (client admin `@supabase/server`) ; toute erreur Supabase → `journal_unavailable`.
- [ ] Tests unitaires du journal mémoire et de l’adaptateur Supabase avec client simulé (insert en conflit, lecture `sent`, `pending` récent, `pending` expiré → `uncertain`, `uncertain`, `failed`, réservation concurrente perdue, erreur).

### Task 7: Orchestration `notifyQuickChat`

**Files:**
- Create: `apps/plateforme/server/notifications/notify.ts`
- Test: `tests/unit/notifications-notify.test.ts`

- [ ] `notifyQuickChat(input, deps)` avec `deps = { policy, transport, journal, logger, render options, from, replyTo, now }` : valide, planifie, puis pour chaque message réserve → envoie → marque (spec § 5.4) ; retourne le rapport.
- [ ] Les erreurs d’un destinataire n’empêchent pas l’envoi à l’autre ; `journal_unavailable` ⇒ statut `failed` sans appel au transport ; `provider_timeout` ⇒ `markUncertain`, statut `uncertain`, ligne `email.uncertain` au niveau erreur.
- [ ] Tests sur fixtures (critère 1) : création → 2 `sent` ; rejeu → 2 `duplicate` ; v2 puis v3 → nouveaux envois ; événement désactivé → `skipped` ; échec transport → `failed` puis renvoi → `sent` avec `attempts = 2` ; délai dépassé → `uncertain` puis rejeu → `uncertain` sans appel au transport ; `pending` expiré → `uncertain` ; `in_progress` ; aucun email/nom dans les lignes journalisées.

### Task 8: Smoke test opt-in, configuration et documentation

**Files:**
- Create: `tests/smoke/email.smoke.ts`, `vitest.smoke.config.ts`
- Modify: `package.json` (script `test:email`), `.fallowrc.json` (entrée smoke), `.env.example`, `apps/plateforme/nuxt.config.ts` (`runtimeConfig.notifications`), `README.md`, `PRIVACY.md`

- [ ] Smoke : ignoré sans `E2E_EMAIL_TO`, `NUXT_NOTIFICATIONS_FROM_EMAIL`, `CLOUDFLARE_ACCOUNT_ID` et `CLOUDFLARE_EMAIL_API_TOKEN` ; fournit à `createCloudflareEmailTransport` une liaison de test appelant l’API REST (`POST https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send`, `messageId` absent de la réponse REST → valeur fixe `rest`) ; envoie les fixtures création et modification au destinataire de test (mentor et mentoré = `E2E_EMAIL_TO` avec alias `+mentor` / `+mentee`), journal mémoire, puis rejoue et vérifie `duplicate`.
- [ ] `runtimeConfig.notifications` : `provider: 'log'`, `fromEmail: ''`, `fromName: 'Manzi-mfa'`, `replyTo: 'collectif@mongulu.cm'`, `timeZone: 'Africa/Douala'`, `policy: ''` ; `runtimeConfig.supabaseSecretKey: ''` (serveur).
- [ ] `.env.example` : `NUXT_NOTIFICATIONS_*`, `NUXT_SUPABASE_SECRET_KEY` (vide, commentaire « binding Secret Cloudflare, jamais committé »), `E2E_EMAIL_TO`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN` (smoke uniquement, jamais committé).
- [ ] README : section « Notifications email » (contrat, configuration, liaison `send_email`, activation du domaine d’envoi par `wrangler email sending enable` et enregistrements DNS relevés lors de l’activation, quotas et métriques Email Sending, smoke test, lecture du journal, résolution manuelle d’une ligne `uncertain`, relais SMTP Cloudflare pour les emails d’authentification Supabase configuré dans le tableau de bord — spec § 9).
- [ ] `PRIVACY.md` : traitement « emails transactionnels Quick Chat », Cloudflare Email Service comme prestataire d’envoi, conservation du journal ; date de version mise à jour.

### Task 9: Vérification finale

- [ ] `npm run check`
- [ ] `npm run test:coverage`
- [ ] `npx supabase start` puis `npm run test:db`
- [ ] `npx fallow --ci --format compact`
- [ ] PR en **Draft**, suivi avec `ce-babysit-pr` jusqu’à CI verte ; passage en Ready uniquement sur accord explicite de l’utilisateur.
