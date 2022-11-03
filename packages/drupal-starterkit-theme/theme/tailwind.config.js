module.exports = {
  mode: 'jit',
  important: false,
  darkMode: 'class',
  content: [
    './templates/**/*.twig',
    './templates/**/*.yml',
    './templates/**/*.mdx',
    './templates/**/*.ts',
    './templates/**/*.tsx',
    './templates/**/*.ce.vue',
    '../../../../config/sync/*.yml',
  ],
  safelist: [
    'form-input',
    'form-textarea',
    'form-select',
    'form-multiselect',
    'form-checkbox',
    'form-radio',
  ],
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}
