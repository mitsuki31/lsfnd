/**
 * A script that minifies transpiled TypeScript files. The minified scripts are
 * saved implicitly with the `.min.js` extension in the specified output directory.
 * The preceding behavior can be set to either overwrite the initial generation
 * of transpiled files or keep them distinct.
 *
 * Possible options choices for enabling the overwrite operation:
 * - `-ow`
 * - `--overwrite`
 *
 * Possible options choices to run the minification only:
 * - `-m`
 * - `--minify`
 *
 * Example usage:
 * ```bash
 * npx ts-node scripts/build.ts [-ow|--overwrite] [-m|--minify]
 * ```
 *
 * Copyright (c) 2024 Ryuu Mitsuki.
 * Licensed under the MIT license.
 *
 * @module  scripts/build
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import * as esbuild from 'esbuild';
import { type BuildPropConfig } from '../types/build.prop';

import * as pkg from '../package.json';
import * as tsconfig from '../tsconfig.json';
const buildProp: BuildPropConfig = require('../build.prop');

/** @internal */
function fixPathSep(p: string) {
  return p.replace(/[\/\\]/g, path.sep);
}

const args: Array<string> = process.argv.slice(2);
const rootDir: string = fixPathSep(buildProp.rootDir);
const buildDir: string = fixPathSep(buildProp.outDir);
const tscCmd: Array<string> = [
  path.join(rootDir, 'node_modules', '.bin', 'tsc'),
  '--project',
  fixPathSep(buildProp.tsconfig)
];
const includeFiles: Array<string> = Array.from(
  // Convert to set first to remove any duplicates
  new Set<string>(buildProp.minify.files.map((file: string): string => {
    return fixPathSep(file);  // Fix the path separator
  }))
);
const legalComments: string = `
/**
 * **${pkg.name.toUpperCase()}** (LiSt Files & Directories) - ${pkg.description}.
 *
 * Copyright (c) ${new Date().getFullYear()} Ryuu Mitsuki. All rights reserved.
 * @author Ryuu Mitsuki (https://github.com/mitsuki31)
 * @license ${pkg.license}
 * @see [Source code](${pkg.repository.url.replace(/^git\+/, '')})
 */
`.trimStart();

/** @internal */
async function minify(files: Array<string>): Promise<void> {
  // Read contents file in the list of included files for minification
  const filesContents: Array<string> = await Promise.all(
    files.map(async function (file: string): Promise<string> {
      return (await fs.promises.readFile(path.resolve(file), 'utf8'));
    })
  );

  // Minification process
  await Promise.all(
    filesContents.map(async function (
      content: string,
      idx: number
    ): Promise<void> {
      const base: string = path.basename(files[idx]);
      const ext: string = base.split('.').pop()! || '';
      const minifiedCode: string = (await esbuild.transform(content, {
        minify: true
      })).code;
      const outFile: string =
        files[idx].replace(RegExp(`\\.${ext!}$`), `.min.${ext}`);

      process.stdout.write(`Minifying "${files[idx]}" ...`);
      fs.writeFileSync(
        path.resolve(outFile),
        legalComments.concat(minifiedCode),
        'utf8'
      );
      console.log(' Done');

      // Overwrite the original file with the minified version only if
      // the special argument ('-ow' | `--overwrite`) specified
      if (args.includes('-ow') || args.includes('--overwrite')) {
        const origin: string = path.resolve(files[idx]);
        process.stdout.write(`Overwriting "${files[idx]}" with minified version ...`);
        fs.renameSync(path.resolve(outFile), origin);
        console.log(' Done');
      }
      return;  // Explicitly return void
    })
  );
}

(async function (): Promise<void> {
  if (args.includes('-m') || args.includes('--minify')) {
    return await minify(includeFiles);
  }

  // Transpile the TypeScript files
  console.log('\nSpawning child process ...');
  console.log(`> ${path.basename(tscCmd[0])} ${tscCmd.slice(1).join(' ')}\n`);
  const tsc: ChildProcess = spawn(tscCmd[0], tscCmd.slice(1), {
    cwd: rootDir,
    stdio: 'inherit',
    windowsHide: true
  });

  tsc.on('error', function (err: Error): void {
    console.error('Error occured in child process:');
    console.error(err);
  });
  tsc.on('close', async function (code: number): Promise<void> {
    console.log('\nChild process exited with code:', code, '\n');
    if (code !== 0) return;

    await minify(includeFiles);
    console.log('Build completed.');
  });
})();
