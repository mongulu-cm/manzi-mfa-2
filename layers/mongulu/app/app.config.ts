export default defineAppConfig({
  ui: {
    colors: {
      primary: 'forest',
      neutral: 'stone',
    },
    alert: {
      compoundVariants: [{ variant: 'soft', class: { title: 'text-default', description: 'text-default' } }],
    },
    button: {
      slots: {
        base: 'min-h-11 rounded-full font-semibold',
        label: 'whitespace-normal',
      },
      variants: {
        size: {
          xl: { base: 'px-8 py-3 text-button' },
        },
      },
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'hover:bg-(--mongulu-button-hover) active:bg-(--mongulu-button-active) text-white hover:text-white' },
      ],
      defaultVariants: { size: 'xl' },
    },
  },
})
