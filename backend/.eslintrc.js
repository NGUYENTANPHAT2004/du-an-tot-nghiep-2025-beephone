module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'off',
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    '@typescript-eslint/no-var-requires': 'off'
  },
  globals: {
    require: 'readonly',
    module: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    process: 'readonly'
  }
}; 