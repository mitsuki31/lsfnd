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
import { URL, fileURLToPath } from 'node:url';
import { lsTypes }  from './lsTypes';
import type {
  StringPath,
  LsEntries,
  LsResult,
  LsOptions,
  ResolvedLsOptions,
  DefaultLsOptions,
  LsTypes
} from '../types';

type Unpack<A> = A extends Array<(infer U)> ? U : A;

/**
 * A regular expression pattern to parse the file URL path,
 * following the WHATWG URL Standard.
 * 
 * @see {@link https://url.spec.whatwg.org/ WHATWG URL Standard}
 * @internal
 */
const FILE_URL_PATTERN: RegExp = /^file:\/\/\/?(?:[A-Za-z]:)?(?:\/[^\s\\]+)*(?:\/)?/;

/**
 * A regular expression pattern to parse and detect the Windows path.
 *
 * @internal
 */
const WIN32_PATH_PATTERN: RegExp = /^[A-Za-z]:?(?:\\|\/)(?:[^\\/:*?"<>|\r\n]+(?:\\|\/))*[^\\/:*?"<>|\r\n]*$/;

/**
 * An object containing all default values of {@link LsOptions `LsOptions`} type.
 *
 * @since 1.0.0
 * @see   {@link DefaultLsOptions}
 * @see   {@link LsOptions}
 */
export const defaultLsOptions: DefaultLsOptions = {
  encoding: 'utf8',
  recursive: false,
  match: /.+/,
  exclude: undefined,
  rootDir: process.cwd(),
  absolute: false,
  basename: false
} as const;

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
 * @throws {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/URIError **URIError**} -
 *         If the URL is not a valid file URL or if it contains unsupported formats.
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
function fileUrlToPath(url: URL | StringPath): StringPath {
  if ((url instanceof URL && url.protocol !== 'file:')
      || (typeof url === 'string' && !/^file:(\/\/?|\.\.?\/*)/.test(url))) {
    throw new URIError('Invalid URL file scheme');
  }
  return (url instanceof URL)
    ? fileURLToPath(url).replaceAll(/\\/g, '/')
    : url.replace(/^file:/, '');
}

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
function isWin32Path(p: StringPath): boolean {
  p = path.normalize(p);
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
function resolveFileURL(p: StringPath): StringPath {
  if (FILE_URL_PATTERN.test(p)) {
    // If and only if the given path is 'file://' or 'file:///'
    // then replace the path to root directory (in current drive for Windows systems).
    // When the specified above URL path being passed to `fileURLPath` function,
    // it throws an error due to non-absolute URL path was given.
    if (/^file:(?:\/\/\/?)$/.test(p)) p = '/';
    // Otherwise, parse the file URL path
    else p = fileURLToPath(p);
  } else if ((os.platform() !== 'win32' && isWin32Path(p))
      || (os.platform() === 'win32'
        && !(isWin32Path(p) || p.startsWith('file:')))) {
    throw new URIError('Invalid file URL scheme');
  }
  return p;
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
function checkType<N extends null | undefined>(
  type: LsTypes | N,
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
      `Invalid 'type' value of ${<string> type} ('${typeof type}'). Valid type is "${
        joinAll(validTypes.sort(), ' | ')
      }"`);
  }
  return;
}

/**
 * Resolves the given `options` ({@link LsOptions}).
 *
 * @param options - An object represents the options to be resolved. Set to `null`
 *                  or `undefined` to gets the default options.
 * @returns A new object represents the resolved options. Returns the default
 *          options if the `options` parameter not specified or `null`.
 *
 * @since 1.0.0
 * @internal
 */
function resolveOptions(options: LsOptions | null | undefined): ResolvedLsOptions {
  return <ReturnType<(typeof resolveOptions)>> (!options ? defaultLsOptions : {
    encoding: options?.encoding || defaultLsOptions.encoding,
    recursive: options?.recursive || defaultLsOptions.recursive,
    match: options?.match || defaultLsOptions.match,
    exclude: options?.exclude || defaultLsOptions.exclude,
    rootDir: options?.rootDir || defaultLsOptions.rootDir,
    absolute: options?.absolute || defaultLsOptions.absolute,
    basename: options?.basename || defaultLsOptions.basename
  });
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
function encodeTo(
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
function encodeTo(
  val: Array<string>,
  from: BufferEncoding,
  to: BufferEncoding
): Array<string>;

function encodeTo(
  val: string | Array<string>,
  from: BufferEncoding,
  to: BufferEncoding
): string | Array<string> {
  const { isEncoding } = Buffer;
  if (!isEncoding(from)) throw new TypeError("Unknown 'from' encoding: " + from);
  else if (!isEncoding(to)) throw new TypeError("Unknown 'to' encoding: " + to);
  else if (!(typeof val === 'string' || Array.isArray(val))) {
    throw new TypeError('Expected a string or an array of string');
  }

  if (typeof val === 'string') {
    return Buffer.from(val, from).toString(to);
  }

  return (<Array<string>> val).map(function (v: string): string {
    return Buffer.from(v, from).toString(to);
  });
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
  let absdirpath: StringPath,
      reldirpath: StringPath;
      
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

  if (options instanceof RegExp) {
    // Store the regex value of `options` to temporary variable for `match` option
    const temp: RegExp = new RegExp(options.source) || options;
    options = <LsOptions> resolveOptions(null);  // Use the default options
    (<LsOptions> options)!.match = temp;  // Reassign the `match` field
  } else if (!options || (typeof options === 'object' && !Array.isArray(options))) {
    // Resolve the options, even it is not specified
    options = <LsOptions> resolveOptions(options);
  } else {
    throw new TypeError("Unknown type of 'options': "
      + (Array.isArray(options) ? 'array' : typeof options));
  }

  // Check and resolve the `rootDir` option
  if (options.rootDir instanceof URL) {
    if (options.rootDir.protocol !== 'file:') {
      throw new URIError(`Unsupported protocol: '${options.rootDir.protocol}'`);
    }
    options.rootDir = fileURLToPath(options.rootDir).replaceAll(/\\/g, '/');
  } else if (typeof dirpath === 'string' && /^[a-zA-Z]+:/.test(options.rootDir!)) {
    options.rootDir = resolveFileURL(options.rootDir!);
  }

  // Resolve the absolute and relative of the dirpath argument
  absdirpath = path.isAbsolute(<StringPath> dirpath)
    ? <StringPath> dirpath
    : path.posix.resolve(<StringPath> dirpath);
  reldirpath = path.relative(options.rootDir! || process.cwd(), absdirpath);;

  // Check the type argument
  checkType(type!, [ ...Object.values(lsTypes), 0, null, undefined ]);

  let result: LsResult = null;
  try {
    // Read the specified directory path recursively
    const entries: LsEntries = await fs.promises.readdir(absdirpath, {
      encoding: options?.encoding || 'utf8',
      recursive: options?.recursive
    });
    // Declare the copy of the entries with UTF-8 encoding to be used by `fs.stat`,
    // this way we prevent the error due to invalid path thrown by `fs.stat` itself.
    const utf8Entries: LsEntries = encodeTo(entries, options?.encoding!, 'utf8');

    // Filter the entries
    result = await Promise.all(
      utf8Entries.map(async function (entry: StringPath): Promise<(StringPath | null)> {
        entry = path.join(absdirpath, entry);
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

        return ((
          resultType && (
            (<RegExp> options.match).test(entry)
              && (options.exclude ? !(<RegExp> options.exclude).test(entry) : true)
          )
        )
          ? (
            // *** High priority
            (options.absolute && (options.basename || !options.basename))
                ? entry  // already an absolute path
                // *** Medium priority
                : (!options.absolute && options.basename)
                  ? path.basename(entry)  // get its basename
                  // *** Low priority
                  // convert back to the relative path
                  : path.join(reldirpath, path.relative(absdirpath, entry))
          )
          : null
        )
      })
    ).then(function (results: (Unpack<LsEntries> | null)[]): LsEntries {
      return <LsEntries> results.filter(
        function (entry: Unpack<(typeof results)>): boolean {
          return !!entry!;  // Remove any null entries
        }
      );
    });
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
  }

  // Encode back the entries to the specified encoding
  if (result && options?.encoding! !== 'utf8')
    result = encodeTo(result, 'utf8', options.encoding!);
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
