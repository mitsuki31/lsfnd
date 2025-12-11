/**
 * A test module for `lsfnd-sync` package designed for ECMAScript module (ESM).
 * @author Ryuu Mitsuki (https://github.com/mitsuki31)
 */

import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ls, lsFiles, lsDirs } from '../dist/lsfnd-sync.js';
import test from './lib/simpletest.js';
const { it, throws, doesNotThrow, deepEq } = test;  // Resolve import from CommonJS module

// Create the '__dirname' and '__filename' variable, because in ESM these are not defined
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve('..');
const rootDirPosix = rootDir.replaceAll(path.sep, '/');

console.log(`\n\x1b[1m${path.basename(__filename)}:\x1b[0m`);

it('test `ls` function by listing this file directory', () => {
  const results = ls(__dirname, { absolute: true }, 0);
  const expected = [
    'lib',
    'lsfnd.spec.cjs', 'lsfnd.spec.mjs',
    'lsfnd-sync.spec.cjs', 'lsfnd-sync.spec.mjs',
  ].map((e) => path.join(__dirname, e)).sort();
  deepEq(results, expected);
}, false);

it('test `lsFiles` function by listing this file directory', () => {
  const results = lsFiles(__dirname, { absolute: true });
  const expected = [
    'lsfnd.spec.cjs', 'lsfnd.spec.mjs',
    'lsfnd-sync.spec.cjs', 'lsfnd-sync.spec.mjs',
  ].map((e) => path.join(__dirname, e)).sort();
  deepEq(results, expected);
}, false);

it('test `lsDirs` function by listing this file directory', () => {
  const results = lsDirs(__dirname, { absolute: true });
  const expected = [ 'lib' ].map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('list root directory using URL object', () => {
  doesNotThrow(() => ls(pathToFileURL(rootDirPosix)), URIError);
}, false);

it('list root directory using file URL path', () => {
  doesNotThrow(() => ls(pathToFileURL(rootDirPosix)), URIError);
}, false);

it('test if the options argument allows explicit null value', () => {
  doesNotThrow(() => lsFiles(__dirname, null), TypeError);
}, false);

it('test if the type argument accepts a string value', () => {
  doesNotThrow(() => ls(__dirname, {}, 'LS_D'), TypeError);
}, false);

it("list this file directory with 'base64' encoding", () => {
  const results = ls(__dirname, { rootDir: __dirname, encoding: 'base64' });
  const expected = [
    'lib',
    'lsfnd.spec.cjs', 'lsfnd.spec.mjs',
    'lsfnd-sync.spec.cjs', 'lsfnd-sync.spec.mjs'
  ].map((e) => Buffer.from(e, 'utf8').toString('base64')).sort();
  deepEq(results, expected);
}, false);

// --- [ ERROR TESTS ] --- //

it('throws an error if the given directory path not exist', () => {
  throws(() => ls('./this/is/not/exist/directory/path'), Error);
}, false);

it('throws a URIError if the given file URL path using unsupported protocol',
  () => throws(() => ls('http:///'.concat(rootDirPosix)), URIError),
  false
);

it('throws a `TypeError` if the given type is an unexpected value',
  () => {
    throws(() => ls(__dirname, {}, 'LS_FOO'), TypeError);  // Invalid string value test
    throws(() => ls(__dirname, {}, []), TypeError);        // Array test
  },
  false
);

it('throws an error if the given encoding option is unknown', () => {
  throws(() => lsFiles(__dirname, { encoding: 'NotDefinedEncoding' }), TypeError);
  throws(() => lsFiles(__dirname, { encoding: true }), TypeError);
});
