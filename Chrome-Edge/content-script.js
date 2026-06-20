// content-script.js — Overlay with checkboxes and reload button

// Config is loaded from config.js (loaded first in manifest.json)
// Access configuration via the global CONFIG object

const STYLE_ID = CONFIG.ELEMENT_IDS.STYLE;
const OVERLAY_ID = CONFIG.ELEMENT_IDS.OVERLAY;

/**
 * Monitors network requests for Dynamics 365 form API calls using PerformanceObserver.
 * Logs form API detections to console with color-coded output.
 * This is a CSP-compliant alternative to intercepting network requests.
 *
 * @returns {void}
 */
function detectNetworkRequests() {
  const LOG_PREFIX = CONFIG.LOGGING.PREFIX;
  const LOG_STYLE = CONFIG.LOGGING.PREFIX_STYLE;
  
  // Monitor for form API calls via PerformanceObserver if available
  if (window.PerformanceObserver) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name && entry.name.includes('landingpageforms')) {
            console.log(LOG_PREFIX + ' %cForm API detected via performance:', LOG_STYLE, `color: ${CONFIG.COLORS.INFO};`, entry.name);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      console.log(LOG_PREFIX + ' %cPerformance observer monitoring enabled', LOG_STYLE, `color: ${CONFIG.COLORS.SUCCESS};`);
    } catch (e) {
      console.log(LOG_PREFIX + ' %cPerformance observer not available:', LOG_STYLE, `color: ${CONFIG.COLORS.NOTICE};`, e.message);
    }
  }
}

/**
 * Checks only for a Dynamics 365 form ID and its related metadata.
 *
 * @returns {{found: boolean, formId: string|null, apiUrl: string|null, cachedUrl: string|null}}
 */
function detectFormId() {
  const LOG_PREFIX = CONFIG.LOGGING.PREFIX;
  const LOG_STYLE = CONFIG.LOGGING.PREFIX_STYLE;

  console.log(LOG_PREFIX + ' %cChecking for form ID...', LOG_STYLE, `color: ${CONFIG.COLORS.WARNING};`);

  let formContainer;
  try {
    formContainer = document.querySelector(CONFIG.SELECTORS.FORM_ID_CONTAINER);
  } catch (e) {
    console.error(LOG_PREFIX + ' %cError checking for form ID:', LOG_STYLE, `color: ${CONFIG.COLORS.ERROR};`, e);
    return { found: false, formId: null, apiUrl: null, cachedUrl: null };
  }

  if (!formContainer) {
    console.log(LOG_PREFIX + ' %c✗ FORM ID NOT DETECTED', LOG_STYLE, `color: ${CONFIG.COLORS.ERROR}; font-size: 14px;`);
    return { found: false, formId: null, apiUrl: null, cachedUrl: null };
  }

  const formIdState = {
    found: true,
    formId: formContainer.getAttribute('data-form-id'),
    apiUrl: formContainer.getAttribute('data-form-api-url'),
    cachedUrl: formContainer.getAttribute('data-cached-form-url')
  };

  console.log(LOG_PREFIX + ' %c✓ FORM ID DETECTED', LOG_STYLE, `color: ${CONFIG.COLORS.SUCCESS}; font-size: 14px;`);
  console.log(LOG_PREFIX + ' %cForm ID:', LOG_STYLE, `color: ${CONFIG.COLORS.INFO};`, formIdState.formId);
  return formIdState;
}

/**
 * Finds the most specific container that can contain Dynamics 365 form fields.
 * Form ID presence is not required.
 *
 * @returns {Element|null}
 */
function getFieldContainer() {
  const formIdContainer = document.querySelector(CONFIG.SELECTORS.FORM_ID_CONTAINER);

  if (formIdContainer) {
    const nestedMarketingForm = formIdContainer.matches(CONFIG.SELECTORS.MARKETING_FORM)
      ? formIdContainer
      : formIdContainer.querySelector(CONFIG.SELECTORS.MARKETING_FORM);

    return nestedMarketingForm || formIdContainer;
  }

  return document.querySelector(CONFIG.SELECTORS.MARKETING_FORM);
}

/**
 * Checks only for form fields and counts data-entry controls.
 *
 * @returns {{found: boolean, fieldCount: number}}
 */
function detectFormFields() {
  const LOG_PREFIX = CONFIG.LOGGING.PREFIX;
  const LOG_STYLE = CONFIG.LOGGING.PREFIX_STYLE;

  try {
    const fieldContainer = getFieldContainer();
    const fieldCount = fieldContainer
      ? fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length
      : 0;

    console.log(
      LOG_PREFIX + ' %cForm fields detected:',
      LOG_STYLE,
      `color: ${fieldCount > 0 ? CONFIG.COLORS.CYAN : CONFIG.COLORS.NOTICE};`,
      fieldCount
    );

    return { found: fieldCount > 0, fieldCount };
  } catch (e) {
    console.error(LOG_PREFIX + ' %cError checking form fields:', LOG_STYLE, `color: ${CONFIG.COLORS.ERROR};`, e);
    return { found: false, fieldCount: 0 };
  }
}

/**
 * Sets up a MutationObserver to monitor dynamic changes to form fields.
 *
 * @returns {void}
 */
function monitorFormMutations() {
  const fieldContainer = getFieldContainer();
  const LOG_PREFIX = CONFIG.LOGGING.PREFIX;
  const LOG_STYLE = CONFIG.LOGGING.PREFIX_STYLE;

  if (!fieldContainer) {
    console.log(LOG_PREFIX + ' %cNo form to monitor for mutations', LOG_STYLE, `color: ${CONFIG.COLORS.NOTICE};`);
    return;
  }

  let lastFieldCount = fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length;

  const observer = new MutationObserver(() => {
    const currentFieldCount = fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length;

    // Only log if count actually changed
    if (currentFieldCount !== lastFieldCount) {
      console.log(LOG_PREFIX + ' %cForm fields updated: ' + lastFieldCount + ' → ' + currentFieldCount, LOG_STYLE, `color: ${CONFIG.COLORS.CYAN};`);
      lastFieldCount = currentFieldCount;
    }
  });

  observer.observe(fieldContainer, {
    childList: true,
    subtree: true
  });

  console.log(LOG_PREFIX + ' %cMutation observer active', LOG_STYLE, `color: ${CONFIG.COLORS.SUCCESS};`);
}

// Overlay functionality removed - all UI now handled by popup

// ensureOverlay function removed - overlay no longer displayed on page

// updateOverlayStatus function removed - overlay no longer displayed on page

/**
 * Message listener to respond to popup requests for form information
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === CONFIG.MESSAGE_TYPES.GET_FORM_INFO) {
    const formIdState = detectFormId();
    const fieldState = detectFormFields();

    sendResponse({
      formIdDetected: formIdState.found,
      formId: formIdState.formId,
      fieldsDetected: fieldState.found,
      fieldCount: fieldState.fieldCount
    });
  }

  // TOGGLE_EXTENSION message removed - no overlay to toggle
});

// Initialize - wait for DOM to be ready
console.log(CONFIG.LOGGING.PREFIX + ' %cExtension loaded!', CONFIG.LOGGING.PREFIX_STYLE, `color: ${CONFIG.COLORS.SUCCESS};`);
detectNetworkRequests();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log(CONFIG.LOGGING.PREFIX + ' %cMonitoring forms - all UI in popup', CONFIG.LOGGING.PREFIX_STYLE, `color: ${CONFIG.COLORS.SUCCESS};`);
    monitorFormMutations();
    detectFormId();
    detectFormFields();
  });
} else {
  console.log(CONFIG.LOGGING.PREFIX + ' %cMonitoring forms - all UI in popup', CONFIG.LOGGING.PREFIX_STYLE, `color: ${CONFIG.COLORS.SUCCESS};`);
  monitorFormMutations();
  detectFormId();
  detectFormFields();
}
