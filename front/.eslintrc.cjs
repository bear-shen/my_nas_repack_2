/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  rules:{
    'no-unused-vars'  : 'off',
    'no-console'      : 'off',
    'no-useless-catch': 'off',
    'linebreak-style': 0,
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }

}
