<script setup lang="ts">
const props = withDefaults(defineProps<{
  available?: boolean
  installed?: boolean
  busy?: boolean
  error?: string
  instructions: string
}>(), { available: false, installed: false, busy: false, error: '' })
const emit = defineEmits<{ install: [] }>()
const showHelp = ref(false)
function activate() {
  if (props.available) emit('install')
  else showHelp.value = !showHelp.value
}
</script>

<template>
  <div
    v-if="!installed"
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
    <p
      v-if="showHelp && !available"
      role="status"
      class="text-caption text-muted"
    >
      {{ instructions }}
    </p>
    <UAlert
      v-if="error"
      role="alert"
      color="error"
      variant="soft"
      :title="error"
    />
  </div>
</template>
