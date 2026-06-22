/**
 * config.js — Central configuration file for the Dynamics 365 Form Debugger extension
 *
 * This file contains all constants, magic numbers, and configuration values used
 * throughout the extension. Centralizing these values makes the code more maintainable
 * and easier to modify.
 *
 * Note: This file uses a global CONFIG object instead of ES6 exports because content
 * scripts cannot use ES6 modules in browser extensions.
 */

// Define all configuration in a global CONFIG object
const CONFIG = {};

/**
 * DOM element IDs used throughout the extension
 * @const {Object}
 */
CONFIG.ELEMENT_IDS = {
  STYLE: "d365-forms-tester-style",
  OVERLAY: "d365-forms-tester-overlay",
  FORM_BADGE: "form-badge",
  CACHE_BADGE: "cache-badge",
  FORM_INFO: "form-info",
  HIDDEN_FIELDS_STYLE: "d365-debug-hidden-fields-style"
};

/**
 * Timeout values in milliseconds
 * @const {Object}
 */
CONFIG.TIMEOUTS = {
  /** Retry delay when waiting for DOM elements to be available */
  DOM_RETRY: 100
};

/**
 * UI styling constants
 * @const {Object}
 */
CONFIG.STYLES = {
  /** Z-index for overlay to ensure it appears above all other page content */
  OVERLAY_Z_INDEX: 999999
};

/**
 * Console logging configuration
 * @const {Object}
 */
CONFIG.LOGGING = {
  /** Prefix for all console log messages */
  PREFIX: "[Dynamics 365 Form Debugger]",
  /** Blue brand treatment for the plugin name */
  PREFIX_STYLE: "color: #3360C5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 600;",
  /** Matching typography with black diagnostic text */
  MESSAGE_STYLE: "color: #171717; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 600;"
};

/**
 * Regular expression patterns
 * @const {Object}
 */
CONFIG.PATTERNS = {
  /**
   * Matches Dynamics 365 Marketing form asset URLs
   * Examples: https://assets-gbr.mkt.dynamics.com/...
   *           https://assets-usa.mkt.dynamics.com/...
   */
  DYNAMICS_URL: /^https:\/\/assets-[a-z]{3}\.mkt\.dynamics\.com\//i
};

/**
 * Cache bypass configuration
 * @const {Object}
 */
CONFIG.CACHE_BYPASS = {
  /** URL hash used to disable Dynamics 365 form caching */
  URL_HASH: "#d365mkt-nocache"
};

CONFIG.URLS = {
  SUPPORT: "https://mylokaye.info"
};

/**
 * DOM selectors used for form detection
 * @const {Object}
 */
CONFIG.SELECTORS = {
  /** Attribute selector used only for Dynamics 365 form ID detection */
  FORM_ID_CONTAINER: "[data-form-id]",
  /** Dynamics 365 form element used for field detection when no form ID exists */
  MARKETING_FORM: "form.marketingForm",
  /** Data-entry controls counted as fields; submit and other action controls are excluded */
  FIELD_CONTROLS: "input:not([type='submit']):not([type='button']):not([type='reset']), select, textarea",
  /** Native hidden inputs and controls inside Dynamics field-block wrappers */
  HIDDEN_FIELD_CANDIDATES: "input[type='hidden'], [class*='FormFieldBlock'] input, [class*='FormFieldBlock'] select, [class*='FormFieldBlock'] textarea",
  /** Dynamics wraps form-designer hidden fields in a non-rendered field block */
  DYNAMICS_FIELD_BLOCK: "[class*='FormFieldBlock']",
  /** All script tags with src attributes */
  SCRIPTS: "script[src]"
};

/**
 * Message types for inter-component communication
 * @const {Object}
 */
CONFIG.MESSAGE_TYPES = {
  GET_FORM_INFO: "GET_FORM_INFO"
};

CONFIG.HIDDEN_FIELD_DEBUG = {
  CLASS_NAME: "d365-debug-hidden-field",
  MARKER_ATTRIBUTE: "data-d365-debug-hidden-field"
};

// Make CONFIG available globally (for content scripts)
// and also export it for modules (background.js, popup.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// For ES6 modules (background.js with type="module")
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
