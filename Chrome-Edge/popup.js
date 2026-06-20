/**
 * popup.js — Handles the extension popup UI for Form Debugger
 *
 * This script manages the popup interface showing form detection status,
 * form details, and cache control.
 *
 * Config is loaded from config.js (included via script tag before this file)
 */

/**
 * DOM element references
 */
const formIdElement = document.getElementById("form-id");
const fieldsCountElement = document.getElementById("fields-count");
const formStatusElement = document.getElementById("form-status");

/**
 * Update the form ID detection status pill
 * @param {boolean} detected - Whether a form ID is detected
 */
function updateFormIdStatusUI(detected) {
  if (detected) {
    formStatusElement.className = "status-button status-green";
    formStatusElement.textContent = "Form ID detected";
  } else {
    formStatusElement.className = "status-button status-red";
    formStatusElement.textContent = "Form ID not detected";
  }
}

/**
 * Query the active tab for form information
 */
function queryFormInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { type: CONFIG.MESSAGE_TYPES.GET_FORM_INFO }, (response) => {
      if (chrome.runtime.lastError) {
        // No response from content script - neither check can run
        updateFormIdStatusUI(false);
        formIdElement.textContent = "---";
        fieldsCountElement.textContent = "0";
        return;
      }

      const formIdDetected = Boolean(response && response.formIdDetected);
      const fieldsDetected = Boolean(response && response.fieldsDetected);

      updateFormIdStatusUI(formIdDetected);
      formIdElement.textContent = formIdDetected ? (response.formId || "Unknown") : "---";
      fieldsCountElement.textContent = fieldsDetected ? String(response.fieldCount) : "0";
    });
  });
}

/**
 * Query form info on popup open
 */
queryFormInfo();

/**
 * Add click-to-copy functionality for info values
 */
function addCopyToClipboard(element) {
  element.addEventListener("click", () => {
    const text = element.textContent;
    if (text && text !== "---" && text !== "0" && text !== "Copied") {
      navigator.clipboard.writeText(text).then(() => {
        // Visual feedback - show "Copied!" message
        const originalText = element.textContent;
        element.textContent = "Copied";
        element.classList.add("is-copied");

        setTimeout(() => {
          element.textContent = originalText;
          element.classList.remove("is-copied");
        }, 1000);
      }).catch(err => {
        console.error('[D365 Form Tester] Failed to copy text:', err);
      });
    }
  });
}

// Add copy functionality to info values
addCopyToClipboard(formIdElement);
addCopyToClipboard(fieldsCountElement);

/**
 * Handle footer link clicks
 */
document.getElementById("report-feedback").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://mylokaye.info" });
});

document.getElementById("get-support").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://mylokaye.info" });
});
