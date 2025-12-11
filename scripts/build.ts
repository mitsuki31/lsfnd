/**
 * A script that builds the project and optionally minifies the transpiled TypeScript files.
 * The minified scripts are saved implicitly with the `.min.js` extension in the specified
 * output directory.
 *
 * The preceding behavior can be set to either overwrite the initial generation
 * of transpiled files or keep them distinct.
 *
 * **Options:**
 *
 * - `-m`, `--minify`  
 *   Enables minification while transpiling the source files.
 *
 * **Command:**
 *
 * ```bash
 * npx tsx scripts/build.ts [-m|--minify] [-ow|--overwrite]
 * ```
 *
 * If no options specified, it will only build the project.
 *
 * ---
 *
 * Copyright (c) 2024-2025 Ryuu Mitsuki. All rights reserved.
 *
 * @module  scripts/build
 * @author  Ryuu Mitsuki (https://github.com/mitsuki31)
 * @since   0.1.0
 * @license MIT
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { spawn, type ChildProcess } from 'node:child_process';
import * as esbuild from 'esbuild';
import * as buildProp from '../build.prop';
import * as pkg from '../package.json';

const SUPPORTED_OPTIONS = {
  minify: ['-m', '--minify'],
} as const;
const SUPPORTED_OPTIONS_SET = new Set(...Object.values(SUPPORTED_OPTIONS));

/** @internal */
function fixPathSep(p: string) {
  return p.replace(/[\/\\]/g, path.sep);
}

const args: string[] = process.argv.slice(2);
const rootDir: string = fixPathSep(buildProp.rootDir);
const tscCmd = [
  path.join(rootDir, 'node_modules', '.bin', 'tsc'),
  '--project',
  fixPathSep(buildProp.tsconfig)
] as const;
const includeFiles: string[] = Array.from(
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
 * @see [Homepage](${pkg.homepage})
 * @see [Source code](${pkg.repository.url.replace(/^git\+/, '')})
 */
`.trimStart();

/** @internal */
async function minify(files: string[]): Promise<void> {
  // Read contents file in the list of included files for minification
  const filesContents: string[] = await Promise.all(
    files.map(async function (file: string): Promise<string> {
      return (await fs.promises.readFile(path.resolve(file), 'utf8'));
    })
  );

  for (const content of filesContents) {
    const idx = filesContents.indexOf(content);

    process.stdout.write(`Minifying "${files[idx]}" ...`);
    const minifiedResult = await esbuild.transform(content, {
      banner: legalComments,
      // NOTE: Only minify the identifiers
      minifyIdentifiers: true
    });
    const minifiedCode = minifiedResult.code;
    const outFile = files[idx];

    // Writing file
    await fs.promises.writeFile(outFile, minifiedCode, 'utf8');
    console.log(' Done');
  }
}

(async function (): Promise<void> {
  const buildTimeStart = performance.now();

  // Transpile the TypeScript files
  console.log('\nSpawning child process ...');
  console.log(`> ${path.basename(tscCmd[0])} ${tscCmd.slice(1).join(' ')}\n`);
  const tsc: ChildProcess = spawn(tscCmd[0], tscCmd.slice(1), {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    windowsHide: true
  });

  tsc.on('error', function (err: Error): void {
    console.error('Error occured in child process:', err);
    process.exit(1);  // Exit immediately
  });
  tsc.on('close', async function (code: number): Promise<void> {
    console.log('\nChild process exited with code:', code, '\n');
    if (code !== 0) process.exit(1);  // Better exit 1 than return

    if (args.some(o => (SUPPORTED_OPTIONS.minify as readonly string[]).includes(o))) {
      await minify(includeFiles);
    }

    const buildTimeEnd = performance.now();
    console.log(
      `Build completed in \x1b[96m${(buildTimeEnd - buildTimeStart).toFixed()}ms\x1b[0m.`
    );
  });
})();
