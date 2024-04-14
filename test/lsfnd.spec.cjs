const { join, basename } = require('node:path');
const { ls, lsFiles, lsDirs } = require('..');
const { it, rejects, deepEq } = require('./lib/simpletest');

console.log(`\n\x1b[1m${basename(__filename)}:\x1b[0m`);

it('test `ls` function by listing this file directory', async () => {
  const results = await ls(__dirname, {}, 0);
  const expected = [ 'lib', 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => join(__dirname, e));
  deepEq(results, expected);
}, false);

it('test `lsFiles` function by listing this file directory', async () => {
  const results = await lsFiles(__dirname);
  const expected = [ 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => join(__dirname, e));
  deepEq(results, expected);
}, false);

it('test `lsDirs` function by listing this file directory', async () => {
  const results = await lsDirs(__dirname);
  const expected = [ 'lib' ].map((e) => join(__dirname, e));
  deepEq(results, expected);
}, false);

it('throws an error if given directory path not exist', async () => {
  await rejects(ls('./this/is/not/exist/directory/path'), Error);
}, false);
