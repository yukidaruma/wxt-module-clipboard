# wxt-module-clipboard

[![npm](https://badgen.net/npm/v/wxt-module-clipboard)](https://www.npmjs.com/package/wxt-module-clipboard)

WXT module for easy clipboard writing from content scripts using Chrome's offscreen API. Adds &lt;2kB to your extension (uncompressed).

## Installation

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

```ts
// wxt.config.ts
export default defineConfig({
  modules: ["wxt-module-clipboard"],
});
```

### Configuration

You can configure the module to use `optional_permissions` instead of `permissions`:

```ts
// wxt.config.ts
export default defineConfig({
  modules: ["wxt-module-clipboard"],
  clipboard: {
    optionalPermissions: true, // Use optional_permissions instead of permissions
  },
});
```

When `optionalPermissions` is set to `true`, the `offscreen` and `clipboardWrite` permissions will be added to `optional_permissions` in the manifest. This allows users to grant clipboard access on demand using [`chrome.permissions.request()`](https://developer.chrome.com/docs/extensions/reference/api/permissions#method-request).

```ts
const granted = await chrome.permissions.request({
  permissions: ["offscreen", "clipboardWrite"],
});
if (!granted) {
  console.error("Permission denied");
  return;
}
```

See [Chrome Extensions documentation](https://developer.chrome.com/docs/extensions/reference/api/permissions#step_3_request_optional_permissions) for more information.

## Usage

The module exports two functions:

### `copyToClipboard(text)` - For non-background entrypoints

In content scripts:

```ts
// entrypoints/content.ts
import { copyToClipboard } from "wxt-module-clipboard/client";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    const response = await copyToClipboard("Hello, clipboard!");
    if (response.success) {
      console.log("Copied!");
    } else {
      console.error("Error:", response.error);
    }
  },
});
```

In HTML entrypoints (popup, options, sidepanel, etc.):

```ts
// entrypoints/popup/main.ts
import { copyToClipboard } from "wxt-module-clipboard/client";

document.getElementById("copyBtn").addEventListener("click", async () => {
  const response = await copyToClipboard("Hello, clipboard!");
  if (response.success) {
    console.log("Copied!");
  } else {
    console.error("Error:", response.error);
  }
});
```

Under the hood, this function sends a message (`{ type: "clipboard-write", text: "..." }`) to the background script, which then uses the offscreen document to write to the clipboard.

### `copyToClipboardViaOffscreen(text)` - For background scripts

```ts
// entrypoints/background.ts
import { copyToClipboardViaOffscreen } from "wxt-module-clipboard/client";

export default defineBackground(() => {
  const response = await copyToClipboardViaOffscreen("Hello, clipboard!");
  if (response.success) {
    console.log("Copied!");
  } else {
    console.error("Error:", response.error);
  }
});
```

This function directly creates an offscreen document and writes to the clipboard. Use this only in background scripts, as the message-passing approach is designed for other contexts.

### Response Type

Both `copyToClipboard` and `copyToClipboardViaOffscreen` return a `ClipboardResponse` object:

```ts
type ClipboardResponse = {
  success: boolean;
  error?: string;
};
```

## How it works

- Automatically creates offscreen document files (`offscreen-clipboard.html` and `offscreen-clipboard.js`)
- Injects `modules/background-plugin.ts` only into the background entrypoint to listen for messages from content scripts
  - Plugin scripts are typically loaded into all entrypoints; however, tree-shaking ensures this module only injects into the background script, keeping other entrypoints lightweight
- Handles message routing from content scripts => background => offscreen document using `clipboard-write` and `clipboard-write-offscreen` message types
  - In the offscreen document, `document.execCommand('copy')` is used to write to the clipboard

## Caveat

Does not work on Firefox because the offscreen document API is not yet standardized (See: https://github.com/w3c/webextensions/issues/170).
