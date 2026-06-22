/**
 * popup.js — Renders extension status and detected Form ID.
 * Config is loaded from config.js before this file.
 */

const formIdButton = document.getElementById("form-id");
const formIdValue = document.getElementById("form-id-value");
const formIdLabel = document.getElementById("form-id-label");
const cacheStatus = document.getElementById("cache-status");
const extensionDetails = document.getElementById("extension-details");
const versionElement = document.getElementById("extension-version");
const extensionInfoButton = document.getElementById("extension-info");

/**
 * Returns a localized message with a stable English fallback.
 *
 * @param {string} name - Message key from _locales
 * @param {string} fallback - English fallback used if a locale entry is missing
 * @returns {string}
 */
function getMessage(name, fallback) {
  return chrome.i18n.getMessage(name) || fallback;
}

document.documentElement.lang = chrome.i18n.getUILanguage();
document.title = getMessage("extensionName", "Dynamics 365 Form Debugger");
cacheStatus.textContent = getMessage("cacheDisabled", "Cache disabled");
formIdLabel.textContent = getMessage("formIdLabel", "Form ID:");
formIdButton.title = getMessage("copyFormId", "Copy Form ID");
extensionDetails.setAttribute("aria-label", getMessage("extensionDetails", "Extension details"));
extensionInfoButton.title = getMessage("openSupport", "Open support");
extensionInfoButton.setAttribute("aria-label", getMessage("openSupport", "Open support"));
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

      updateFormId(response.formId || getMessage("unknown", "Unknown"));
    });
  });
}

formIdButton.addEventListener("click", () => {
  const formId = formIdValue.textContent;
  if (!formId || formId === "---" || formIdButton.classList.contains("is-copied")) return;

  navigator.clipboard.writeText(formId).then(() => {
    const originalFormId = formId;
    formIdValue.textContent = getMessage("copied", "Copied");
    formIdButton.classList.add("is-copied");

    setTimeout(() => {
      formIdValue.textContent = originalFormId;
      formIdButton.classList.remove("is-copied");
    }, 1000);
  }).catch((error) => {
    console.error(
      `%c${CONFIG.LOGGING.PREFIX}%c ${getMessage("formIdCopyError", "Form ID could not be copied.")} ${error.message || String(error)}`,
      CONFIG.LOGGING.PREFIX_STYLE,
      CONFIG.LOGGING.MESSAGE_STYLE
    );
  });
});

extensionInfoButton.addEventListener("click", () => {
  chrome.tabs.create({ url: CONFIG.URLS.SUPPORT }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        `%c${CONFIG.LOGGING.PREFIX}%c ${getMessage("supportOpenError", "Support page could not be opened.")} ${chrome.runtime.lastError.message}`,
        CONFIG.LOGGING.PREFIX_STYLE,
        CONFIG.LOGGING.MESSAGE_STYLE
      );
    }
  });
});

queryFormInfo();
