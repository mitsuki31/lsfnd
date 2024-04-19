/**
 * A test module for `lsfnd` package designed for CommonJS module (CJS).
 * @author Ryuu Mitsuki (https://github.com/mitsuki31)
 */

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { ls, lsFiles, lsDirs } = require('..');
const { it, rejects, doesNotReject, deepEq } = require('./lib/simpletest');

const rootDir = path.resolve('..');
const rootDirPosix = path.posix.resolve('..');

console.log(`\n\x1b[1m${path.basename(__filename)}:\x1b[0m`);

it('test `ls` function by listing this file directory', async () => {
  const results = await ls(__dirname, {}, 0);
  const expected = [ 'lib', 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('test `lsFiles` function by listing this file directory', async () => {
  const results = await lsFiles(__dirname);
  const expected = [ 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('list root directory using URL object', async () => {
  await doesNotReject(ls(pathToFileURL(rootDirPosix)), URIError);
}, false);

it('list root directory using file URL path', async () => {
  await doesNotReject(ls('file:'.concat(rootDirPosix)), URIError);
}, false);

it('test `lsDirs` function by listing this file directory', async () => {
  const results = await lsDirs(__dirname);
  const expected = [ 'lib' ].map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('throws an error if the given directory path not exist', async () => {
  await rejects(ls('./this/is/not/exist/directory/path'), Error);
}, false);

it('throws an URIError if the given file URL path using unsupported protocol',
  async () => await rejects(ls('http:'.concat(rootDirPosix)), URIError),
  false
);
