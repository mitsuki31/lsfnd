/**
 * A test module for `lsfnd` package designed for ECMAScript module (ESM).
 * @author Ryuu Mitsuki (https://github.com/mitsuki31)
 */

import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ls, lsFiles, lsDirs } from '../dist/index.js';
import test from './lib/simpletest.js';
const { it, rejects, doesNotReject, deepEq } = test;  // Resolve import from CommonJS module

// Create the '__dirname' and '__filename' variable, because in ESM these are not defined
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

it('test `lsDirs` function by listing this file directory', async () => {
  const results = await lsDirs(__dirname);
  const expected = [ 'lib' ].map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('list root directory using URL object', async () => {
  await doesNotReject(ls(pathToFileURL(rootDirPosix)), URIError);
}, false);

it('list root directory using file URL path', async () => {
  await doesNotReject(ls('file:'.concat(rootDirPosix)), URIError);
}, false);

it('test if the options argument allows explicit null value', async () => {
  await doesNotReject(lsFiles(__dirname, null), TypeError);
}, false);

it('test if the type argument accepts a string value', async () => {
  await doesNotReject(ls(__dirname, {}, 'LS_D'), TypeError);
}, false);

it('throws an error if the given directory path not exist', async () => {
  await rejects(ls('./this/is/not/exist/directory/path'), Error);
}, false);

it('throws an URIError if the given file URL path using unsupported protocol',
  async () => await rejects(ls('http:'.concat(rootDirPosix)), URIError),
  false
);

it('throws a `TypeError` if the given type is an unexpected value',
  async () => {
    await rejects(ls(__dirname, {}, 'LS_FOO'), TypeError);  // Invalid string value test
    await rejects(ls(__dirname, {}, []), TypeError);        // Array test
  },
  false
);
