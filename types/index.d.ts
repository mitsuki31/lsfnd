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
/// <reference types="node" />

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
export declare type LsEntries = Array<StringPath>;

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
export declare type LsTypesValues = keyof typeof LsTypesInterface;

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
 * to the `ls*` function. These options control the behavior of the file listing.
 * @interface
 * @since 0.1.0
 */
export declare interface LsOptions {
  /**
   * Specifies the character encoding to be used when reading a directory. 
   * @defaultValue `'utf8'`
   */
  encoding?: BufferEncoding | undefined;
  /**
   * A boolean flag indicating whether to include subdirectories in the listing. 
   * @defaultValue `false`
   */
  recursive?: boolean | undefined;
  /**
   * A regular expression or string pattern used to filter the listed entries. 
   * Only entries matching the pattern will be included in the results.
   * @defaultValue `/.+/` (match all files)
   */
  match?: RegExp | string | undefined;
  /**
   * A regular expression or string pattern used to exclude entries from the 
   * listing. Any entries matching this pattern will be filtered out of the 
   * results, even if they match the {@link match} pattern.
   * @defaultValue `undefined`
   */
  exclude?: RegExp | string | undefined;
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
export declare type ResolvedLsOptions = {
  [T in keyof LsOptions]-?: T extends 'exclude'
    ? NonNullable<LsOptions[T]> | undefined
    : NonNullable<LsOptions[T]>
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
  encoding: 'utf8';
  recursive: false;
  match: RegExp;
  exclude: undefined;
  rootDir: StringPath;
  basename: false;
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
