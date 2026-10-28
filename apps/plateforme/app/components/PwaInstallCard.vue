<script setup lang="ts">
const props = withDefaults(defineProps<{
  mobile?: boolean
  help?: boolean
  browserName: string
  documentationUrl: string
  available?: boolean
  installed?: boolean
  busy?: boolean
  error?: string
  instructions: string
}>(), { mobile: false, help: false, available: false, installed: false, busy: false, error: '' })
const emit = defineEmits<{ install: [] }>()
const showHelp = ref(false)
watch(() => props.help || Boolean(props.error), (needed) => {
  if (needed) showHelp.value = true
}, { immediate: true })
function activate() {
  if (props.available) emit('install')
  else showHelp.value = !showHelp.value
}
</script>

<template>
  <div
    v-if="mobile && !installed"
    class="space-y-4"
  >
    <UButton
      label="Installer l’application"
      icon="i-lucide-download"
      variant="outline"
      block
      :loading="busy"
      :disabled="busy"
      :aria-expanded="!available ? showHelp : undefined"
      @click="activate"
    />
    <div
      v-if="showHelp && !available"
      role="status"
      class="text-caption text-muted"
    >
      <p>{{ instructions }}</p>
      <ULink
        :to="documentationUrl"
        :aria-label="`Consulter la procédure officielle d’installation depuis ${browserName}`"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-flex min-h-11 items-center underline"
      >
        Consulter la procédure officielle
      </ULink>
    </div>
    <UAlert
      v-if="error"
      role="alert"
      color="error"
      variant="soft"
      :title="error"
    />
  </div>
</template>
