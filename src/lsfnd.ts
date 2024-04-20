/**
 * A module that offers some functions to read and list files and/or directories
 * in a specified directory with support filtering using regular expression pattern.
 *
 * Copyright (c) 2024 Ryuu Mitsuki. All rights reserved.
 *
 * @module  lsfnd
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isRegExp } from 'node:util';
import { URL } from 'node:url';
import { lsTypes }  from './lsTypes';
import type {
  LsEntries,
  LsResult,
  LsOptions,
  LsTypesKeys,
  LsTypesValues
} from '../types';

type Unpack<A> = A extends Array<(infer U)> ? U : A;

/**
 * Converts a file URL to a file path.
 *
 * This function is similar to Node.js'
 * [`url.fileURLToPath`](https://nodejs.org/api/url.html#urlfileurltopathurl)
 * function, but with added support for relative file paths (e.g., `"file:./foo"`).
 * If the input URL does not adhere to the file URL scheme or if it contains
 * unsupported formats, such as providing unsupported protocols or invalid path
 * structures, an error will be thrown.
 *
 * @param url - The file URL to convert. It can be either an instance of `URL`
 *              or a string representing a file URL and must starts with `"file:"`
 *              protocol.
 * @returns     A string representing the corresponding file path.
 * @throws {URIError} If the URL is not a valid file URL or if it contains
 *                    unsupported formats.
 *
 * @example
 * // Convert a file URL to a file path
 * const filePath = fileUrlToPath('file:///path/to/file.txt');
 * console.log(filePath); // Output: "/path/to/file.txt"
 *
 * @example
 * // Handle relative file paths
 * const filePath = fileUrlToPath('file:./path/to/file.txt');
 * console.log(filePath); // Output: "./path/to/file.txt"
 *
 * @since 1.0.0
 * @see   {@link https://nodejs.org/api/url.html#urlfileurltopathurl url.fileURLToPath}
 *
 * @internal
 */
function fileUrlToPath(url: URL | string): string {
  if ((url instanceof URL && url.protocol !== 'file:')
      || (typeof url === 'string' && !/^file:(\/\/?|\.\.?\/*)/.test(url))) {
    throw new URIError('Invalid URL file scheme');
  }
  return (url instanceof URL) ? url.pathname : url.replace(/^file:/, '');
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
 * @throws TypeError - If the provided `type` doesn't match any of the valid types.
 *
 * @since 1.0.0
 * @internal
 */
function checkType<N extends null | undefined>(
  type: lsTypes | LsTypesKeys | LsTypesValues | N,
  validTypes: Array<(string | number | N)>
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
 * Lists files and/or directories in a specified directory path, filtering by a
 * regular expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific file and/or
 * directory names using a regular expression.
 *
 * The additional `options` can be an object or a regex pattern to specify only
 * the {@link LsOptions.match match} field. If passed as a `RegExp` object, the rest
 * options (except the `match` field) for reading the directory will uses default options.
 *
 * If the `options` argument not specified (or `undefined`), then it uses the
 * default value:
 * ```js
 * [LsOptions]: {
 *   encoding: 'utf8',
 *   recursive: false,
 *   match: /.+/,
 *   exclude: undefined
 * }
 * ```
 *
 * <br>
 * <details>
 * <summary><b>History</b></summary>
 *
 * ### 1.0.0
 * As of version 1.0.0, this function now accepts file URL paths. This can be
 * either a string URL path or a `URL` object, and it must follow the `'file:'` protocol.
 * An `URIError` will be thrown if the specified file URL path has invalid file
 * URL syntax or is used with unsupported protocols.
 *
 * ### 0.1.0
 * Added in version 0.1.0.
 *
 * </details>
 *
 * @param dirpath - The directory path to search, must be a **Node** path
 *                  (i.e., similar to POSIX path) or a valid file URL path.
 * @param options - Additional options for reading the directory. Refer to
 *                  {@link LsOptions} documentation for more details.
 * @param type - A type to specify the returned file system type to be included.
 *               If not specified or set to `0`, then it will includes all types
 *               (including regular files and directories).
 *               See {@link !lsTypes~lsTypes lsTypes} to check all supported types.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result excluding `'.'` and `'..'` or an empty array (`[]`)
 *          if any files and directories does not match with the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
 * @throws {URIError} If the given URL path contains invalid file URL scheme or
 *                    using unsupported protocols.
 *
 * @example
 * // List all installed packages in 'node_modules' directory
 * ls('node_modules', { exclude: /\.bin/ }, lsTypes.LS_D)
 *   .then((dirs) => console.log(dirs));
 *
 * @example
 * // List current directory using an URL object
 * const { pathToFileURL } = require('node:url');
 * // ESM: import { pathToFileURL } from 'node:url';
 * ls(pathToFileURL('.')).then((entries) =>
 *   console.log(entries));
 *
 * @since 0.1.0
 * @see {@link lsTypes}
 * @see {@link lsFiles}
 * @see {@link lsDirs}
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirpath-options-callback fs.readdir}
 */
export async function ls(
  dirpath: string | URL,
  options?: LsOptions | RegExp | undefined,
  type?:
    | lsTypes
    | LsTypesKeys
    | LsTypesValues
    | undefined
): Promise<LsResult> {
  let absdirpath: string;
  let match: string | RegExp,
      exclude: string | RegExp | undefined;

  if (dirpath instanceof URL) {
    if (dirpath.protocol !== 'file:') {
      throw new URIError(`Unsupported protocol: '${dirpath.protocol}'`);
    }
    dirpath = dirpath.pathname;   // Extract the path (without the protocol)
  } else if (typeof dirpath === 'string') {
    if (/^[a-zA-Z]+:/.test(dirpath)) {
      if (!dirpath.startsWith('file:')) {
        throw new URIError(`Unsupported protocol: '${dirpath.split(':')[0]}:'`);
      }
      dirpath = fileUrlToPath(dirpath);
    }
  } else {
    throw new Error('Unknown type, expected a string or an URL object');
  }

  // Resolve its absolute path
  absdirpath = path.isAbsolute(<string> dirpath)
    ? <string> dirpath
    : path.posix.resolve(<string> dirpath);

  if (isRegExp(options)) {
    match = options;
    exclude = undefined;
    options = { encoding: 'utf8', recursive: false };
  } else if (typeof options === 'undefined' || options === null) {
    options = { encoding: 'utf8', recursive: false };
    match = /.+/;
  } else if (options && typeof options === 'object' && !Array.isArray(options)) {
    match = (typeof options!.match === 'string')
      ? new RegExp(options!.match)
      : (isRegExp(options!.match) ? options!.match : /.+/);
    exclude = (typeof options!.exclude === 'string')
      ? new RegExp(options!.exclude)
      : (isRegExp(options!.exclude) ? options!.exclude : undefined);
  } else {
    throw new TypeError('Unknown type of "options": '
      + (Array.isArray(options) ? 'array' : typeof options));
  }

  // Check the type argument
  checkType(type!, [ ...Object.values(lsTypes), 0, null, undefined ]);

  let result: LsResult = null;
  try {
    // Read the specified directory path recursively
    const entries: LsEntries = await fs.promises.readdir(absdirpath, {
      encoding: options?.encoding || 'utf8',
      recursive: options?.recursive,
    });

    // Filter the entries
    result = await Promise.all(
      entries.map(async function (entry: string): Promise<(string | null)> {
        entry = path.join(<string> dirpath, entry);
        const stats: fs.Stats = await fs.promises.stat(entry);
        let resultType: boolean = false;

        switch (type) {
          case lsTypes.LS_D:
          case 'LS_D':
            resultType = (!stats.isFile() && stats.isDirectory());
            break;
          case lsTypes.LS_F:
          case 'LS_F':
            resultType = (stats.isFile() && !stats.isDirectory());
            break;
          default: resultType = (stats.isFile() || stats.isDirectory());
        }

        return (
          resultType && (
            (<RegExp> match).test(entry)
              && (exclude ? !(<RegExp> exclude).test(entry) : true)
          )
        ) ? entry : null;
      })
    ).then(function (results: Array<string | null>): LsEntries {
      return <LsEntries> results.filter(
        function (entry: Unpack<(typeof results)>): boolean {
          // Remove any null entries
          return !!entry!;
        }
      );
    });
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
  }
  return result;
}

/**
 * Lists files in the specified directory path, filtering by a regular
 * expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific file and/or
 * directory names using a regular expression.
 *
 * The additional `options` can be an object or a regex pattern to specify only
 * the {@link LsOptions.match match} field. If passed as a `RegExp` object, the rest
 * options (except the `match` field) for reading the directory will uses default options.
 *
 * If the `options` argument not specified (or `undefined`), then it uses the
 * default value:
 * ```js
 * [LsOptions]: {
 *   encoding: 'utf8',
 *   recursive: false,
 *   match: /.+/,
 *   exclude: undefined
 * }
 * ```
 *
 * <br>
 * <details>
 * <summary><b>History</b></summary>
 *
 * ### 1.0.0
 * As of version 1.0.0, this function now accepts file URL paths. This can be
 * either a string URL path or a `URL` object, and it must follow the `'file:'` protocol.
 * An `URIError` will be thrown if the specified file URL path has invalid file
 * URL syntax or is used with unsupported protocols.
 *
 * ### 0.1.0
 * Added in version 0.1.0.
 *
 * </details>
 *
 * @param dirpath - The directory path to search, must be a **Node** path
 *                  (i.e., similar to POSIX path) or a valid file URL path.
 * @param options - Additional options for reading the directory. Refer to
 *                  {@link LsOptions} documentation for more details.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result excluding `'.'` and `'..'` or an empty array (`[]`)
 *          if any files and directories does not match with the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
 * @throws {URIError} If the given URL path contains invalid file URL scheme or
 *                    using unsupported protocols.
 *
 * @example
 * // List all JavaScript files in current directory recursively,
 * // but excluding files from 'tests' directory
 * lsFiles('.', {
 *   recursive: true,
 *   match: /.+\.[cm]*js$/,
 *   exclude: /[\\/\\]\btests\b[\\/\\]/
 * }).then((files) => console.log(files));
 *
 * @since 0.1.0
 * @see {@link ls}
 * @see {@link lsDirs}
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirpath-options-callback fs.readdir}
 */
export async function lsFiles(
  dirpath: string | URL,
  options?: LsOptions | RegExp
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_F);
}

/**
 * Lists files in the specified directory path, filtering by a regular
 * expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific file and/or
 * directory names using a regular expression.
 *
 * The additional `options` can be an object or a regex pattern to specify only
 * the {@link LsOptions.match match} field. If passed as a `RegExp` object, the rest
 * options (except the `match` field) for reading the directory will uses default options.
 *
 * If the `options` argument not specified (or `undefined`), then it uses the
 * default value:
 * ```js
 * [LsOptions]: {
 *   encoding: 'utf8',
 *   recursive: false,
 *   match: /.+/,
 *   exclude: undefined
 * }
 * ```
 *
 * <br>
 * <details>
 * <summary><b>History</b></summary>
 *
 * ### 1.0.0
 * As of version 1.0.0, this function now accepts file URL paths. This can be
 * either a string URL path or a `URL` object, and it must follow the `'file:'` protocol.
 * An `URIError` will be thrown if the specified file URL path has invalid file
 * URL syntax or is used with unsupported protocols.
 *
 * ### 0.1.0
 * Added in version 0.1.0.
 *
 * </details>
 *
 * @param dirpath - The directory path to search, must be a **Node** path
 *                  (i.e., similar to POSIX path) or a valid file URL path.
 * @param options - Additional options for reading the directory. Refer to
 *                  {@link LsOptions} documentation for more details.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result excluding `'.'` and `'..'` or an empty array (`[]`)
 *          if any files and directories does not match with the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
 * @throws {URIError} If the given URL path contains invalid file URL scheme or
 *                    using unsupported protocols.
 *
 * @example
 * // Search and list directory named 'foo' in 'src' directory
 * lsDirs('src', {
 *   recursive: false,
 *   match: /[\\/\\]\bfoo\b/,
 * }).then((files) => console.log(files));
 *
 * @since 0.1.0
 * @see {@link ls}
 * @see {@link lsFiles}
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirpath-options-callback fs.readdir}
 */
export async function lsDirs(
  dirpath: string | URL,
  options?: LsOptions | RegExp
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_D);
}
