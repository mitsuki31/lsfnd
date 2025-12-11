# LSFND

[![Version](https://img.shields.io/npm/v/lsfnd?logo=npm&label=lsfnd)](https://npmjs.com/package/lsfnd)
![Min. Node](https://img.shields.io/node/v-lts/lsfnd/latest?logo=node.js&label=node)
[![Bundle size (minified)](https://img.shields.io/bundlephobia/min/lsfnd)](https://npmjs.com/package/lsfnd)<br />
[![Test CI](https://github.com/mitsuki31/lsfnd/actions/workflows/test.yml/badge.svg)](https://github.com/mitsuki31/lsfnd/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/mitsuki31/lsfnd?logo=readme&logoColor=f9f9f9&label=License&labelColor=yellow&color=white)](https://github.com/mitsuki31/lsfnd/tree/master/LICENSE)

**LSFND** is an abbreviation for _list (ls) files (f) and (n) directories (d)_,
a lightweight Node.js library designed to make listing files and directories more convenient.
It offers an efficient and simple way to explore through your directory structures
and retrieves the names of files and/or directories leveraging a configurable options
to modify the listing behavior, such as recursive searches and regular expression filters.

This library's **primary benefit** is that every implemented API within main module runs asynchronously,
guaranteeing that they will **NEVER** disrupt the execution of any other processes.

> [!IMPORTANT]  
>
> ### v1.2.0
> Added synchronous version for `ls`, `lsFiles`, and `lsDirs`.
> Can be imported from submodule `/sync` as such below:
> ```js
> const { lsFiles } = require('lsfnd/sync');
> // Or:
> import { lsFiles } from 'lsfnd/sync';
> ```
>
> ### v1.0.0
> This library has supported TypeScript projects with various
> module types (i.e., `node16`, `es6`, and many more). Previously, it was only supports
> TypeScript projects with module type of `commonjs`. All type declarations in this
> library also has been enhanced to more robust and strict, thus improving type safety.

## APIs

### `ls` Function
```ts
async function ls(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined,
  type?: LsTypes | undefined
): Promise<LsResult>
```

The `ls` function is an asynchronous function that retrieves a listing of files
and/or directories within a specified directory path. It offers powerful customizable
additional options to configures the listing behavior (see [`LsOptions`][LsOptions]),
filtering using regular expression and specify the type of returned results (i.e.,
regular files or directories, or includes both).

#### Parameters

- `dirpath` : { [`StringPath`][StringPath] | [`URL`][URL] }\
  The absolute or relative path to the directory you want to list. It can be a
  string path or a file URL path (either a URL string or a [`URL`][URL] object) with
  `'file:'` protocol.

- `options` : { [`LsOptions`][LsOptions] | [`RegExp`][RegExp] | `undefined` } (_nullable, optional_)\
  An optional regular expression or object that configures the listing behavior. By
  supplying a regular expression to the `match` and `exclude` options, you may
  filter the file or directory names. You can also enable the `recursive` option
  (i.e., set it to `true`) to enable the ability to recursively traverse subdirectories.
  If passed with a [`RegExp`][RegExp] object, then it only supplied the `match` option and
  the rest options will uses their default values. See [`LsOptions`][LsOptions]
  for further information in detail.

- `type` : { [`LsTypes`][LsTypes] | `undefined` } (_nullable, optional_)\
  An optional parameter that specifies the type of entries you want to include
  in the results. You can pass `0` (zero) as value which will be interpreted as
  default behavior (i.e., include both regular files type and directories type).
  Refer to [`lsTypes`](#lstypes-enum) to see all supported types.

#### Return

Returns a promise that resolves to an array of string containing the entries result.
It can be `null` if an error occurred while listing a directory, or returns a
promise with an empty array if any files and directories doesn't match with the
specified filter options.

> [!NOTE]\
> 💡 **Tip**: You can combine options for more granular control. For example,
> you can list directories and/or files recursively while filtering by either
> specific extensions or names.

<details>
<summary>Example Usage (CJS)</summary>

```js
const { ls, lsTypes } = require('lsfnd');

(async () => {
  // List all files and directories in the current directory
  const allFiles = await ls('.');
  console.log(allFiles);
  
  // List only JavaScript files in the current directory recursively
  const jsFiles = await ls('.', {
    recursive: true,
    match: /\.js$/
  }, lsTypes.LS_F);
  console.log(jsFiles);
})();
```
</details>

<details>
<summary>Example Usage (ESM)</summary>

```js
import { ls, lsTypes } from 'lsfnd';

// List all files and directories in the current directory
const allFiles = await ls('.');
console.log(allFiles);

// List only JavaScript files in the current directory recursively
const jsFiles = await ls('.', {
  recursive: true,
  match: /\.js$/
}, lsTypes.LS_F);
console.log(jsFiles);
```
</details>

### `lsFiles` Function
```ts
async function lsFiles(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>
```

An asynchronous function that retrieves a listing of files within a specified
directory path. This function behaves the same as [`ls`](#ls-function) function,
but this function only lists and retrieves the regular files type (i.e., excluding
any directories type).

> This function is an alias for:
> ```js
> // It uses LS_F to filter only the regular file type
> ls(dirpath, options, lsTypes.LS_F);
> ```

#### Parameters

- `dirpath` : { [`StringPath`][StringPath] | [`URL`][URL] }\
  The absolute or relative path to the directory you want to list. It can be a
  string path or a file URL path (either a URL string or a [`URL`][URL] object) with
  `'file:'` protocol.

- `options` : { [`LsOptions`][LsOptions] | [`RegExp`][RegExp] | `undefined` } (_nullable, optional_)\
  An optional regular expression or object that configures the listing behavior. By
  supplying a regular expression to the `match` and `exclude` options, you may
  filter the file or directory names. You can also enable the `recursive` option
  (i.e., set it to `true`) to enable the ability to recursively traverse subdirectories.
  If passed with a [`RegExp`][RegExp] object, then it only supplied the `match` option and
  the rest options will uses their default values. See [`LsOptions`][LsOptions]
  for further information in detail.

#### Return

Returns a promise that resolves to an array of string containing the entries result.
It can be `null` if an error occurred while listing a directory, or returns a
promise with an empty array if any files doesn't match with the specified filter
options.

<details>
<summary>Example Usage (CJS)</summary>

```js
const { lsFiles } = require('lsfnd');

(async () => {
  // Search and list LICENSE and README file in current directory
  const files = await lsFiles('.', /(README|LICENSE)(\.md|\.txt)*$/);
  console.log(files);
})();
```
</details>

<details>
<summary>Example Usage (ESM)</summary>

```js
import { lsFiles } from 'lsfnd';

// Search and list LICENSE and README file in current directory
const files = await lsFiles('.', /(README|LICENSE)(\.md|\.txt)*$/);
console.log(files);
```
</details>

### `lsDirs` Function
```ts
async function lsDirs(
  dirpath: StringPath | URL,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>
```

An asynchronous function that retrieves a listing of directories within a specified
directory path. This function behaves the same as [`ls`](#ls-function) function, but this
function only lists and retrieves the directories type (i.e., excluding any files type).

> This function is an alias for:
> ```js
> // It uses LS_D to filter only the directory type
> ls(dirpath, options, lsTypes.LS_D);
> ```

#### Parameters

- `dirpath` : { [`StringPath`][StringPath] | [`URL`][URL] }\
  The absolute or relative path to the directory you want to list. It can be a
  string path or a file URL path (either a URL string or a [`URL`][URL] object) with
  `'file:'` protocol.

- `options` : { [`LsOptions`][LsOptions] | [`RegExp`][RegExp] | `undefined` } (_nullable, optional_)\
  An optional regular expression or object that configures the listing behavior. By
  supplying a regular expression to the `match` and `exclude` options, you may
  filter the file or directory names. You can also enable the `recursive` option
  (i.e., set it to `true`) to enable the ability to recursively traverse subdirectories.
  If passed with a [`RegExp`][RegExp] object, then it only supplied the `match` option and
  the rest options will uses their default values. See [`LsOptions`][LsOptions]
  for further information in detail.

#### Return

Returns a promise that resolves to an array of string containing the entries result.
It can be `null` if an error occurred while listing a directory, or returns a
promise with an empty array if any directories doesn't match with the specified
filter options.

<details>
<summary>Example Usage (CJS)</summary>

```js
const { lsDirs } = require('lsfnd');

(async () => {
  // List all installed NPM packages in 'node_modules' directory
  // excluding '.bin' directory and organization packages (prefixed with '@')
  const npmPkgs = await lsDirs('node_modules', { exclude: /(\.bin|@.+)/ });
  console.log(npmPkgs);
})();
```
</details>

<details>
<summary>Example Usage (ESM)</summary>

```js
import { lsDirs } from 'lsfnd';

// List all installed NPM packages in 'node_modules' directory
// excluding '.bin' directory and organization packages (prefixed with '@')
const npmPkgs = await lsDirs('node_modules', { exclude: /(\.bin|@.+)/ });
console.log(npmPkgs);
```
</details>

### `lsTypes` Enum

An enumeration defines the different types of listings supported by the
[`ls`](#ls-function) function. It specifies which file system entries should be
included in the results. For more details documentation, refer to [`LsTypesInterface`][LsTypesInterface]
for the type documentation or [`lsTypes`][lsTypes] for the actual enum documentation.

#### Properties

|   Name   |   Description   |   Value   |
| -------- | --------------- | --------- |
| `LS_A`   | Represents an option to includes all types (i.e., includes both regular files and directories type). | `0b01` |
| `LS_D`   | Represents an option to includes only the directories type. | `0b10` |
| `LS_F`   | Represents an option to includes only the regular files type. | `0b100` |

### `defaultLsOptions` Object

A constant object containing all default values of [`LsOptions`][LsOptions]
type, typically implicitly used when user not specified the `options` argument in every `ls*`
functions.

#### Properties

|    Name     |  Default Value  |
| ----------- | --------------- |
| `encoding`  | `'utf8'`        |
| `recursive` | `false`         |
| `match`     | `/.+/`          |
| `exclude`   | `undefined`     |
| `rootDir`   | `process.cwd()` |
| `absolute`  | `false`         |
| `basename`  | `false`         |

## License

This project is licensed under the terms of [MIT](./LICENSE) license.

<!-- Links -->
[StringPath]: https://mitsuki31.github.io/lsfnd/types/types.StringPath.html
[LsOptions]: https://mitsuki31.github.io/lsfnd/interfaces/types.LsOptions.html
[LsTypesInterface]: https://mitsuki31.github.io/lsfnd/interfaces/types.LsTypesInterface.html
[LsTypes]: https://mitsuki31.github.io/lsfnd/types/types.LsTypes.html
[lsTypes]: https://mitsuki31.github.io/lsfnd/enums/lsTypes.lsTypes.html
[URL]: https://nodejs.org/api/url.html#class-url
[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
