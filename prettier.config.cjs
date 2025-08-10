/** @type {import('prettier').Config} */
module.exports = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: ['^react$', '^next(.*)$', '^@/(.*)$', '^[./]'],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
};
