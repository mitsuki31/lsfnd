/**
 * A simple testing library that provides basic assertion functions for unit
 * testing. It leverages the built-in `node:assert` module for core functionality
 * and offers a custom {@link module:simpletest~TestError} class for identifying
 * testing errors.
 *
 * @example
 * it('should add two numbers correctly', () => {
 *   const result = 2 + 3;
 *   eq(result, 5);
 * });
 *
 * it('should throw a TypeError for invalid URL', () => {
 *   throws(() => new URL(100), TypeError);
 * });
 *
 * @module  simpletest
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @license MIT
 */
'use strict';

const assert = require('node:assert');

/**
 * A custom class representing the error thrown by {@link module:simpletest~it} function.
 */
class TestError extends Error {
  constructor(message, opts) {
    super(message, opts);  // Important
    this.name = 'TestError';
  }
}

/**
 * A function used to define a test case.
 * 
 * @param {string} desc - A string describing the test case.
 * @param {Function} func - The function containing the test logic.
 * @param {boolean} [continueOnErr=false] - Whether to continue when error occurred.
 * @throws {TestError} If there is an error occurred in test logic.
 */
async function it(desc, func, continueOnErr=false) {
  const { isAsyncFunction } = require('node:util').types;
  try {
    isAsyncFunction(func) ? await func() : func();
    console.log(`  \x1b[92m\u2714 \x1b[0m\x1b[2m${desc}\x1b[0m`);
  } catch (err) {
    console.error(`  \x1b[91m\u2718 \x1b[0m${desc}\n`);
    console.error(new TestError('Test failed!', { cause: err }));
    !!continueOnErr || process.exit(1);  // Force terminate the process
  }
}

module.exports = {
  TestError,
  it,
  eq: assert.strictEqual,
  notEq: assert.notStrictEqual,
  ok: assert.ok,
  fail: assert.fail,
  deepEq: assert.deepStrictEqual,
  notDeepEq: assert.notDeepStrictEqual,
  throws: assert.throws,
  doesNotThrow: assert.doesNotThrow,
  rejects: assert.rejects,
  doesNotReject: assert.doesNotReject,
  match: assert.match,
  doesNotMatch: assert.doesNotMatch
};
