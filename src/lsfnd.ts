/**
 * A module that offers some functions to read and list files and/or directories
 * in a specified directory with support filtering using regular expression pattern.
 *
 * @module  lsfnd
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import type {
  LsEntries,
  LsOptions,
  LsResult,
  LsTypes,
  StringPath
} from '../types';
import { lsTypes } from './lsTypes';
import {
  type Unpack,
  resolveOptions,
  resolveMatchExclude,
  resolveFileURL,
  checkType,
  encodeTo,
} from './utils';

/**
 * Lists files and directories in a specified directory path, filtering by a
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
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
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
 * @see {@link lsFiles}
 * @see {@link lsDirs}
 * @see {@link lsTypes}
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirpath-options-callback fs.readdir}
 */
export async function ls(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined,
  type?: LsTypes | undefined
): Promise<LsResult> {
  let absdirpath: StringPath;
  let reldirpath: StringPath;
  const lsTypesValues = Object.fromEntries(Object.entries(lsTypes));

  // Resolve the options
  if (!(
    options instanceof RegExp ||
    (!options || (typeof options === 'object' && !Array.isArray(options)))))
  {
    throw new TypeError("Unknown type of 'options': "
      + (Array.isArray(options) ? 'array' : typeof options));
  }

  const resOptions = resolveOptions(options);
  const { encoding: usedEncoding } = resOptions;
  let { match: _match, exclude: _exclude } = resOptions;
  const match = resolveMatchExclude(_match);
  const exclude = _exclude ? resolveMatchExclude(_exclude) : undefined;

  if (!(dirpath instanceof URL) && typeof dirpath !== 'string') {
    throw new TypeError('Unknown type, expected a string or a URL object');
  }

  if (dirpath instanceof URL) {
    if (dirpath.protocol !== 'file:') {
      throw new URIError(`Unsupported protocol: '${dirpath.protocol}'`);
    }
    // We need to use `fileURLToPath` to ensure it converted to string path
    // correctly on Windows platform, after that replace all Windows path separator ('\')
    // with POSIX path separator ('/').
    dirpath = fileURLToPath(dirpath).replaceAll(/\\/g, '/');
  } else if (typeof dirpath === 'string' && /^[a-zA-Z]+:/.test(dirpath)) {
    dirpath = resolveFileURL(dirpath);
  }

  // Normalize the given path
  dirpath = path.normalize(dirpath);

  // Check and resolve the `rootDir` option
  if (resOptions.rootDir instanceof URL) {
    if (resOptions.rootDir.protocol !== 'file:') {
      throw new URIError(`Unsupported protocol: '${resOptions.rootDir.protocol}'`);
    }
    resOptions.rootDir = fileURLToPath(resOptions.rootDir).replaceAll(/\\/g, '/');
  } else if (typeof dirpath === 'string' && /^[a-zA-Z]+:/.test(resOptions.rootDir!)) {
    resOptions.rootDir = resolveFileURL(resOptions.rootDir!);
  }

  // Resolve the absolute and relative of the dirpath argument
  absdirpath = path.isAbsolute(dirpath)
    ? dirpath
    : path.posix.resolve(dirpath);
  reldirpath = path.relative(resOptions.rootDir ?? process.cwd(), absdirpath);;

  // Check the type argument
  checkType(type, [ ...Object.values(lsTypes), 0, null, undefined ]);

  let result: LsResult = null;
  try {
    // Read the specified directory path recursively
    const entries: LsEntries = await fs.promises.readdir(absdirpath, {
      encoding: usedEncoding,
      recursive: Boolean(resOptions.recursive)
    });
    // Declare the copy of the entries with UTF-8 encoding to be used by `fs.stat`,
    // this way we prevent the error due to invalid path thrown by `fs.stat` itself.
    const utf8Entries: LsEntries = encodeTo(entries, usedEncoding, 'utf8');

    // Filter the entries
    result = await Promise.all(
      utf8Entries.map(async function (entry: StringPath): Promise<StringPath | null> {
        entry = path.join(absdirpath, entry);
        let stats: fs.Stats | undefined;
        let resultType: boolean = false,
            isDir:      boolean = false,
            isFile:     boolean = false;

        // Try to retrieve the information of file system using `fs.stat`
        try {
          stats = await fs.promises.stat(entry);
        } catch (e: unknown) {
          // Attempt to open the entry using `fs.opendir` if the file system could not be
          // accessed because of a permission error or maybe access error. The function
          // is meant to be used with directories exclusively, which is helpful for
          // determining if an entry is a directory or a regular file. We can conclude that
          // the entry is a regular file if it throws an error. In this method, we can
          // avoid an internal error that occurs when try to access a read-protected file system,
          // such the "System Volume Information" directory on all Windows drives.
          try {
            // Notably, we do not want to use any synchronous functions and instead
            // want the process to be asynchronous.
            const dir = await fs.promises.opendir(entry);
            isDir = true;  // Detected as a directory
            await dir.close();
          } catch (eDir: unknown) {
            // If and only if the thrown error have a code "ENOTDIR",
            // then it treats the entry as a regular file. Otherwise, throw the error.
            if (eDir instanceof Error) {
              if ('code' in eDir && eDir.code === 'ENOTDIR') {
                isFile = true;  // Detected as a regular file
              } else {
                eDir.cause = e;
                throw eDir;
              }
            }
          }
        }

        // Don't worry about nullable values here, it will fallback to `LS_A`.
        // Otherwise, any non-nullable values (not including from `lsTypes`) will throwing an error.
        switch (type ?? lsTypes.LS_A) {
          case lsTypes.LS_D:
          case lsTypesValues[String(lsTypes.LS_D)]:
            resultType = (
              !(stats?.isFile() || isFile)
                && (stats?.isDirectory() || isDir)
            );
            break;
          case lsTypes.LS_F:
          case lsTypesValues[String(lsTypes.LS_F)]:
            resultType = (
              (stats?.isFile() || isFile)
                && !(stats?.isDirectory() || isDir)
            );
            break;
          case lsTypes.LS_A:
          case lsTypesValues[String(lsTypes.LS_A)]:
          case (0 as lsTypes):  // Special case
            resultType = (
              (stats?.isFile() || isFile)
                || (stats?.isDirectory() || isDir)
            );
            break;
          default:
            throw new TypeError(`Unknown value of 'type': ${type}`);
        }

        return ((
          resultType && (match.test(entry)  && (exclude ? !exclude.test(entry) : true))
        )
          ? (
            // *** High priority
            (resOptions.absolute && (resOptions.basename || !resOptions.basename))
                ? entry  // already an absolute path
                // *** Medium priority
                : (!resOptions.absolute && resOptions.basename)
                  ? path.basename(entry)  // get its basename
                  // *** Low priority
                  // convert back to the relative path
                  : path.join(reldirpath, path.relative(absdirpath, entry))
          )
          : null
        )
      })
    ).then(function (results: (Unpack<LsEntries> | null)[]): LsEntries {
      return results.filter(
        function (entry: Unpack<(typeof results)>): boolean {
          return !!entry!;  // Remove any null entries
        }
      ) as LsEntries;
    });
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
  }

  // Encode back the entries to the specified encoding
  if (result && usedEncoding !== 'utf8') {
    result = encodeTo(result, 'utf8', usedEncoding);
  }
  return (result ? result.sort() : result);
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
 *          if any files does not match with the specified filter options.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
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
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_F);
}

/**
 * Lists directories in the specified directory path, filtering by a regular
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
 *          if any directories does not match with the specified filter options.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
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
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_D);
}
