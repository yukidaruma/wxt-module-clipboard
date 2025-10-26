import { copyToClipboard } from "wxt-module-clipboard/client";

let timeoutId;

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = document.getElementById("textInput").value;
  const status = document.getElementById("status");

  if (!text) {
    status.textContent = "Please enter some text";
    status.className = "error";
    return;
  }

  try {
    const response = await copyToClipboard(text);

    if (response.success) {
      status.textContent = "Text copied to clipboard!";
      status.className = "success";
    } else {
      status.textContent = "Error: " + response.error;
      status.className = "error";
    }
  } catch (error) {
    status.textContent = "Error: " + error.message;
    status.className = "error";
  }

  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    status.className = "";
  }, 1500);
});
