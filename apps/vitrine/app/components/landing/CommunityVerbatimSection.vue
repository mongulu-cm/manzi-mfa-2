<template>
  <section
    class="community-verbatim-section rounded-3xl bg-[#D2E6BA] p-6 sm:p-10 lg:p-14"
    aria-labelledby="community-title"
  >
    <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <!-- Colonne gauche: Mission -->
      <div class="lg:col-span-6">
        <h2
          id="community-title"
          class="font-serif text-3xl font-bold leading-tight text-[#1F1F1F] sm:text-4xl"
        >
          Une communauté engagée et gratuite
        </h2>
        <p class="mt-4 text-base leading-relaxed text-[#47483B] sm:text-lg">
          Manzi-mfa est un service porté par le collectif Mongulu. Notre mission est de démocratiser l'accès au savoir technologique. Les sessions "Quick Chat" sont gratuites pour tous les membres de la communauté.
        </p>

        <div class="mt-8 flex items-center gap-3 font-semibold text-[#1F1F1F]">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#3D4D1A] text-white"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span>+2500 membres actifs</span>
        </div>
      </div>

      <!-- Colonne droite: Carte Verbatim -->
      <div class="lg:col-span-6">
        <div class="rounded-3xl bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <!-- Stack avatars -->
          <div class="flex items-center">
            <div class="flex -space-x-3 overflow-hidden">
              <img
                src="/images/landing/avatar-1.svg"
                alt=""
                aria-hidden="true"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              >
              <img
                src="/images/landing/avatar-2.svg"
                alt=""
                aria-hidden="true"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              >
              <img
                src="/images/landing/avatar-3.svg"
                alt=""
                aria-hidden="true"
                width="40"
                height="40"
                class="inline-block h-10 w-10 rounded-full ring-2 ring-white"
              >
            </div>
            <span class="ml-3 rounded-full bg-[#3D4D1A] px-3 py-1 text-xs font-bold text-white">
              +2k
            </span>
          </div>

          <blockquote class="mt-6">
            <p class="font-serif text-xl font-bold leading-snug text-[#1F1F1F] sm:text-2xl">
              "Manzi-mfa a changé ma vision de la tech. Merci aux mentors !"
            </p>
            <footer class="mt-4 text-sm font-medium text-[#47483B]">
              &mdash; Sekou, Junior Web Dev
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  </section>
</template>
