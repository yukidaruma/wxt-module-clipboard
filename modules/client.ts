/**
 * Copies text to the clipboard using Chrome's offscreen document API.
 * Creates an offscreen document if needed, then sends a message to it to perform the clipboard write.
 *
 * @param text - text to copy to the clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
  await setupOffscreenDocument("offscreen-clipboard.html");

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "clipboard-write-offscreen",
        data: text,
      },
      (response) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || "Failed to copy"));
        }
      }
    );
  });
}

/**
 * Sets up clipboard message listener in the background script.
 * This function is automatically injected into the background script via the WXT plugin system.
 *
 * Note: While the plugin runs in all entrypoints, Vite's tree-shaking removes this code
 * from content scripts during build, so it only gets bundled into background.js.
 */
export function setupClipboard() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== "clipboard-write") {
      return;
    }

    copyToClipboard(message.text)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  });
}

let creating: Promise<void> | null = null;

/** @see https://developer.chrome.com/docs/extensions/reference/api/offscreen */
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ["CLIPBOARD"],
      justification: "reason for needing the document",
    });
    await creating;
    creating = null;
  }
}
