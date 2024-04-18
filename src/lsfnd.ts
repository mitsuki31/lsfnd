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
import { lsTypes }  from './lsTypes';
import type {
  LsEntries,
  LsResult,
  LsOptions,
  LsTypesKeys,
  LsTypesValues
} from '../types';

/**
 * Lists files and/or directories in a specified directory path, filtering by a
 * regular expression pattern.
 *
 * The returned entries are configurable using the additional {@link LsOptions options},
 * such as listing recursively to subdirectories, and filter specific file and/or
 * directory names using a regular expression.
 *
 * The additional `options` can be an object or a regex pattern to specify only
 * the {@link LsOptions.match} field. If passed as a `RegExp` object,
 * the additional options for reading the directory will uses default options.
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
 * @param dirpath - The directory path to search.
 * @param options - Additional options for reading the directory.
 * @param type - A type to specify the returned file system type to be included.
 *               If not specified or set to `0`, then it will includes all types
 *               (including regular files and directories).
 *               See {@link !lsTypes~lsTypes lsTypes} to check all supported types.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result or an empty array if any files and directories doesn't
 *          match with the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
 *
 * @example
 * // List all installed packages in 'node_modules' directory
 * ls('node_modules', { exclude: /\.bin/ }, lsTypes.LS_D)
 *   .then((dirs) => console.log(dirs));
 *
 * @since 0.1.0
 * @see {@link lsTypes}
 * @see {@link lsFiles}
 * @see {@link lsDirs}
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirpath-options-callback fs.readdir}
 */
export async function ls(
  dirpath: string,
  options?: LsOptions | RegExp | undefined,
  type?:
    | lsTypes
    | LsTypesKeys
    | LsTypesValues
    | undefined
): Promise<LsResult> {
  const absdirpath: string = path.resolve(dirpath);
  let match: string | RegExp,
      exclude: string | RegExp | undefined;

  if (isRegExp(options)) {
    match = options;
    exclude = undefined;
    options = { encoding: 'utf8', recursive: false };
  } else if (typeof options === 'object') {
    match = (typeof options!.match === 'string')
      ? new RegExp(options!.match)
      : (isRegExp(options!.match) ? options!.match : /.+/);
    exclude = (typeof options!.exclude === 'string')
      ? new RegExp(options!.exclude)
      : (isRegExp(options!.exclude) ? options!.exclude : undefined);
  } else if (typeof options === 'undefined' || options === null) {
    options = { encoding: 'utf8', recursive: false };
    match = /.+/;
  } else {
    throw new TypeError('Unknown type of "options": ' + typeof options);
  }

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
        entry = path.join(dirpath, entry);
        const stats: fs.Stats = await fs.promises.stat(entry);
        let resultType: boolean = false;

        switch (type) {
          case lsTypes.LS_D:
            resultType = (!stats.isFile() && stats.isDirectory());
            break;
          case lsTypes.LS_F:
            resultType = (stats.isFile() && !stats.isDirectory());
            break;
          // If set to `LS_A` or not known value, default to include all types
          default: resultType = true;
        }

        return (
          resultType && (
            (<RegExp> match).test(entry)
              && (exclude ? !(<RegExp> exclude).test(entry) : true)
          )
        ) ? entry : null;
      })
    ).then(function (results: Array<string | null>): LsEntries {
      return <LsEntries> results.filter(function (entry: string | null): boolean {
        // Remove any null entries
        return !!entry!;
      });
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
 * the {@link LsOptions.match} field. If passed as a `RegExp` object,
 * the additional options for reading the directory will uses default options.
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
 * @param dirpath - The directory path to search.
 * @param options - Additional options for reading the directory.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result or an empty array if any files doesn't match with
 *          the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
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
  dirpath: string,
  options?: LsOptions | RegExp
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_F);
}

/**
 * Lists files in the specified directory path, filtering by a regular
 * expression pattern.
 *
 * The returned entries are configurable using the additional `options`, such as
 * listing recursively to subdirectories, and filter specific file and/or
 * directory names using a regular expression.
 *
 * The additional `options` can be an object or a regex pattern to specify only the
 * `match` field. If passed as a `RegExp` object, the additional options for reading
 * the directory will uses default options.
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
 * @param dirpath - The directory path to search.
 * @param options - Additional options for reading the directory.
 *
 * @returns A promise that resolves with an array of string representing the
 *          entries result or an empty array if any directories doesn't match
 *          with the specified filter options.
 * @throws {Error} If there is an error occurred while reading a directory.
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
  dirpath: string,
  options?: LsOptions | RegExp
): Promise<LsResult> {
  return ls(dirpath, options, lsTypes.LS_D);
}
