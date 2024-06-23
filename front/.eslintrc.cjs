/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root         : true,
  'extends'    : [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  rules        : {
    'no-unused-vars'                    : 'off',
    'no-console'                        : 'off',
    'no-useless-catch'                  : 'off',
    'end-of-line'                       : 0,
    'no-case-declarations'              : 0,
    'linebreak-style'                   : 0,
    'vue/multi-word-component-names'    : 0,
    '@typescript-eslint/no-unused-vars' : 'off',
    'no-irregular-whitespace'           : 'off',
    'no-empty'                          : 'off',
    'no-extra-semi'                     : 'off',
    'no-extra-parens'                   : 'off',
    'no-extra-boolean-cast'             : 'off',
    'no-func-assign'                    : 'off',
    'no-unexpected-multiline'           : 'off',
    'no-unreachable'                    : 'off',
    'no-constant-condition'             : 'off',
    'no-cond-assign'                    : 'off',
    'no-multi-spaces'                   : 'off',
    'key-spacing'                       : 'off',
    'indent'                            : 'off',
    'space-before-function-paren'       : 'off',
    'semi'                              : 'off',
    'lines-between-class-members'       : 'off',
    'object-property-newline'           : 'off',
    'camelcase'                         : 'off',
    'spaced-comment'                    : 'off',
    'no-control-regex'                  : 'off',
    'keyword-spacing'                   : 'off',
    'no-tabs'                           : 'off',
    'no-lone-blocks'                    : 'off',
    'brace-style'                       : 'off',
    'block-spacing'                     : 'off',
    'space-infix-ops'                   : 'off',
    'space-before-block'                : 'off',
    'space-after-block'                 : 'off',
    'comma-spacing'                     : 'off',
    'arrow-spacing'                     : 'off',
    'comma-dangle'                      : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'object-curly-spacing'              : 'off',
    'no-trailing-spaces'                : 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'vue/max-attributes-per-line'       : 'off',
    'vue/no-unused-vars'                : 'off',
    'no-empty '                         : 'off',
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
};
