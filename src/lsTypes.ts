/**
 * A module contains only a {@link lsTypes} enum, which is used by {@link !lsfnd~ls ls}
 * function to specify type of the returned results.
 *
 * Copyright (c) 2024 Ryuu Mitsuki. All rights reserved.
 *
 * @module  lsTypes
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 * @see     {@link lsTypes}
 */

/**
 * This enumeration defines the different types of listings supported by
 * the {@link !lsfnd~ls ls} function. It specifies which file system entries should be
 * included in the results.
 *
 * @readonly
 * @public
 * @since 0.1.0
 * @see {@link !lsfnd~ls ls}
 */
export enum lsTypes {
  /**
   * This option lists both regular files and directories in the output.
   * You can also use other number types for alias, like:
   * ```ts
   * LS_A: 0b01 | 0o01 | 0x01  // Each equivalent to 1
   * ```
   */
  LS_A = 0b01 << 0b00,  // ALL
  /**
   * This option filters the output to include only directory entries.
   * You can also use other number types for alias, like:
   * ```ts
   * LS_D: 0b10 | 0o02 | 0x02  // Each equivalent to 2
   * ```
   */
  LS_D = 0b01 << 0b01,  // DIRECTORY
  /**
   * This option filters the output to include only regular files (non-directories).
   * You can also use other number types for alias, like:
   * ```ts
   * LS_F: 0b100 | 0o04 | 0x04  // Each equivalent to 4
   * ```
   */
  LS_F = 0b01 << 0b10   // FILE
}
