/**
* Type definitions for `lsfnd` package.  
* Project: lsfnd (https://github.com/mitsuki31/lsfnd.git)  
* Definitions by: Ryuu Mitsuki (https://github.com/mitsuki31)  
*
* Copyright (c) 2024 Ryuu Mitsuki.
* Licensed under the MIT license.
*
* @module  types
* @author  Ryuu Mitsuki (https://github.com/mitsuki31)
* @since   0.1.0
* @license MIT
*/
/// <reference types="node" />

/**
 * This type alias represents an array of strings. It is typically used to
 * represent the list of file and/or directory entries returned by the `ls*` functions.
 * Each string in the array represents the path of a file or directory within
 * the listed directory.
 * @since 0.1.0
 */
export declare type LsEntries = Array<string>;
/**
 * This type alias represents the possible return values of the `ls*` functions.
 * It can be either a {@link LsEntries} array containing the list of file paths,
 * or `null` to indicate an error.
 * @since 0.1.0
 */
export declare type LsResult = LsEntries | null;

/**
 * An enum representing different file types.
 * @since 0.1.0
 * @see {@link lsfnd!~lsTypes lsfnd.lsTypes}
 * @see {@link LsTypes}
 */
export declare const lsTypes: LsTypes;
/**
 * Type representing all possible keys of the {@link lsTypes} enum.
 * @since 0.1.0
 * @see {@link LsTypes}
 */
export declare type LsTypesKeys = keyof LsTypes;
/**
 * Type representing all possible values of the {@link lsTypes} enum.
 * @since 0.1.0
 * @see {@link LsTypes}
 */
export declare type LsTypesValues =
  | 0b00   // 0 (interpreted the same as LS_A | 1)
  | 0b01   // 1 (LS_A)
  | 0b10   // 2 (LS_D)
  | 0b100  // 4 (LS_F)

/**
 * Interface defining the {@link lsTypes} enum with string literal keys
 * representing different file types and their corresponding numeric values.
 * @readonly
 * @interface
 * @since 0.1.0
 */
export declare interface LsTypes {
  /**
   * Represents an option to include all file types.
   * @defaultValue `0b01 << 0b00` (`0b01` | `0o01` | `0x01` | `1`)
   */
  readonly LS_A: number;  // ALL
  /**
   * Represents an option to include only the directory type.
   * @defaultValue `0b01 << 0b01` (`0b10` | `0o02` | `0x02` | `2`)
   */
  readonly LS_D: number;  // DIRECTORY
  /**
   * Represents an option to include only the file type.
   * @defaultValue `0b01 << 0b10` (`0b100` | `0o04` | `0x04` | `4`)
   */
  readonly LS_F: number;  // FILE
}

/**
 * This interface defines the optional configuration options that can be passed
 * to the `ls*` function. These options control the behavior of the file listing.
 * @interface
 * @since 0.1.0
 */
export declare interface LsOptions {
  /**
   * Specifies the character encoding to be used when reading a directory. 
   * @defaultValue Defaults to `'utf8'` if not provided.
   */
  encoding?: BufferEncoding | undefined,
  /**
   * A boolean flag indicating whether to include subdirectories in the listing. 
   * @defaultValue Defaults to `false` if not provided.
   */
  recursive?: boolean | undefined,
  /**
   * A regular expression or string pattern used to filter the listed entries. 
   * Only entries matching the pattern will be included in the results.
   * @defaultValue `/.+/` (match all files)
   */
  match?: RegExp | string | undefined,
  /**
   * A regular expression or string pattern used to exclude entries from the 
   * listing. Any entries matching this pattern will be filtered out of the 
   * results, even if they match the {@link match} pattern.
   * @defaultValue `undefined`
   */
  exclude?: RegExp | string | undefined
}

// ====== APIs ===== //

export declare function ls(
  dirpath: string,
  options?: LsOptions | RegExp | undefined,
  type?: LsTypes | LsTypesKeys | LsTypesValues | undefined
): Promise<LsResult>

export declare function lsFiles(
  dirpath: string,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>

export declare function lsDirs(
  dirpath: string,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>

// Ensure it is treated as module
export {};
