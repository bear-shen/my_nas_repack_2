/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root         : true,
  'extends'    : [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  rules        : {
    'no-unused-vars'                   : 'off',
    'no-console'                       : 'off',
    'no-useless-catch'                 : 'off',
    'end-of-line'                      : 0,
    'no-case-declarations'             : 0,
    'linebreak-style'                  : 0,
    'vue/multi-word-component-names'   : 0,
    '@typescript-eslint/no-unused-vars': 'off'
    // 'prettier/prettier': ['error', {
    //   'semi'       : false,
    //   'endOfLine'  : 'auto',
    //   'singleQuote': false,
    // }
    // ]
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
