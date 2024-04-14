# LSFND

**LSFND**, short for _list (ls) files (f) and (n) directories (d)_, is a small
Node.js library designed to simplify file and directory listing tasks. It provides a
lightweight and efficient way to explore your file system and retrieve information
about files and directories with support filtering using regular expression.

The primary benefit of this library is that all implemented APIs execute asynchronously,
therefore ensuring their execution will **NOT** block any other processes.

> [!IMPORTANT]\
> Currently this project only focus on CommonJS (CJS) and ECMAScript Modules (ESM).

## APIs

### `ls` Function
```ts
async function ls(
  dirpath: string,
  options?: LsOptions | RegExp | undefined,
  type?: lsTypes | LsTypesKeys | LsTypesValues | undefined
): Promise<LsResult>
```

The `ls` function is an asynchronous function that retrieves a listing of files
and/or directories within a specified directory path. It offers powerful customizable
additional options used during listing the directory, filtering using regular
expression and specify the type of returned results (i.e., regular files or directories,
or includes both).

#### Parameters

- `dirpath`\
  The absolute or relative path to the directory you want to list.

- `options` (_optional_)\
  An optional object or regular expression used to configure the listing behavior.

- `type` (_optional_)\
  An optional parameter that specifies the type of entries you want to include
  in the results. You can pass `0` (zero) as value which will be interpreted as
  default behavior (i.e., include both regular files type and directories type).
  Refer to [`lsTypes`](#lsTypes-enum) to see all supported types.

#### Return

Returns a promise that resolves to an array of string containing the entries result.
It can be `null` if an error occurred while listing a directory, or returns a
promise with an empty array if any files and directories doesn't match with the
specified filter options.

> [!NOTE]\
> 💡 **Tip**: You can combine options for more granular control. For example,
> you can list files recursively while filtering by a specific extension.

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
  dirpath: string,
  options?: LsOptions | RegExp | undefined
): Promise<LsResult>
```

An asynchronous function that retrieves a listing of files within a specified
directory path. This function behave the same as [`ls`](#ls-function) function,
but this function only lists and retrieves the files type (i.e., excluding directories type).

This function is an alias for:
```js
// It uses LS_F to filter only the regular file type
ls(dirpath, options, lsTypes.LS_F);
```

#### Parameters

- `dirpath`\
  The absolute or relative path to the directory you want to list.

- `options` (_optional_)\
  An optional object or regular expression used to configure the listing behavior.

#### Return

Returns a promise that resolves to an array of string containing the entries result.
It can be `null` if an error occurred while listing a directory, or returns a
promise with an empty array if any files doesn't match with the specified filter
options.

> [!NOTE]\
> 💡 **Tip**: You can combine options for more granular control. For example,
> you can list files recursively while filtering by a specific extension.

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
const files = await lsFiles('.', /(README|LICENSE)(\.md)*$/);
console.log(files);
```
</details>

### `lsDirs` Function

An asynchronous function that retrieves a listing of directories within a specified
directory path. This function behave the same as [`ls`](#ls-function) function, but this
function only lists and retrieves the directories type (i.e., excluding files type).

This function is an alias for:
```js
// It uses LS_D to filter only the directory type
ls(dirpath, options, lsTypes.LS_D);
```

#### Parameters

- `dirpath`\
  The absolute or relative path to the directory you want to list.

- `options` (_optional_)\
  An optional object or regular expression used to configure the listing behavior.

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
included in the results.

#### Properties

|   Name   |   Description   |   Value   |
| -------- | --------------- | --------- |
| `LS_A`   | Represents an option to include all file types (i.e., including both regular files and directories). | `0b01` |
| `LS_D`   | Represents an option to include only the directory type. | `0b10` |
| `LS_F`   | Represents an option to include only the regular file type. | `0b100` |

## License

This project is licensed under the terms of [MIT](./LICENSE) license.
