/**
 * A module that offers some functions to read and list files and/or directories
 * in a specified directory with support filtering using regular expression pattern.
 *
 * @module  lsfnd-sync
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   1.2.0
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LsEntries, LsOptions, LsResult, LsTypes, StringPath } from '../types';
import { lsTypes } from './lsTypes';
import {
  checkType,
  encodeTo,
  resolveFileURL,
  resolveMatchExclude,
  resolveOptions,
} from './utils';

export * from './lsTypes';  // Re-export the `lsTypes` enum here

/**
 * **Synchronously** lists files and directories in a specified directory path, filtering by a
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
 * ### 1.2.0
 * Added in version 1.2.0.
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
 *               See {@link lsTypes} to check all supported types.
 *
 * @returns An array of string representing the entries result excluding `'.'` and `'..'`
 *          or an empty array (`[]`) if any files and directories does not match with the specified filter options.
 *
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
 *
 * @since 1.2.0
 * @see   {@link lsFiles}
 * @see   {@link lsDirs}
 * @see   {@link lsTypes}
 */
export function ls(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined,
  type?: LsTypes | undefined
): LsResult {
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
      checkType(type, [ ...Object.keys(lsTypes), ...Object.values(lsTypes), 0, null, undefined ]);

      let result: LsResult = null;
      try {
        // Read the specified directory path recursively
        const entries: LsEntries = fs.readdirSync(absdirpath, {
          encoding: usedEncoding,
          recursive: Boolean(resOptions.recursive)
        });
        // Declare the copy of the entries with UTF-8 encoding to be used by `fs.stat`,
        // this way we prevent the error due to invalid path thrown by `fs.stat` itself.
        const utf8Entries: LsEntries = encodeTo(entries, usedEncoding, 'utf8');

        // Filter the entries
        result =  utf8Entries.map(function (entry: StringPath): StringPath | null {
          entry = path.join(absdirpath, entry);
          let stats: fs.Stats | undefined;
          let resultType: boolean = false,
              isDir:      boolean = false,
              isFile:     boolean = false;

          // Try to retrieve the information of file system using `fs.statSync`
          try {
            stats = fs.statSync(entry);
          } catch (e: unknown) {
            // Attempt to open the entry using `fs.opendir` if the file system could not be
            // accessed because of a permission error or maybe access error. The function
            // is meant to be used with directories exclusively, which is helpful for
            // determining if an entry is a directory or a regular file. We can conclude that
            // the entry is a regular file if it throws an error. In this method, we can
            // avoid an internal error that occurs when try to access a read-protected file system,
            // such the "System Volume Information" directory on all Windows drives.
            try {
              const dir = fs.opendirSync(entry);
              isDir = true;  // Detected as a directory
              dir.close();
            } catch (eDir: unknown) {
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
          // Remove any null entries
          .filter((entry): entry is string => !!entry!);
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
 * **Synchronously** lists files in the specified directory path, filtering by a regular
 * expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific file names
 * using a regular expression.
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
 * ### 1.2.0
 * Added in version 1.2.0.
 *
 * </details>
 *
 * @param dirpath - The directory path to search, must be a **Node** path
 *                  (i.e., similar to POSIX path) or a valid file URL path.
 * @param options - Additional options for reading the directory. Refer to
 *                  {@link LsOptions} documentation for more details.
 *
 * @returns An array of string representing the entries result excluding `'.'` and `'..'`
*          or an empty array (`[]`) if any files does not match with the specified filter options.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
 *
 * @since 1.2.0
 * @see   {@link ls}
 * @see   {@link lsDirs}
 */
export function lsFiles(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): LsResult {
  return ls(dirpath, options, lsTypes.LS_F);
}

/**
 * **Synchronously** lists directories in the specified directory path, filtering by a regular
 * expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific directory names
 * using a regular expression.
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
 * ### 1.2.0
 * Added in version 1.2.0.
 *
 * </details>
 *
 * @param dirpath - The directory path to search, must be a **Node** path
 *                  (i.e., similar to POSIX path) or a valid file URL path.
 * @param options - Additional options for reading the directory. Refer to
 *                  {@link LsOptions} documentation for more details.
 *
 * @returns An array of string representing the entries result excluding `'.'` and `'..'`
 *          or an empty array (`[]`) if any directories does not match with the specified filter options.
 *
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error **Error**} -
 *         If there is an error occurred while reading a directory.
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the given URL path contains invalid file URL scheme or using
 *         unsupported protocols.
 *
 * @since 1.2.0
 * @see   {@link ls}
 * @see   {@link lsFiles}
 */
export function lsDirs(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): LsResult {
  return ls(dirpath, options, lsTypes.LS_D);
}
