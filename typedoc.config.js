const pkg = require('./package.json');
/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  $schema: 'https://typedoc.org/schema.json',
  name: pkg.name.toUpperCase(),
  includeVersion: true,
  titleLink: pkg.repository.url.replace(/^git\+/, ''),
  entryPoints: [
    'src/lsfnd.ts',
    'types/index.d.ts',
    'types/build.prop.d.ts'
  ],
  out: `./docs`,
  readme: './README.md',
  tsconfig: './tsconfig.json',
  plugin: [ 'typedoc-material-theme', 'typedoc-plugin-extras' ],
  themeColor: '#2230f2',
  cacheBust: true,
  footerTypedocVersion: true,
  footerLastModified: true,
  lightHighlightTheme: 'github-light',
  darkHighlightTheme: 'material-theme-ocean',
  sort: true,
  useTsLinkResolution: true,
  gitRemote: 'origin',
  navigationLinks: {
    'GitHub': pkg.repository.url.replace(/^git\+/, '')
  },
  sidebarLinks: {
    'Report any issues': pkg.bugs.url + '/new'
  },
  logLevel: 'Verbose'
};