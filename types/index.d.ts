/**
 * Type definitions for `lsfnd` package.
 * Project: `lsfnd`
 * Definitions by: Ryuu Mitsuki (https://github.com/mitsuki31)
 *
 * Copyright (c) 2024 Ryuu Mitsuki.
 * Licensed under the MIT license.
 *
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

/**
 * This type alias represents an array of strings. It is typically used to
 * represent the list of file and/or directory entries returned by the `ls*` functions.
 * Each string in the array represents the path of a file or directory within
 * the listed directory.
 */
declare type LsEntries = Array<string>;
/**
 * This type alias represents the possible return values of the `ls*` functions.
 * It can be either a {@link LsEntries} array containing the list of file paths,
 * or `null` to indicate an error.
 */
declare type LsResult = LsEntries | null;
declare const enum LsTypes {
  LS_A = 0b01 << 0b00,  // ALL
  LS_D = 0b01 << 0b01,  // DIRECTORY
  LS_F = 0b01 << 0b10   // FILE
}

/**
 * This interface defines the optional configuration options that can be passed
 * to the `ls*` function. These options control the behavior of the file listing.
 *
 * @property {BufferEncoding | undefined} [encoding]
 *           Specifies the character encoding to be used when reading file contents. 
 *           Defaults to `'utf8'` if not provided.
 * @property {boolean | undefined} [recursive]
 *           A boolean flag indicating whether to include subdirectories in the listing. 
 *           Defaults to `false` if not provided.
 * @property {RegExp | string | undefined} [match]
 *           A regular expression or string pattern used to filter the listed entries. 
 *           Only entries matching the pattern (filename or path) will be included 
 *           in the results.
 * @property {RegExp | string | undefined} [exclude]
 *           A regular expression or string pattern used to exclude entries from the 
 *           listing. Any entries matching this pattern will be filtered out of the 
 *           results, even if they match the `match` pattern.
 */
declare interface LsOptions {
  encoding?: BufferEncoding | undefined,
  recursive?: boolean | undefined,
  match?: RegExp | string | undefined,
  exclude?: RegExp | string | undefined
}

// ====== APIs ===== //

declare function ls(
  dirpath: string,
  options?: LsOptions | RegExp | undefined,
  type?:
    | LsTypes.LS_A
    | LsTypes.LS_D
    | LsTypes.LS_F
    | undefined
): Promise<LsResult>

declare function lsFiles(
  dirpath: string,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>

declare function lsDirs(
  dirpath: string,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>
