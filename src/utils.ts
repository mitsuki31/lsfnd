/**
 * Utility module for LSFND.
 *
 * @module  utils
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   1.2.0
 * @license MIT
 */

import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StringPath, LsTypes, LsOptions, ResolvedLsOptions } from '../types';
import { defaultLsOptions, FILE_URL_PATTERN, WIN32_PATH_PATTERN } from './constants';

export type Unpack<A> = A extends (infer U)[] ? U : A;

/**
 * Checks if the given string path is a Windows path.
 *
 * Before checking, the given path will be normalized first.
 *
 * @param p - The string path to be checked for.
 * @returns   `true` if the given path is a Windows path, `false` otherwise.
 * @see       {@link WIN32_PATH_PATTERN}
 *
 * @internal
 */
export function isWin32Path(p: StringPath): boolean {
  p = path.normalize(p.trim());
  return !!p && WIN32_PATH_PATTERN.test(p);
}

/**
 * Resolves a file URL to a file path.
 *
 * @param {StringPath} p
 *        The file URL to resolve. It should be a string representing
 *        a valid file URL following the **WHATWG URL Standard**.
 * @returns {StringPath}
 *          The resolved file path. If the provided URL is valid,
 *          it returns the corresponding file path.
 * @throws {URIError}
 *         If the provided file URL scheme is invalid. This can occur
 *         if the URL scheme is not recognized or if it does not conform
 *         to the expected format.
 *
 * @remarks
 * This function is used to convert a file URL to a file path. It first checks
 * if the provided URL matches the expected pattern for file URLs. If it does,
 * it proceeds to resolve the URL to a file path. If the URL scheme is not recognized
 * or is invalid, a `URIError` is thrown.
 *
 * If the provided URL is `'file://'` or `'file:///'`, it is replaced with the root directory
 * path (in the current drive for Windows systems). Otherwise, the URL is parsed using the
 * `fileURLToPath` function.
 *
 * If the operating system is not Windows and the provided URL contains a Windows-style path,
 * or if the operating system is Windows and the URL does not start with 'file:', an error is
 * thrown indicating an invalid file URL scheme.
 * 
 * @example
 * // POSIX Path
 * const fooPath = resolveFileURL('file:///path/to/foo.txt');
 * console.log(filePath);  // Output: '/path/to/foo.txt'
 *
 * @example
 * // Windows Path
 * const projectsPath = resolveFileURL('file:///G:/Projects');
 * console.log(projectsPath);  // Output: 'G:\\Projects'
 *
 * @see {@link https://url.spec.whatwg.org/ WHATWG URL Standard}
 * @internal
 */
export function resolveFileURL(p: StringPath): StringPath {
  if (FILE_URL_PATTERN.test(p)) {
    // If and only if the given path is 'file://' or 'file:///'
    // then replace the path to root directory (in current drive for Windows systems).
    // When the specified above URL path being passed to `fileURLPath` function,
    // it throws an error due to non-absolute URL path was given.
    if (/^file:(?:\/\/\/?)$/.test(p)) p = '/';
    // Otherwise, parse the file URL path
    else p = fileURLToPath(p);
  } else if ((os.platform() !== 'win32'
      && (isWin32Path(p) || !p.startsWith('file:')))
      || (os.platform() === 'win32'
        && !(isWin32Path(p) || p.startsWith('file:')))) {
    throw new URIError('Invalid file URL scheme');
  }
  return p;
}

/**
 * Normalize a match-exclusion value into a {@link RegExp},
 * used for resolving the {@link LsOptions.match match} and
 * {@link LsOptions.exclude exclude} options.
 *
 * If `val` is already a `RegExp` it is returned as-is. If `val` is a string
 * ({@link StringPath}) a new `RegExp` is constructed from that string.
 *
 * @remarks
 * When passing a string, do not include JavaScript regex delimiters (`/`).
 * If you need flags (e.g. `i`), provide a `RegExp` instance instead.
 *
 * @param val - A string pattern or a `RegExp` to normalize.
 * @returns     A `RegExp` instance representing the provided pattern.
 *
 * @throws {SyntaxError} If the provided string is not a valid regular expression.
 *
 * @example
 * // from string
 * resolveMatchExclude('^/api') // => new RegExp('^/api')
 *
 * // already a RegExp
 * const r = /\.test\.js$/i;
 * resolveMatchExclude(r) // => r
 *
 * @since    1.2.0
 * @internal
 */
export function resolveMatchExclude(val: StringPath | RegExp): RegExp {
  return typeof val === 'string' ? new RegExp(val) : val;
}

/**
 * Checks if a provided type matches any of the allowed types.
 *
 * This function verifies if a provided `type` argument matches any of the
 * allowed types specified in the `validTypes` array. It throws a `TypeError`
 * if the `type` doesn't match any valid type.
 *
 * @param type - The type value to be checked.
 * @param validTypes - An array containing the allowed types for the `type` parameter.
 *
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/TypeError **TypeError**} -
 *         If the provided `type` doesn't match any of the valid types.
 *
 * @since 1.0.0
 * @internal
 */
export function checkType(
  type: LsTypes | null | undefined,
  validTypes: (string | number | null | undefined)[]
): void {
  function joinAll(arr: (typeof validTypes), delim: string): string {
    let str: string = '';
    arr.forEach((e: Unpack<(typeof validTypes)>, i: number) => {
      if (i > 0 && i <= arr.length - 1) str += delim;
      str += (typeof e === 'string') ? `'${e}'`
        : (e === null) ? 'null'
          : (typeof e === 'undefined') ? 'undefined' : e;
    });
    return str;
  }

  let match: boolean = false;
  validTypes.forEach((validType: Unpack<(typeof validTypes)>) => {
    if (!match && type === validType) match = true;
  });

  if (!match) {
    throw new TypeError(
      `Invalid 'type' value of ${type} ('${typeof type}'). Valid type is "${
        joinAll(validTypes.sort(), ' | ')
      }"`);
  }
  return;
}

/**
 * Resolves the given `options` into a fully defined {@link ResolvedLsOptions} object.
 *
 * This function takes an optional `options` parameter, which can be an {@link LsOptions} object,
 * a {@link RegExp} to specify the match pattern, or `null`/`undefined` to use defaults.
 * If a `RegExp` is provided, it creates a resolved options object with default values except
 * for the `match` field, which is set to the provided `RegExp`.
 * If `options` is an object, it merges the provided options with the defaults, ensuring all
 * properties are defined. Otherwise, it returns the default options.
 *
 * @param options - The options to resolve. Can be an {@link LsOptions} object, a {@link RegExp}
 *                  to set the match pattern, or `null`/`undefined` for defaults.
 * @returns A new {@link ResolvedLsOptions} object with all properties defined.
 *
 * @example
 * // Using default options
 * const opts = resolveOptions(null);
 * console.log(opts.match); // /.+/
 *
 * @example
 * // Using a RegExp for match
 * const opts = resolveOptions(/\.js$/);
 * console.log(opts.match); // /\.js$/
 *
 * @since 1.0.0
 * @internal
 */
export function resolveOptions(options?: LsOptions | RegExp | null): ResolvedLsOptions {
  if (options instanceof RegExp) {
    const resolved = { ...defaultLsOptions };
    resolved.match = options;
    return resolved;
  }

  return (!options || (options && typeof options !== 'object')) ? { ...defaultLsOptions } : {
    encoding: options?.encoding?.trim() as BufferEncoding ?? defaultLsOptions.encoding,
    recursive: options?.recursive ?? defaultLsOptions.recursive,
    match: options?.match ?? defaultLsOptions.match,
    exclude: options?.exclude ?? defaultLsOptions.exclude,
    rootDir: options?.rootDir ?? defaultLsOptions.rootDir,
    absolute: options?.absolute ?? defaultLsOptions.absolute,
    basename: options?.basename ?? defaultLsOptions.basename
  } satisfies ResolvedLsOptions;
}

/**
 * Encodes a string or an array of strings from one encoding to another.
 * 
 * This function offers simplicity and flexibility by allowing encoding conversion
 * between different encodings for either a string or a set of strings.
 *
 * @param val - The string to encode.
 * @param from - The encoding of the input string.
 * @param to - The encoding to convert the string to.
 * 
 * @returns The encoded string.
 *
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/TypeError **TypeError**} -
 *         If the `from` or `to` encoding is unknown, or if the input value is
 *         neither a string nor an array of strings.
 * 
 * @example
 * Encode a string to 'base64' encoding:
 * ```js
 * const encodedString = encodeTo('Hello, world!', 'utf8', 'base64');
 * console.log(encodedString);
 * // Output: 'SGVsbG8sIHdvcmxkIQ=='
 * ```
 *
 * Encode an array of strings to 'hex' encoding:
 * ```js
 * const encodedArray = encodeTo(['Hello', 'world'], 'utf8', 'hex');
 * console.log(encodedArray);
 * // Output: ['48656c6c6f', '776f726c64']
 * ```
 *
 * @since 1.0.0
 * @internal
 */
export function encodeTo(
  val: string,
  from: BufferEncoding,
  to: BufferEncoding
): string;
/**
 * @param val - The array of strings to encode.
 * @param from - The encoding of the input strings.
 * @param to - The encoding to convert the strings to.
 * 
 * @returns The array of encoded strings.
 */
export function encodeTo(
  val: string[],
  from: BufferEncoding,
  to: BufferEncoding
): string[];

export function encodeTo(
  val: string | string[],
  from: BufferEncoding,
  to: BufferEncoding
): string | string[] {
  const { isEncoding } = Buffer;
  if (!isEncoding(from)) throw new TypeError("Unknown 'from' encoding: " + from);
  else if (!isEncoding(to)) throw new TypeError("Unknown 'to' encoding: " + to);
  else if (!(typeof val === 'string' || Array.isArray(val))) {
    throw new TypeError('Expected a string or an array of string');
  }

  if (typeof val === 'string') {
    return Buffer.from(val, from).toString(to);
  }

  return val.map(function (v: string): string {
    return Buffer.from(v, from).toString(to);
  });
}
