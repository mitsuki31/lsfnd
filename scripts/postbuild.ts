import * as fs from 'node:fs';
import * as buildProp from '../build.prop';

const includedFiles = buildProp.minify.files;

/**
 * Remove consecutive multiline comments (/* ... *\/) immediately after the
 * first `"use strict"` or `'use strict'` directive in the given JS source.
 *
 * @param source - JavaScript source text
 * @returns modified source
 */
function removeMultilineCommentsAfterUseStrict(source: string) {
  // Find first "use strict" or 'use strict'
  const m = /(['"])use strict\1\s*;?/.exec(source);
  if (!m) return source;

  // index right after the matched directive
  let pos = m.index + m[0].length;

  // Walk forward skipping whitespace/newlines and removing /* ... */ blocks
  let changed = false;
  while (true) {
    // Skip whitespace and newlines
    const wsMatch = /^[\t\v\f\r\n ]+/.exec(source.slice(pos));
    if (wsMatch) pos += wsMatch[0].length;

    // If next chars start a block comment, remove it
    if (source.startsWith('/*', pos)) {
      const end = source.indexOf('*/', pos + 2);
      if (end === -1) {
        // unterminated block comment — be conservative: stop
        break;
      }
      // Remove from pos to end+2
      source = source.slice(0, pos) + source.slice(end + 2);
      changed = true;
      // continue loop from same pos (since content changed and there may be more)
      continue;
    }
    break;  // else nothing to remove; break
  }

  return changed ? source : source;
}

async function run() {
  const modifiedFiles = includedFiles.reduce((acc, val) => {
    acc[val] = false;
    return acc;
  }, {} as Record<(typeof includedFiles)[number], boolean>);

  const postbuildPromises = includedFiles.map(async file => {
    const raw = await fs.promises.readFile(file, 'utf8');

    // Remove comments
    const modified = removeMultilineCommentsAfterUseStrict(raw);
    if (modified !== raw) {
      await fs.promises.writeFile(file, modified, 'utf8');
      modifiedFiles[file] = true;
    }
  });

  void await Promise.all(postbuildPromises);

  // Summary
  console.log('[postbuild] Modified files are included:');
  console.table(modifiedFiles);
}

run();
