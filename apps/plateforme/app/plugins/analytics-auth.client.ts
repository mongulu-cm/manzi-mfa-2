export default defineNuxtPlugin({
  dependsOn: ['analytics'],
  setup(app) {
    // Le plugin auth est disponible après l'installation des plugins.
    app.hook('app:created', () => {
      const auth = app.$auth
      watch(() => [auth.state.ready, auth.state.user?.id, auth.state.sessionError] as const, ([ready, id, error]) => {
        if (id) app.$analytics.identify(id)
        else if (ready && !error) app.$analytics.identify(null)
      }, { immediate: true, flush: 'sync' })
      watch(() => auth.state.signingIn, (value) => {
        if (value) app.$analytics.track('auth.login_started')
      })
      watch(() => auth.state.profile, (value) => {
        if (value) app.$analytics.track('profile.viewed')
      })
      watch(() => auth.state.profileError, (value) => {
        if (value) app.$analytics.track('profile.load_failed')
      })
    })
  },
})
