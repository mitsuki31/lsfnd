const { resolve } = require('node:path');
/** @type {import('./types/build.prop').BuildPropConfig} */
module.exports = {
  minify: {
    files: [
      'dist/index.js',
      'dist/lsfnd.js'
    ]
  },
  rootDir: resolve(__dirname),
  outDir: resolve('dist'),
  tsconfig: 'tsconfig.production.json',
};