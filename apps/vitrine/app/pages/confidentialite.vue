<script setup lang="ts">
useSeoMeta({
  title: 'Politique de confidentialité — Manzi-mfa',
  description: 'Comment le Collectif Mongulu traite vos données sur Manzi-mfa et comment exercer vos droits.',
})
</script>

<template>
  <article
    class="privacy-policy mx-auto max-w-4xl"
    aria-labelledby="privacy-title"
  >
    <UButton
      to="/"
      variant="link"
      label="Retour à l’accueil"
      class="mb-8"
    />
    <h1 id="privacy-title">
      Politique de confidentialité
    </h1>
    <!-- Texte public issu de PRIVACY.md ; le test E2E vérifie la parité du HTML SSR. -->
    <p>
      <strong>Version du 6 octobre 2026.</strong>
    </p>
    <p>
      Le Collectif Mongulu explique ici comment les informations sont traitées lors de la consultation de Manzi-mfa et des échanges avec le collectif. Pour toute question ou demande concernant vos données, écrivez à <ULink
        to="mailto:collectif@mongulu.cm"
        class="text-primary underline"
      >collectif@mongulu.cm</ULink>.
    </p>
    <h2 id="section-1">
      1. Responsable et contact
    </h2>
    <p>
      Le Collectif Mongulu est responsable des traitements réalisés pour Manzi-mfa. Cela signifie qu’il détermine les raisons et les modalités d’utilisation des informations nécessaires au service.
    </p>
    <p>
      Notre contact pour la confidentialité et l’exercice de vos droits est <ULink
        to="mailto:collectif@mongulu.cm"
        class="text-primary underline"
      >collectif@mongulu.cm</ULink>. Cette adresse permet également de signaler un problème concernant vos données.
    </p>
    <h2 id="section-2">
      2. Périmètre et fonctions actuelles
    </h2>
    <p>
      Cette politique couvre la vitrine à l’adresse https://manzi-mfa-2.mongulu.cm et la plateforme à l’adresse https://app.manzi-mfa-2.mongulu.cm, ainsi que vos demandes relatives à ces sites.
    </p>
    <p>
      La plateforme permet de se connecter avec LinkedIn. La première connexion crée automatiquement un compte Manzi-mfa ; les suivantes permettent de retrouver ce compte. L’accueil connecté affiche votre profil et permet de vous déconnecter. Les sites ne proposent ni dépôt de CV, ni réservation, ni messagerie, ni paiement.
    </p>
    <p>
      Avant l’ouverture de nouvelles fonctions, cette politique sera actualisée pour expliquer les données concernées, leurs finalités, leurs destinataires et leurs durées de conservation.
    </p>
    <h2 id="section-3">
      3. Informations traitées et mode de collecte
    </h2>
    <p>
      <strong>Consultation des sites.</strong> Votre navigateur transmet les informations nécessaires à la connexion : notamment votre adresse IP, l’adresse de la ressource demandée et des en-têtes techniques pouvant indiquer le navigateur, la langue ou la page d’origine. Cloudflare reçoit ce trafic pour distribuer les pages et protéger le service. Certaines de ces informations peuvent permettre de vous identifier indirectement.
    </p>
    <p>
      <strong>Diagnostic technique.</strong> Les journaux d’exécution des Workers sont activés. Ils peuvent contenir l’horodatage, la méthode et l’adresse de la requête, le résultat de l’exécution et les erreurs. Tous les en-têtes et toutes les adresses IP ne sont pas nécessairement enregistrés dans chaque journal. Évitez d’inscrire des informations confidentielles dans les adresses de pages ou leurs paramètres.
    </p>
    <p>
      <strong>Compte LinkedIn.</strong> Lors de la connexion LinkedIn, Supabase reçoit un identifiant de compte, les informations techniques de connexion et, lorsqu’ils sont disponibles, votre nom, votre adresse e-mail et l’URL de votre photo. L’e-mail est conservé dans le compte d’authentification Supabase Auth. Le nom et l’URL de la photo sont conservés dans les métadonnées de ce compte et copiés dans votre profil applicatif à sa création. Cette version ne synchronise pas le profil applicatif à chaque connexion ; les métadonnées d’authentification peuvent être actualisées par Supabase lors d’une connexion ultérieure.
    </p>
    <p>
      <strong>Préférence d’affichage.</strong> Le module de thème peut lire ou mémoriser une préférence sous la clé <code>nuxt-color-mode</code> dans le stockage local de votre navigateur. Cette valeur concerne l’affichage et ne constitue pas un identifiant de compte.
    </p>
    <p>
      <strong>Courriels.</strong> Si vous écrivez à collectif@mongulu.cm, nous recevons votre adresse électronique, le contenu de votre message et les pièces jointes que vous choisissez d’envoyer. Fournissez uniquement les informations nécessaires à votre demande et évitez de transmettre des documents sensibles sans nécessité.
    </p>
    <p>
      Le nom, la photo et l’adresse e-mail peuvent être fournis par LinkedIn lors de la connexion. Votre mot de passe LinkedIn est saisi uniquement chez LinkedIn et n’est pas reçu par Manzi-mfa. Les pages ne demandent ni CV ni coordonnées de paiement. Elles ne sollicitent pas votre localisation précise, votre caméra ou votre microphone. Le code des applications ne comporte pas d’outil publicitaire, de mesure d’audience, de profilage de candidats ou de décision automatisée de recrutement.
    </p>
    <h2 id="section-4">
      4. Finalités
    </h2>
    <p>Les données du compte permettent de vous authentifier, de maintenir votre session et d’afficher votre nom, votre photo et votre e-mail dans votre espace.</p>
    <p>
      Les informations techniques servent à afficher les pages et leurs ressources, maintenir leur disponibilité, protéger les sites contre les requêtes abusives et diagnostiquer les erreurs. La préférence locale sert à conserver un affichage cohérent.
    </p>
    <p>
      Les informations que vous nous adressez par courriel servent à comprendre votre demande, vous répondre et, le cas échéant, traiter l’exercice de vos droits.
    </p>
    <p>
      Nous ne vendons pas les données recueillies pour ces finalités et ne les utilisons pas pour de la publicité ciblée. Les informations de consultation ne servent pas à évaluer votre aptitude à un emploi ou à vous attribuer un mentor.
    </p>
    <h2 id="section-5">
      5. Fondements des traitements
    </h2>
    <p>
      Les traitements techniques nécessaires au fonctionnement et à la sécurité du site, ainsi que la réponse aux demandes générales, reposent sur l’intérêt légitime du collectif à fournir un service disponible et sûr et à répondre à ses interlocuteurs, dans les conditions permises par le droit applicable. Cet intérêt doit être mis en balance avec vos droits et la nécessité du traitement.
    </p>
    <p>
      Le traitement des demandes d’exercice de droits repose sur les obligations de protection des données applicables au collectif. Une conservation ou une communication imposée par la loi repose sur l’obligation légale correspondante.
    </p>
    <p>
      La simple consultation du site ne constitue pas un consentement général à l’utilisation de vos données. Un éventuel traitement futur nécessitant votre consentement fera l’objet d’un choix préalable, spécifique et révocable. La création et la gestion du compte servent à fournir l’accès à l’espace connecté demandé par l’utilisateur. Les données du compte ne sont pas utilisées pour la publicité ou pour évaluer une candidature.
    </p>
    <h2 id="section-6">
      6. Destinataires et prestataires
    </h2>
    <p>
      Les personnes du collectif habilitées à administrer le service ou à traiter votre demande peuvent accéder aux informations nécessaires à leur mission.
    </p>
    <p>
      Cloudflare intervient pour l’hébergement, la distribution des ressources et la protection du trafic. Les courriels transitent également par les services de messagerie de l’expéditeur et du destinataire. Les informations peuvent être communiquées aux autorités lorsqu’une demande légalement valable impose cette communication.
    </p>
    <p>
      Les polices Alegreya et Hanken Grotesk et le logo sont servis par nos sites : leur chargement ne nécessite pas de requête vers Google Fonts. Supabase héberge les comptes, les sessions et les profils. LinkedIn assure la connexion et fournit les informations autorisées. Les photos restent hébergées à l’adresse fournie par LinkedIn : leur affichage entraîne une requête de votre navigateur vers cet hébergeur, sans transmettre l’adresse de la page Manzi-mfa comme référent.
    </p>
    <p>
      Les informations relatives aux traitements de Cloudflare figurent dans sa <ULink
        to="https://www.cloudflare.com/privacypolicy/"
        class="text-primary underline"
      >politique de confidentialité</ULink> et son <ULink
        to="https://www.cloudflare.com/cloudflare-customer-dpa/"
        class="text-primary underline"
      >accord de traitement des données</ULink>. Vous pouvez nous demander des précisions sur les prestataires intervenant dans le traitement de votre demande.
    </p>
    <h2 id="section-7">
      7. Traitements internationaux
    </h2>
    <p>
      Cloudflare, Supabase et LinkedIn utilisent des infrastructures internationales et les échanges par courriel peuvent également transiter par d’autres pays. Des traitements peuvent donc avoir lieu hors de votre pays de résidence ; cette politique ne garantit pas une conservation exclusivement au Cameroun ou dans l’Union européenne.
    </p>
    <p>
      Les transferts doivent respecter les conditions du droit applicable. Lorsque le RGPD s’applique, les transferts hors de l’Espace économique européen nécessitent un mécanisme autorisé, tel qu’une décision d’adéquation ou des clauses contractuelles types, selon le transfert concerné. Pour obtenir des informations sur les garanties concernant vos données, contactez collectif@mongulu.cm.
    </p>
    <h2 id="section-8">
      8. Durées de conservation
    </h2>
    <dl class="retention-list">
      <div>
        <dt>Journaux d’exécution dans Cloudflare Workers Logs</dt>
        <dd>Selon la documentation du prestataire à la date de cette version : 3 jours en offre Free et 7 jours en offre Paid ; suppression à l’expiration de la rétention de l’offre</dd>
      </div>
      <div>
        <dt>Autres informations de trafic et de sécurité traitées par Cloudflare</dt>
        <dd>Selon les finalités techniques, les obligations et les règles de conservation du prestataire ; la rétention des journaux Workers ne s’applique pas automatiquement à ces autres données</dd>
      </div>
      <div>
        <dt>Préférence locale <code>nuxt-color-mode</code>, lorsqu’elle est mémorisée</dt>
        <dd>Jusqu’à son remplacement ou à l’effacement des données du site dans votre navigateur ; aucune expiration automatique configurée par le module</dd>
      </div>
      <div>
        <dt>Correspondance et demandes d’exercice de droits</dt>
        <dd>Pendant le traitement de la demande, puis uniquement pendant la durée nécessaire à la preuve de son traitement, à une obligation légale ou à la défense d’un droit ; suppression lorsque ces besoins cessent</dd>
      </div>
      <div>
        <dt>Justificatif d’identité éventuellement nécessaire</dt>
        <dd>Seulement le temps nécessaire à la vérification, sauf obligation légale de conservation</dd>
      </div>
    </dl>
    <p>
      La <ULink
        to="https://developers.cloudflare.com/workers/observability/logs/workers-logs/"
        class="text-primary underline"
      >documentation Workers Logs</ULink> précise les durées propres à ce service. Elles peuvent évoluer avec l’offre du prestataire. Contactez-nous pour connaître les conditions applicables à une demande particulière.
    </p>
    <p>
      Le compte et son profil sont conservés tant que le compte existe. Pour demander leur suppression ou leur rectification, écrivez à collectif@mongulu.cm. La suppression du compte supprime le profil associé ; des sauvegardes ou journaux peuvent rester conservés selon les règles du prestataire et les obligations applicables. Aucun CV, réservation ou paiement n’est collecté par les fonctions actuelles.
    </p>
    <h2 id="section-9">
      9. Cookies et stockage local
    </h2>
    <p>
      Le code applicatif ne dépose pas de cookie publicitaire ou de mesure d’audience. La préférence éventuelle de thème est conservée dans le stockage local, distinct des cookies. Sur la plateforme, Supabase conserve également les éléments de session dans ce stockage pour maintenir votre connexion et renouveler les jetons expirés. Ils sont retirés à la déconnexion ou lorsque vous effacez les données du site dans votre navigateur.
    </p>
    <p>
      Cloudflare peut utiliser des cookies de sécurité selon les protections activées. Sa <ULink
        to="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/"
        class="text-primary underline"
      >documentation sur les cookies</ULink> décrit leurs fonctions et leurs durées ; cette liste générale ne signifie pas que tous ces cookies sont présents sur nos sites.
    </p>
    <p>
      Vous pouvez effacer les cookies et le stockage local de chaque domaine dans les paramètres de votre navigateur. Vos préférences et certains mécanismes de sécurité pourront être réinitialisés.
    </p>
    <p>
      Tout futur traceur nécessitant un consentement sera soumis à votre choix avant son activation. Vous pourrez le refuser et retirer votre consentement. La navigation seule ne vaudra pas acceptation.
    </p>
    <h2 id="section-10">
      10. Vos droits
    </h2>
    <p>
      Selon la législation applicable et les conditions qu’elle prévoit, vous pouvez demander l’accès à vos données, leur rectification ou leur effacement et vous opposer à certains traitements. Lorsque le RGPD s’applique, les droits à la limitation et, pour les traitements remplissant ses conditions, à la portabilité sont également prévus. Vous pouvez retirer un consentement lorsqu’un traitement repose sur celui-ci, sans remettre en cause sa licéité avant le retrait.
    </p>
    <p>
      Écrivez à <ULink
        to="mailto:collectif@mongulu.cm"
        class="text-primary underline"
      >collectif@mongulu.cm</ULink> en indiquant le site concerné et l’objet de votre demande. Ne transmettez que les éléments utiles pour retrouver vos informations. Nous ne demandons pas systématiquement une copie de pièce d’identité ; une vérification proportionnée peut être nécessaire en cas de doute raisonnable.
    </p>
    <p>
      Nous traitons les demandes dans les délais du droit applicable. Lorsque le RGPD s’applique, la réponse intervient en principe dans un mois ; une prolongation de deux mois supplémentaires est possible dans les conditions du règlement, avec une information motivée dans le premier mois.
    </p>
    <p>
      Vous pouvez saisir l’autorité de protection des données compétente. Lorsque le RGPD s’applique, il peut notamment s’agir de celle de votre résidence habituelle, de votre lieu de travail ou du lieu de la violation alléguée. Vous pouvez nous contacter pour obtenir les informations utiles à votre démarche.
    </p>
    <h2 id="section-11">
      11. Sécurité
    </h2>
    <p>
      Les deux sites utilisent HTTPS, qui chiffre les échanges entre votre navigateur et le point de terminaison du service. Cloudflare fournit l’hébergement et les protections techniques du trafic. Les profils ne sont pas publics : chaque utilisateur connecté peut lire uniquement son propre profil. La création des profils est effectuée par la base de données, sans autoriser leur modification depuis le navigateur.
    </p>
    <p>
      Aucun système ne garantit une sécurité absolue. Si vous constatez une divulgation ou un problème concernant vos données, signalez-le à collectif@mongulu.cm en évitant de communiquer davantage d’informations sensibles que nécessaire.
    </p>
    <h2 id="section-12">
      12. Mineurs et données sensibles
    </h2>
    <p>
      Les pages actuelles ne demandent pas l’âge des visiteurs ni de données sensibles et ne comportent pas de mécanisme de vérification d’âge ou d’autorisation parentale. Une visite par un mineur peut néanmoins donner lieu aux traitements techniques décrits dans cette politique.
    </p>
    <p>
      Ne nous envoyez pas spontanément de données de santé, de documents d’identité ou d’autres informations sensibles qui ne sont pas nécessaires à votre demande. Les modalités d’accès au futur mentorat et les mesures relatives aux mineurs seront définies avant l’ouverture de ces fonctions, en fonction du droit applicable.
    </p>
    <h2 id="section-13">
      13. Évolution et liens externes
    </h2>
    <p>
      Cette politique sera actualisée lorsque les fonctions ou les pratiques de traitement changent. La date de version permettra d’identifier le texte le plus récent. Toute nouvelle collecte fera l’objet d’une information adaptée avant sa mise en œuvre et, lorsque cela est nécessaire, d’un consentement préalable.
    </p>
    <p>
      Les deux sites Manzi-mfa sont couverts par le même texte. Les services tiers accessibles par des liens appliquent leurs propres politiques de confidentialité ; celles-ci ne remplacent pas nos obligations pour les traitements dont le collectif est responsable.
    </p>
  </article>
</template>

<style scoped>
.privacy-policy {
  overflow-wrap: anywhere;
}

.privacy-policy p {
  margin-block: 1.25rem;
}

.privacy-policy h2 {
  margin-block: 3.25rem 1.25rem;
  font-family: var(--font-display);
  font-size: var(--text-h2);
  line-height: var(--text-h2--line-height);
  font-weight: 700;
  color: var(--color-forest-700);
}

.retention-list > div {
  padding-block: 1rem;
  border-bottom: 1px solid var(--mongulu-divider);
}

.retention-list dt {
  font-weight: 600;
}

.retention-list dd {
  margin: 0.5rem 0 0;
  max-width: 65ch;
}

@media (max-width: 639px) {
  .privacy-policy h2 {
    font-size: 32px;
    line-height: 40px;
  }
}
</style>
