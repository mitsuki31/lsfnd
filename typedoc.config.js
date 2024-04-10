const pkg = require('./package.json');
/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  $schema: 'https://typedoc.org/schema.json',
  name: pkg.name.toUpperCase(),
  includeVersion: true,
  entryPoints: [
    'src/index.ts',
    'src/lsfnd.ts'
  ],
  out: `./docs/${pkg.name}`,
  readme: './README.md',
  tsconfig: './tsconfig.json',
  plugin: [ 'typedoc-material-theme' ],
  themeColor: '#3a59ef',
  lightHighlightTheme: 'github-light',
  darkHighlightTheme: 'material-theme-ocean',
  sort: true,
  useTsLinkResolution: false,
  gitRemote: pkg.repository.url.replace(/^git\+/, ''),
  navigationLinks: {
    'GitHub': pkg.repository.url.replace(/^git\+/, '')
  },
  sidebarLinks: {
    'Report an issue': pkg.bugs.url + '/new'
  },
  logLevel: 'Verbose'
};