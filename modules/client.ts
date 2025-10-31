import {
  MESSAGE_TYPE_CLIPBOARD_WRITE,
  MESSAGE_TYPE_CLIPBOARD_WRITE_OFFSCREEN,
  OFFSCREEN_DOCUMENT_HTML,
} from "./constants";

/**
 * Response object from clipboard operations
 */
export type ClipboardResponse = {
  success: boolean;
  error?: string;
};

/**
 * Copies text to the clipboard from any entrypoint (content script, popup, etc.).
 * Sends a message to the background script which handles the clipboard write via offscreen document.
 * **Note**: Use `copyToClipboardViaOffscreen` directly in background scripts.
 *
 * @param text - text to copy to the clipboard
 * @returns Promise that resolves with response object containing success status and optional error message
 *
 * @example
 * ```ts
 * import { copyToClipboard } from "wxt-module-clipboard/client";
 *
 * const response = await copyToClipboard("Hello, clipboard!");
 * if (response.success) {
 *   console.log("Copied!");
 * } else {
 *   console.error("Error: " + response.error);
 * }
 * ```
 */
export async function copyToClipboard(
  text: string
): Promise<ClipboardResponse> {
  return chrome.runtime.sendMessage({
    type: MESSAGE_TYPE_CLIPBOARD_WRITE,
    text: text,
  });
}

/**
 * Copies text to the clipboard via offscreen document from background script.
 * Creates an offscreen document if needed, then sends a message to it to perform the clipboard write.
 * **Note**: Use `copyToClipboard` in non-background entrypoints (content scripts, popups, etc.).
 *
 * @param text - text to copy to the clipboard
 * @returns Promise that resolves with response object containing success status and optional error message
 *
 * @example
 * ```ts
 * import { copyToClipboardViaOffscreen } from "wxt-module-clipboard/client";
 *
 * // In background script
 * const response = await copyToClipboardViaOffscreen("Hello, clipboard!");
 * if (response.success) {
 *   console.log("Copied!");
 * } else {
 *   console.error("Error:", response.error);
 * }
 * ```
 */
export async function copyToClipboardViaOffscreen(
  text: string
): Promise<ClipboardResponse> {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_HTML);

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPE_CLIPBOARD_WRITE_OFFSCREEN,
    data: text,
  });

  if (response?.success) {
    return { success: true };
  } else {
    return {
      success: false,
      error: response?.error || "Failed to copy to clipboard: unknown error",
    };
  }
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
