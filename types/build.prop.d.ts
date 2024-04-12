/**
 * Type definitions for `build.prop.*js` configuration file.  
 * Project: lsfnd (https://github.com/mitsuki31/lsfnd.git)  
 * Definitions by: Ryuu Mitsuki (https://github.com/mitsuki31)  
 *
 * @module  build.prop
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

/**
 * Interface representing the configuration options for the build process.
 * @interface
 * @since 0.1.0
 */
export declare interface BuildPropConfig {
  /**
   * The root directory of the project from where the build process starts.
   * This path should be a string representing a valid file system path.
   */
  rootDir: string;
  /**
   * The output directory where the build process will place generated files.
   * This path should be a string representing a valid file system path.
   */
  outDir: string;
  /**
   * The path to the `tsconfig.json` file that will be used during the build process.
   * This path should be a string representing a valid file system path relative
   * to the {@link rootDir}.
   */
  tsconfig: string;
  /**
   * Configuration options for minification process.
   */
  minify: MinifyConfig;
}

/**
 * Interface representing the configuration options for minification within the
 * build process.
 * @interface
 * @since 0.1.0
 */
export declare interface MinifyConfig {
  /**
   * A list of file paths (relative to the {@link BuildPropConfig.rootDir})
   * to be included during minification. Each element in the array should be a
   * string representing a valid file system path.
   */
  files: Array<string>;
}

export {};
