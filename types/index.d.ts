/**
* Type definitions for `lsfnd` package.  
* Project: lsfnd (https://github.com/mitsuki31/lsfnd.git)  
* Definitions by: Ryuu Mitsuki (https://github.com/mitsuki31)  
*
* Copyright (c) 2024 Ryuu Mitsuki. All rights reserved.
*
* @module  types
* @author  Ryuu Mitsuki (https://github.com/mitsuki31)
* @since   0.1.0
* @license MIT
*/

/**
 * A type representing the string path.
 * @since 1.0.0
 */
export declare type StringPath = string;

/**
 * This type alias represents an array of {@link StringPath}. It is typically used to
 * represent the list of file and/or directory entries returned by the `ls*` functions.
 * Each entry in the array represents the path of a file or directory within
 * the listed directory.
 * @since 0.1.0
 */
export declare type LsEntries = StringPath[];

/**
 * This type alias represents the possible return values of the `ls*` functions.
 * It can be either a {@link LsEntries} array containing the list of file paths,
 * or `null` to indicate an error.
 * @since 0.1.0
 */
export declare type LsResult = LsEntries | null;

/**
 * A combination union types containing all possible values used to specify the
 * returned results on {@link !lsfnd~ls ls} function.
 * @since 1.0.0
 * @see {@link !lsTypes~lsTypes lsTypes}
 */
export declare type LsTypes = LsTypesKeys | LsTypesValues;

/**
 * Type representing all possible keys of the {@link lsTypes} enum.
 * @since 0.1.0
 * @see {@link LsTypesInterface}
 */
export declare type LsTypesKeys = keyof LsTypesInterface;

/**
 * Type representing all possible values of the {@link lsTypes} enum.
 * @since 0.1.0
 * @see {@link LsTypesInterface}
 * @see {@link LsTypesKeys}
 */
export declare type LsTypesValues = LsTypesInterface[LsTypesKeys];

/**
 * Interface defining the {@link lsTypes} enum with string literal keys
 * representing different file types and their corresponding numeric values.
 * @readonly
 * @interface
 * @since 0.1.0
 */
export declare interface LsTypesInterface {
  /**
   * Represents an option to include all file types.
   * @defaultValue `0b01 << 0b00` (`0b01` | `0o01` | `0x01` | `1`)
   */
  readonly LS_A: 0b01;   // ALL
  /**
   * Represents an option to include only the directory type.
   * @defaultValue `0b01 << 0b01` (`0b10` | `0o02` | `0x02` | `2`)
   */
  readonly LS_D: 0b10;   // DIRECTORY
  /**
   * Represents an option to include only the file type.
   * @defaultValue `0b01 << 0b10` (`0b100` | `0o04` | `0x04` | `4`)
   */
  readonly LS_F: 0b100;  // FILE
}

/**
 * This interface defines the optional configuration options that can be passed
 * to every `ls*` functions. These options control the behavior of the directory listing.
 *
 * @interface
 * @since 0.1.0
 */
export declare interface LsOptions {
  /**
   * Specifies the character encoding to be used for the output encoding of
   * returned entries.
   *
   * @defaultValue `'utf8'`
   * @since        0.1.0
   */
  encoding?: BufferEncoding | undefined;
  /**
   * A boolean flag indicating whether to include subdirectories in the listing. 
   * @defaultValue `false`
   * @since        0.1.0
   */
  recursive?: boolean | undefined;
  /**
   * A regular expression or string pattern used to filter the listed entries. 
   * Only entries matching the pattern will be included in the results.
   * @defaultValue `/.+/` (match all files)
   * @since        0.1.0
   */
  match?: RegExp | string | undefined;
  /**
   * A regular expression or string pattern used to exclude entries from the 
   * listing. Any entries matching this pattern will be filtered out of the 
   * results, even if they match the {@link match} pattern.
   * @defaultValue `undefined`
   * @since        0.1.0
   */
  exclude?: RegExp | string | undefined;
  /**
   * A string path representing the root directory to resolve the results to
   * relative paths.
   *
   * This option will be ignored if either one of the {@link absolute `absolute`}
   * or {@link basename `basename`} option are enabled, this is due to their
   * higher priority. This option have the lowest priority when compared with those
   * options.
   *
   * @defaultValue `'.'` or `process.cwd()`
   * @since        1.0.0
   */
  rootDir?: StringPath | URL | undefined;
  /**
   * Determines whether to return absolute paths for all entries.
   *
   * When enabled (i.e., set to `true`), each entry of the returned results
   * will be an absolute path. Otherwise, paths will be relative to the directory
   * specified in the {@link rootDir `rootDir`} field.
   *
   * Enabling this option are equivalent with the following code.
   * Let's assume we want to list all files within a directory named `'foo'`:
   *
   * ```js
   * const { resolve } = require('node:path');
   * const { lsFiles } = require('lsfnd');
   * // Or ESM:
   * // import { resolve } from 'node:path';
   * // import { lsFiles } from 'lsfnd';
   *
   * const absfiles = (await lsFiles('foo/')).map((entry) => resolve(entry));
   * ```
   *
   * In previous release (prior to version 0.1.0) you can literally use an
   * explicit method that makes the returned results as absolute paths entirely.
   * That is by utilizing the `path.resolve` function, here is an example:
   *
   * ```js
   * const absfiles = await lsFiles(path.resolve('foo/'));
   * ```
   *
   * In the above code, the directory path is resolved to an absolute path before
   * being passed to the {@link !lsfnd~lsFiles `lsFiles`} function. As a result,
   * the function treats the specified directory path as a relative path and
   * does not attempt to resolve it back to a relative path, thus returning
   * absolute paths. This approach was considered unstable and problematic due
   * to inconsistencies in the internal logic. Therefore, this option was
   * introduced as a replacement and will default returns relative paths when
   * this option are disabled (set to `false` or unspecified), they will relative
   * to the path specified in the {@link rootDir `rootDir`} field. Refer to
   * {@link rootDir `rootDir`} option for more details.
   *
   * @defaultValue `false`
   * @since        1.0.0
   * @see          {@link rootDir}
   */
  absolute?: boolean | undefined;
  /**
   * Whether to make the returned result paths only have their basenames, trimming any
   * directories behind the path separator (i.e., `\\` in Windows, and `/` in POSIX).
   *
   * When set to `true`, the returned paths will only include the file and/or
   * directory names itself. This can be useful if you need only the names while
   * listing a directory.
   *
   * If you enabled both this option and the {@link absolute `absolute`} option,
   * the `absolute` option will be treated instead due to its higher priority rather
   * than this option's priority.
   *
   * > ### Note  
   * > Please note, that this option implicitly includes any directories on the
   * > returned entries. If you want to only include the filenames, then
   * > combine this option with {@link !lsTypes~lsTypes.LS_F `LS_F`} type if you
   * > are using {@link !lsfnd~ls `ls`} function, or use this option with
   * > {@link !lsfnd~lsFiles `lsFiles`} function for better flexibility.
   *
   * This option achieves the same functionality as the following code:
   *
   * ```js
   * const path = require('node:path');
   * // Or ESM:
   * // import * as path from 'node:path';
   *
   * // Assume you have `results` variable contains all files paths
   * // from listing a directory using `lsFiles` function
   * const baseResults = results.map((res) => res.split(path.sep).pop());
   * ```
   *
   * Or even a bit more simple like this:
   * ```js
   * // ...
   * const baseResults = results.map((res) => path.basename(res));
   * ```
   *
   * @defaultValue `false`
   * @since        1.0.0
   * @see          {@link rootDir}
   */
  basename?: boolean | undefined;
}

/**
 * Represents resolved options type for the `ls*` functions, where all properties are
 * required and both `null` and `undefined` values are omitted, except for the
 * {@link LsOptions.exclude `exclude`} property which keeps the `undefined` type.
 *
 * @since 1.0.0
 * @see   {@link LsOptions}
 * @see   {@link DefaultLsOptions}
 */
export declare type ResolvedLsOptions = Required<Omit<LsOptions, "exclude">> & {
  // Keep this to have undefined, so we can use that value if don't want to exclude any files
  exclude: LsOptions["exclude"];
};

/**
 * Represents the default options type for the `ls*` functions, used by
 * {@link !lsfnd~defaultLsOptions `defaultLsOptions`}.
 *
 * @interface
 * @since     1.0.0
 * @see       {@link LsOptions}
 * @see       {@link ResolvedLsOptions}
 * @see       {@link !lsfnd~defaultLsOptions defaultLsOptions}
 */
export declare interface DefaultLsOptions {
  readonly encoding: 'utf8';
  readonly recursive: false;
  readonly match: RegExp;
  readonly exclude: undefined;
  readonly rootDir: StringPath | URL;
  readonly absolute: false;
  readonly basename: false;
}

// ====== APIs ===== //

/**
 * {@inheritDoc !lsTypes~lsTypes}
 *
 * @see For more details, refer to {@link !lsTypes~lsTypes lsTypes} enum documentation.
 */
export declare const lsTypes: Record<
  LsTypesKeys,
  LsTypesValues
> & Record<
  LsTypesValues,
  LsTypesKeys
>;

/** {@inheritDoc !lsfnd~ls} */
export declare function ls(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined,
  type?: LsTypes | undefined
): Promise<LsResult>

/** {@inheritDoc !lsfnd~lsFiles} */
export declare function lsFiles(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>

/** {@inheritDoc !lsfnd~lsDirs} */
export declare function lsDirs(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>

// Ensure it is treated as module
export {};
