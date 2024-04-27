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
  const results = await ls(__dirname, { absolute: true }, 0);
  const expected = [ 'lib', 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('test `lsFiles` function by listing this file directory', async () => {
  const results = await lsFiles(__dirname, { absolute: true });
  const expected = [ 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => path.join(__dirname, e));
  deepEq(results, expected);
}, false);

it('test `lsDirs` function by listing this file directory', async () => {
  const results = await lsDirs(__dirname, { absolute: true });
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

it("list this file directory with 'base64' encoding", async () => {
  const results = await ls(__dirname, { rootDir: __dirname, encoding: 'base64' });
  const expected = [ 'lib', 'lsfnd.spec.cjs', 'lsfnd.spec.mjs' ]
    .map((e) => Buffer.from(e, 'utf8').toString('base64'));
  deepEq(results, expected);
}, false);

// --- [ ERROR TESTS ] --- //

it('throws an error if the given directory path not exist', async () => {
  await rejects(ls('./this/is/not/exist/directory/path'), Error);
}, false);

it('throws a `URIError` if the given file URL path using unsupported protocol',
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

it('throws an error if the given encoding option is unknown', async () => {
  await rejects(lsFiles(__dirname, { encoding: 'NotDefinedEncoding' }), TypeError);
  await rejects(lsFiles(__dirname, { encoding: true }), TypeError);
});
