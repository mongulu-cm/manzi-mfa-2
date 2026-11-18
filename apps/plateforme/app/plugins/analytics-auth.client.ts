export default defineNuxtPlugin({
  dependsOn: ['analytics'],
  setup(app) {
    const analytics = useAnalytics()
    // Le plugin auth est disponible après l'installation des plugins.
    app.hook('app:created', () => {
      const auth = app.$auth
      const profileName = computed(() => auth.state.profile?.display_name || auth.state.user?.name)
      watch(() => [auth.state.ready && !auth.state.sessionError, auth.state.user, profileName.value] as const, ([ready, user, name]) => {
        if (user?.email) app.$analytics.identify(user.email, {
          name,
          first_name: user.firstName,
          last_name: user.lastName,
        })
        else if (ready) app.$analytics.identify(null)
      }, { immediate: true, flush: 'sync' })
      watch(() => auth.state.signingIn, (value) => {
        if (value) analytics.track('auth.login_started')
      })
      watch(() => auth.state.profile, (value) => {
        if (value) analytics.track('profile.viewed')
      })
      watch(() => auth.state.profileError, (value) => {
        if (value) analytics.track('profile.load_failed')
      })
    })
  },
})
