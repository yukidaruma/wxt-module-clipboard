# wxt-module-clipboard

[![npm](https://badgen.net/npm/v/wxt-module-clipboard)](https://www.npmjs.com/package/wxt-module-clipboard)

WXT module for easy clipboard writing from content scripts using Chrome's offscreen API. Adds &lt;2kB to your extension (uncompressed).

## Install

```sh
# npm
npm i wxt-module-clipboard

# pnpm
pnpm add wxt-module-clipboard

# yarn
yarn add wxt-module-clipboard

# bun
bun add wxt-module-clipboard
```

## Usage

```ts
// wxt.config.ts
export default defineConfig({
  modules: ["wxt-module-clipboard"],
});
```

```ts
// From any entrypoint (content script, popup, etc.):
await chrome.runtime.sendMessage({
  type: "clipboard-write",
  text: "Hello, clipboard!",
});
```

## Example

See [example/](./example/README.md) for a working example.

## How it works

- Automatically creates offscreen document files (`offscreen-clipboard.html` and `offscreen-clipboard.js`)
- Injects `modules/background-plugin.ts` only into the background entrypoint to listen for messages from content scripts
  - Plugin scripts are typically loaded into all entrypoints; however, tree-shaking ensures this module only injects into the background script, keeping other entrypoints lightweight
- Handles message routing from content scripts => background => offscreen document using `clipboard-write` and `clipboard-write-offscreen` message types
  - In the offscreen document, `document.execCommand('copy')` is used to write to the clipboard

## Caveat

Does not work on Firefox because the offscreen document API is not yet standardized (See: https://github.com/w3c/webextensions/issues/170).
