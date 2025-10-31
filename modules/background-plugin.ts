import { copyToClipboardViaOffscreen } from "./client";
import { MESSAGE_TYPE_CLIPBOARD_WRITE } from "./constants";

/**
 * Sets up clipboard message listener in the background script.
 * This function is automatically injected into the background script via the WXT plugin system.
 *
 * Note: While the plugin runs in all entrypoints, Vite's tree-shaking removes this code
 * from content scripts during build, so it only gets bundled into background.js.
 */
function setupClipboard() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== MESSAGE_TYPE_CLIPBOARD_WRITE) {
      return;
    }

    copyToClipboardViaOffscreen(message.text)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  });
}

export default () => {
  if (import.meta.env.ENTRYPOINT !== "background") return;

  setupClipboard();
};
