import { defineBuildConfig } from "unbuild";
import { resolve } from "node:path";

export default defineBuildConfig({
  rootDir: resolve(__dirname, "modules"),
  outDir: resolve(__dirname, "dist"),
  entries: ["index.ts", "client.ts", "background-plugin.ts"],
  externals: ["wxt", "wxt/browser", "wxt/modules", "vite"],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
