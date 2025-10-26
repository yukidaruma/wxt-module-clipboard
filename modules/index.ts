import "wxt";
import { addWxtPlugin, defineWxtModule } from "wxt/modules";

export type ClipboardModuleOptions = {
  /**
   * If true, permissions will be added to optional_permissions instead of permissions.
   *
   * **Note**: You need to manually request permissions using `chrome.permissions.request()` before calling the clipboard functions.
   * @default false
   */
  optionalPermissions?: boolean;
};

declare module "wxt" {
  export interface InlineConfig {
    clipboard?: ClipboardModuleOptions;
  }
}

export default defineWxtModule<ClipboardModuleOptions>({
  name: "@wxt-dev/module-clipboard",
  configKey: "clipboard",
  setup(wxt, options) {
    // Add background plugin
    const pluginModuleId = "wxt-module-clipboard/background-plugin";
    addWxtPlugin(wxt, pluginModuleId);

    // Ensure there is a background entrypoint
    wxt.hook("entrypoints:resolved", (_, entrypoints) => {
      const hasBackground = entrypoints.find(
        (entry) => entry.type === "background"
      );
      if (!hasBackground) {
        entrypoints.push({
          type: "background",
          inputPath: "virtual:user-background",
          name: "background",
          options: {},
          outputDir: wxt.config.outDir,
          skipped: false,
        });
      }
    });

    // Add manifest permissions
    wxt.hook("build:manifestGenerated", (_wxt, manifest) => {
      const useOptionalPermissions = options?.optionalPermissions ?? false;
      const permissionsArray = useOptionalPermissions
        ? "optional_permissions"
        : "permissions";

      manifest[permissionsArray] = manifest[permissionsArray] || [];
      for (const permission of ["offscreen", "clipboardWrite"]) {
        if (!manifest[permissionsArray].includes(permission)) {
          manifest[permissionsArray].push(permission);
        }
      }
    });

    // Add offscreen HTML asset
    wxt.hook("build:publicAssets", (_, assets) => {
      assets.push({
        relativeDest: "offscreen-clipboard.html",
        contents:
          '<!DOCTYPE html><textarea id="text"></textarea><script src="offscreen-clipboard.js" type="module"></script>',
      });
      assets.push({
        relativeDest: "offscreen-clipboard.js",
        contents: `const textarea = document.getElementById("text");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "clipboard-write-offscreen") {
    return;
  }

  try {
    textarea.value = message.data;
    textarea.select();
    const success = document.execCommand("copy");
    sendResponse({ success: success, error: success ? null : "execCommand failed" });
  } catch (error) {
    console.error("Failed to write to clipboard:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});
`,
      });
    });
  },
});
