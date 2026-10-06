export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  await auth.initialize()
  if (!auth.state.user && !auth.state.sessionError) return navigateTo('/login', { replace: true })
})
