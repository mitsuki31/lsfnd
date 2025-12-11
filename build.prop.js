const { join } = require('node:path');
/** @type {import('./types/build.prop').BuildPropConfig} */
module.exports = {
  minify: {
    files: [
      'dist/index.js',
      'dist/lsfnd.js',
      'dist/lsfnd-sync.js',
      'dist/lsTypes.js'
    ]
  },
  rootDir: __dirname,
  outDir: join(__dirname, 'dist'),
  tsconfig: 'tsconfig.production.json'
};