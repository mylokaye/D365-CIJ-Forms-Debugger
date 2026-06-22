/**
 * popup.js — Renders extension status and detected Form ID.
 * Config is loaded from config.js before this file.
 */

const formIdButton = document.getElementById("form-id");
const formIdValue = document.getElementById("form-id-value");
const versionElement = document.getElementById("extension-version");
const extensionInfoButton = document.getElementById("extension-info");

versionElement.textContent = `V ${chrome.runtime.getManifest().version}`;

/**
 * Updates the detected Form ID without changing the row structure.
 *
 * @param {string|null} formId - Detected Dynamics Form ID
 */
function updateFormId(formId) {
  formIdValue.textContent = formId || "---";
  formIdButton.disabled = !formId;
}

/**
 * Queries the active tab for its detected Dynamics Form ID.
 */
function queryFormInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0] || typeof tabs[0].id !== "number") {
      updateFormId(null);
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: CONFIG.MESSAGE_TYPES.GET_FORM_INFO }, (response) => {
      if (chrome.runtime.lastError || !response || response.formIdDetected !== true) {
        updateFormId(null);
        return;
      }

      updateFormId(response.formId || "Unknown");
    });
  });
}

formIdButton.addEventListener("click", () => {
  const formId = formIdValue.textContent;
  if (!formId || formId === "---" || formId === "Copied") return;

  navigator.clipboard.writeText(formId).then(() => {
    const originalFormId = formId;
    formIdValue.textContent = "Copied";
    formIdButton.classList.add("is-copied");

    setTimeout(() => {
      formIdValue.textContent = originalFormId;
      formIdButton.classList.remove("is-copied");
    }, 1000);
  }).catch((error) => {
    console.error(
      `%c${CONFIG.LOGGING.PREFIX}%c Form ID could not be copied. ${error.message || String(error)}`,
      CONFIG.LOGGING.PREFIX_STYLE,
      CONFIG.LOGGING.MESSAGE_STYLE
    );
  });
});

extensionInfoButton.addEventListener("click", () => {
  chrome.tabs.create({ url: CONFIG.URLS.SUPPORT }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        `%c${CONFIG.LOGGING.PREFIX}%c Support page could not be opened. ${chrome.runtime.lastError.message}`,
        CONFIG.LOGGING.PREFIX_STYLE,
        CONFIG.LOGGING.MESSAGE_STYLE
      );
    }
  });
});

queryFormInfo();
