import { setupClipboard } from "./client";

export default () => {
  if (import.meta.env.ENTRYPOINT !== "background") return;

  setupClipboard();
};
