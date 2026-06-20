// background.js — append #d365mkt-nocache only for Dynamics 365 form URLs

// Import config.js into the service worker
importScripts('config.js');

/**
 * Regular expression to match Dynamics 365 Marketing form asset URLs.
 * Matches URLs like: https://assets-gbr.mkt.dynamics.com/...
 * @type {RegExp}
 */
const dynamicsRegex = CONFIG.PATTERNS.DYNAMICS_URL;

/**
 * Listens for tab URL updates and applies cache bypass for Dynamics 365 form pages.
 * Triggers when a tab's URL changes and the new URL matches the Dynamics 365 pattern.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && dynamicsRegex.test(changeInfo.url)) {
    applyNoCache(tabId, changeInfo.url);
  }
});

/**
 * Applies the #d365mkt-nocache hash to a tab's URL.
 * Only updates the tab if the URL actually needs to change.
 *
 * @param {number} tabId - The ID of the tab to modify
 * @param {string} url - The current URL of the tab
 * @returns {void}
 */
function applyNoCache(tabId, url) {
  if (url.includes(CONFIG.CACHE_BYPASS.URL_HASH)) {
    return;
  }

  chrome.tabs.update(tabId, { url: url + CONFIG.CACHE_BYPASS.URL_HASH }, () => {
    if (chrome.runtime.lastError) {
      console.error('[D365 Form Tester] Error updating tab URL:', chrome.runtime.lastError);
    }
  });
}
