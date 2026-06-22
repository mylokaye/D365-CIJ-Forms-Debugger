// content-script.js — Overlay with checkboxes and reload button

// Config is loaded from config.js (loaded first in manifest.json)
// Access configuration via the global CONFIG object

const STYLE_ID = CONFIG.ELEMENT_IDS.STYLE;
const OVERLAY_ID = CONFIG.ELEMENT_IDS.OVERLAY;
const HIDDEN_FIELDS_STYLE_ID = CONFIG.ELEMENT_IDS.HIDDEN_FIELDS_STYLE;
const hiddenFieldLabels = new Map();
let hiddenFieldsEnabled = true;
let hiddenFieldsObserver = null;

/**
 * Writes a consistently branded console message.
 *
 * @param {"log"|"warn"|"error"} level - Console severity
 * @param {string} message - Clear user-facing diagnostic message
 * @param {...unknown} details - Optional safe diagnostic details
 * @returns {void}
 */
function writeLog(level, message, ...details) {
  const detailText = details
    .map((detail) => detail instanceof Error ? detail.message : String(detail))
    .filter(Boolean)
    .join(' ');
  const fullMessage = detailText ? `${message} ${detailText}` : message;
  console[level](
    `%c${CONFIG.LOGGING.PREFIX}%c ${fullMessage}`,
    CONFIG.LOGGING.PREFIX_STYLE,
    CONFIG.LOGGING.MESSAGE_STYLE
  );
}

/**
 * Adds the stylesheet used by hidden-field debug labels.
 *
 * @returns {void}
 */
function ensureHiddenFieldStyles() {
  if (document.getElementById(HIDDEN_FIELDS_STYLE_ID)) return;

  const styleParent = document.head || document.documentElement;
  if (!styleParent) return;

  const style = document.createElement('style');
  style.id = HIDDEN_FIELDS_STYLE_ID;
  style.textContent = `
    .${CONFIG.HIDDEN_FIELD_DEBUG.CLASS_NAME} {
      display: flex !important;
      flex-direction: column;
    }

    .${CONFIG.HIDDEN_FIELD_DEBUG.CLASS_NAME} :is(input, select, textarea) {
      border-color: #07883b !important;
      box-shadow: 0 0 0 1px #07883b !important;
    }
  `;
  styleParent.appendChild(style);
}

/**
 * Returns the user-facing field label, falling back to form metadata.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} hiddenField - Hidden field to describe
 * @param {Element|null} fieldBlock - Dynamics field block containing the field
 * @returns {string}
 */
function getHiddenFieldDisplayName(hiddenField, fieldBlock) {
  const fieldLabel = fieldBlock?.querySelector('label')?.textContent?.trim();
  return fieldLabel || hiddenField.name || hiddenField.id || 'unnamed';
}

/**
 * Removes independent submission behavior from a cloned debug field.
 *
 * @param {Element} debugElement - Cloned field block or fallback debug block
 * @returns {void}
 */
function sanitizeHiddenFieldDebugElement(debugElement) {
  debugElement.removeAttribute('data-hide');
  debugElement.style.removeProperty('display');
  debugElement.classList.add(CONFIG.HIDDEN_FIELD_DEBUG.CLASS_NAME);
  debugElement.setAttribute(CONFIG.HIDDEN_FIELD_DEBUG.MARKER_ATTRIBUTE, 'true');

  for (const element of debugElement.querySelectorAll('[id]')) {
    element.removeAttribute('id');
  }

  for (const label of debugElement.querySelectorAll('label[for]')) {
    label.removeAttribute('for');
  }

  for (const control of debugElement.querySelectorAll('input, select, textarea')) {
    if (control instanceof HTMLInputElement && control.type === 'hidden') {
      control.type = 'text';
    }

    control.removeAttribute('form');
    control.removeAttribute('list');
    control.removeAttribute('name');
    control.removeAttribute('required');
    control.disabled = false;
    control.removeAttribute('aria-readonly');
  }

  for (const button of debugElement.querySelectorAll('button')) button.disabled = true;
}

/**
 * Connects a debug control to its original hidden field for this page session.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} sourceControl - Original form control
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} debugControl - Visible debug control
 * @returns {void}
 */
function connectHiddenFieldEditor(sourceControl, debugControl) {
  const synchronizeValue = (event) => {
    if (sourceControl instanceof HTMLInputElement && ['checkbox', 'radio'].includes(sourceControl.type)) {
      sourceControl.checked = debugControl.checked;
    } else {
      sourceControl.value = debugControl.value;
    }

    sourceControl.dispatchEvent(new Event(event.type, { bubbles: true }));
  };

  debugControl.addEventListener('input', synchronizeValue);
  debugControl.addEventListener('change', synchronizeValue);
}

/**
 * Copies current page-session values into a non-submitting debug clone.
 *
 * @param {Element} sourceElement - Original hidden field block
 * @param {Element} debugElement - Sanitized visible clone
 * @returns {void}
 */
function updateHiddenFieldDebugValues(sourceElement, debugElement) {
  const sourceControls = sourceElement.matches('input, select, textarea')
    ? [sourceElement]
    : Array.from(sourceElement.querySelectorAll('input, select, textarea'));
  const debugControls = Array.from(debugElement.querySelectorAll('input, select, textarea'));

  sourceControls.forEach((sourceControl, index) => {
    const debugControl = debugControls[index];
    if (!debugControl) return;

    if (sourceControl instanceof HTMLInputElement && ['checkbox', 'radio'].includes(sourceControl.type)) {
      debugControl.checked = sourceControl.checked;
    } else {
      debugControl.value = sourceControl.value;
    }

    if (debugControl instanceof HTMLSelectElement) {
      const selectedOption = debugControl.selectedOptions[0];
      if (!sourceControl.value && selectedOption && selectedOption.textContent !== 'empty') {
        selectedOption.textContent = 'empty';
      }
    } else {
      debugControl.placeholder = sourceControl.value ? sourceControl.placeholder : 'empty';
    }
  });
}

/**
 * Creates a visible, editable representation of a hidden Dynamics field.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} hiddenField - Hidden source control
 * @param {Element} labelAnchor - Hidden field block or native hidden input
 * @returns {Element}
 */
function createHiddenFieldDebugElement(hiddenField, labelAnchor) {
  const fieldBlock = labelAnchor === hiddenField ? null : labelAnchor;
  let debugElement;

  if (fieldBlock) {
    debugElement = fieldBlock.cloneNode(true);
  } else {
    debugElement = document.createElement('div');
    debugElement.className = 'textFormFieldBlock';

    const label = document.createElement('label');
    label.textContent = getHiddenFieldDisplayName(hiddenField, null);

    const value = document.createElement('input');
    value.type = 'text';
    value.value = hiddenField.value;
    value.placeholder = hiddenField.value || 'empty';

    debugElement.append(label, value);
  }

  sanitizeHiddenFieldDebugElement(debugElement);
  debugElement.setAttribute(
    'aria-label',
    `Hidden field: ${getHiddenFieldDisplayName(hiddenField, fieldBlock)}`
  );
  updateHiddenFieldDebugValues(fieldBlock || hiddenField, debugElement);

  const sourceControls = fieldBlock
    ? Array.from(fieldBlock.querySelectorAll('input, select, textarea'))
    : [hiddenField];
  const debugControls = Array.from(debugElement.querySelectorAll('input, select, textarea'));
  sourceControls.forEach((sourceControl, index) => {
    const debugControl = debugControls[index];
    if (debugControl) connectHiddenFieldEditor(sourceControl, debugControl);
  });

  return debugElement;
}

/**
 * Finds where a hidden-field label can be inserted so it remains visible.
 * Dynamics form-designer hidden fields are regular inputs inside hidden field
 * blocks, rather than native input[type="hidden"] elements.
 *
 * @param {HTMLInputElement} field - Candidate hidden field
 * @returns {Element|null}
 */
function getHiddenFieldLabelAnchor(field) {
  const fieldBlock = field.closest(CONFIG.SELECTORS.DYNAMICS_FIELD_BLOCK);

  if (fieldBlock) {
    const fieldBlockStyle = window.getComputedStyle(fieldBlock);
    const fieldBlockIsHidden = fieldBlock.hidden
      || fieldBlockStyle.display === 'none'
      || fieldBlockStyle.visibility === 'hidden';

    if (fieldBlockIsHidden) return fieldBlock;
  }

  return field.type === 'hidden' ? field : null;
}

/**
 * Adds or updates labels for hidden fields in the detected Dynamics form.
 *
 * @returns {void}
 */
function refreshHiddenFields() {
  if (!hiddenFieldsEnabled) return;

  const fieldContainer = getFieldContainer();
  const currentHiddenFields = new Map();

  if (fieldContainer) {
    for (const field of fieldContainer.querySelectorAll(CONFIG.SELECTORS.HIDDEN_FIELD_CANDIDATES)) {
      const labelAnchor = getHiddenFieldLabelAnchor(field);
      if (labelAnchor && !currentHiddenFields.has(labelAnchor)) {
        currentHiddenFields.set(labelAnchor, field);
      }
    }
  }

  for (const [labelAnchor, labelState] of hiddenFieldLabels) {
    if (!currentHiddenFields.has(labelAnchor) || !labelAnchor.isConnected) {
      labelState.label.remove();
      hiddenFieldLabels.delete(labelAnchor);
    }
  }

  for (const [labelAnchor, hiddenField] of currentHiddenFields) {
    let labelState = hiddenFieldLabels.get(labelAnchor);

    if (!labelState || !labelState.label.isConnected) {
      const label = createHiddenFieldDebugElement(hiddenField, labelAnchor);
      labelAnchor.insertAdjacentElement('afterend', label);
      labelState = { label };
      hiddenFieldLabels.set(labelAnchor, labelState);
    }

    updateHiddenFieldDebugValues(labelAnchor, labelState.label);
  }
}

/**
 * Displays editable debug copies of hidden Dynamics form fields.
 *
 * @returns {void}
 */
function showHiddenFields() {
  hiddenFieldsEnabled = true;
  ensureHiddenFieldStyles();
  refreshHiddenFields();

  if (hiddenFieldsObserver || !document.documentElement) return;

  hiddenFieldsObserver = new MutationObserver(() => refreshHiddenFields());
  hiddenFieldsObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'id', 'name', 'style', 'type', 'value']
  });

  writeLog('log', 'Editable hidden-field rendering started.');
}

/**
 * Removes only debug labels and styling created by this extension.
 *
 * @returns {void}
 */
function hideHiddenFields() {
  hiddenFieldsEnabled = false;

  if (hiddenFieldsObserver) {
    hiddenFieldsObserver.disconnect();
    hiddenFieldsObserver = null;
  }

  for (const label of document.querySelectorAll(
    `.${CONFIG.HIDDEN_FIELD_DEBUG.CLASS_NAME}[${CONFIG.HIDDEN_FIELD_DEBUG.MARKER_ATTRIBUTE}="true"]`
  )) {
    label.remove();
  }

  hiddenFieldLabels.clear();
  document.getElementById(HIDDEN_FIELDS_STYLE_ID)?.remove();
}

/**
 * Monitors network requests for Dynamics 365 form API calls using PerformanceObserver.
 * Logs form API detections to console with color-coded output.
 * This is a CSP-compliant alternative to intercepting network requests.
 *
 * @returns {void}
 */
function detectNetworkRequests() {
  // Monitor for form API calls via PerformanceObserver if available
  if (window.PerformanceObserver) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name && entry.name.includes('landingpageforms')) {
            writeLog('log', 'Dynamics form API resource detected.');
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      writeLog('log', 'Form resource monitoring started.');
    } catch (e) {
      writeLog('warn', 'Form resource monitoring is unavailable.', e.message);
    }
  }
}

/**
 * Checks only for a Dynamics 365 form ID and its related metadata.
 *
 * @returns {{found: boolean, formId: string|null, apiUrl: string|null, cachedUrl: string|null}}
 */
function detectFormId() {
  let formContainer;
  try {
    formContainer = document.querySelector(CONFIG.SELECTORS.FORM_ID_CONTAINER);
  } catch (e) {
    writeLog('error', 'Form ID detection failed.', e);
    return { found: false, formId: null, apiUrl: null, cachedUrl: null };
  }

  if (!formContainer) {
    writeLog('log', 'Form ID not detected.');
    return { found: false, formId: null, apiUrl: null, cachedUrl: null };
  }

  const formIdState = {
    found: true,
    formId: formContainer.getAttribute('data-form-id'),
    apiUrl: formContainer.getAttribute('data-form-api-url'),
    cachedUrl: formContainer.getAttribute('data-cached-form-url')
  };

  writeLog('log', `Form ID detected: ${formIdState.formId || 'unknown'}.`);
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
  try {
    const fieldContainer = getFieldContainer();
    const fieldCount = fieldContainer
      ? fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length
      : 0;

    writeLog('log', `Form controls detected: ${fieldCount}.`);

    return { found: fieldCount > 0, fieldCount };
  } catch (e) {
    writeLog('error', 'Form control detection failed.', e);
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

  if (!fieldContainer) {
    writeLog('log', 'Dynamic field monitoring skipped because no form container is available.');
    return;
  }

  let lastFieldCount = fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length;

  const observer = new MutationObserver(() => {
    const currentFieldCount = fieldContainer.querySelectorAll(CONFIG.SELECTORS.FIELD_CONTROLS).length;

    // Only log if count actually changed
    if (currentFieldCount !== lastFieldCount) {
      writeLog('log', `Form control count updated: ${lastFieldCount} → ${currentFieldCount}.`);
      lastFieldCount = currentFieldCount;
    }
  });

  observer.observe(fieldContainer, {
    childList: true,
    subtree: true
  });

  writeLog('log', 'Dynamic field monitoring started.');
}

// Overlay functionality removed - all UI now handled by popup

// ensureOverlay function removed - overlay no longer displayed on page

// updateOverlayStatus function removed - overlay no longer displayed on page

/**
 * Message listener to respond to popup requests for form information
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  if (message.type === CONFIG.MESSAGE_TYPES.GET_FORM_INFO) {
    const formIdState = detectFormId();

    sendResponse({
      formIdDetected: formIdState.found,
      formId: formIdState.formId
    });
  }

  // TOGGLE_EXTENSION message removed - no overlay to toggle
});

// Initialize - wait for DOM to be ready
writeLog('log', 'Content script initialized.');
detectNetworkRequests();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    writeLog('log', 'Form inspection started.');
    monitorFormMutations();
    detectFormId();
    detectFormFields();
    showHiddenFields();
  });
} else {
  writeLog('log', 'Form inspection started.');
  monitorFormMutations();
  detectFormId();
  detectFormFields();
  showHiddenFields();
}
