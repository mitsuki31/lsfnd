import type { DefaultLsOptions } from '../types';

/**
 * A regular expression pattern to parse the file URL path,
 * following the WHATWG URL Standard.
 *
 * @see {@link https://url.spec.whatwg.org/ WHATWG URL Standard}
 * @internal
 */
export const FILE_URL_PATTERN: RegExp = /^file:\/\/\/?(?:[A-Za-z]:)?(?:\/[^\s\\]+)*(?:\/)?/;

/**
 * A regular expression pattern to parse and detect the Windows path.
 *
 * @internal
 */
export const WIN32_PATH_PATTERN: RegExp = /^[A-Za-z]:?(?:\\|\/)(?:[^\\/:*?"<>|\r\n]+(?:\\|\/))*[^\\/:*?"<>|\r\n]*$/;

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
} satisfies DefaultLsOptions;
