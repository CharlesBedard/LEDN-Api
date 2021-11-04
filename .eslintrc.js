module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  plugins: [
    "@typescript-eslint",
    "prettier"
  ],
  extends: [
    "eslint-config-airbnb-base",
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    "prettier"
  ],
  "ignorePatterns": ["**/*/*spec.ts"],
  rules: {
    "no-console": 1,
    "prettier/prettier": 2,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 1,
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-shadow': 'off',
    'import/prefer-default-export': 'off',
    'no-useless-escape': 'off',
    'no-restricted-syntax': 1,
    'no-underscore-dangle': 'off',
    'no-useless-constructor': 'off',
    'no-empty-function': 1,
    'class-methods-use-this': 'off',
  },
};