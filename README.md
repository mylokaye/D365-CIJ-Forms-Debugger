# Dynamics 365 Form Debugger

Temporarily disables **Dynamics 365 Customer Insights Forms** cache, allowing you to test form changes quickly.

Test, debug, and validate **Dynamics 365 forms** directly in **Microsoft Edge / Chrome**.

---

## Installation

Install the extension from your browser's store:

- **Chrome Web Store:** [Dynamics 365 Form Debugger](https://chromewebstore.google.com/detail/dynamics-365-form-debugge/kdhnliicfgopcijgepghgohnhafphohf?authuser=0&hl=en-GB)
- **Microsoft Edge Add-ons:** [Dynamics 365 Form Debugger](https://microsoftedge.microsoft.com/addons/detail/dynamics-365-form-debugge/ceoaoafhphcpdokfdfkiilmndbepbbec)

## Overview

**Dynamics 365 Form Debugger** is a lightweight browser extension designed for Dynamics 365 Marketing users, developers, and CRM specialists.
It helps you inspect form behavior, bypass cached data, and view form details with a simple popup interface.

Everything runs **locally** — no data is collected, transmitted, or shared.

---

## Key Features

- ✅ **Instant form detection** - Automatically detects Dynamics 365 forms on the page
- 📋 **View form details** - See the detected Dynamics Form ID
- 🔄 **Automatic cache bypass** using `#d365mkt-nocache`
- ⚡ **Always active** - Cache bypass is applied automatically on supported Dynamics form URLs
- 📋 **Click to copy** - Click any form detail to copy it to clipboard
- 👁️ **Editable hidden fields** - Automatically render editable copies of native hidden inputs and fields hidden in the Dynamics form designer, highlighted with a green border
- 🎨 **Clean popup** - Compact cache status, Form ID, version, and support access
- 🔒 **100% client-side debugging** — no tracking, telemetry, or form-data transmission


---

## How to Use

1. Install the extension from the links above.
2. Open a Dynamics 365 form page, such as: `https://assets-*.mkt.dynamics.com/...`
3. Click the **Dynamics 365 Form Debugger** icon in your browser toolbar.
4. Cache bypass is applied automatically; no activation step is required.
5. View the Form ID, cache status, and installed extension version.
6. Click any value to copy it to your clipboard.
7. Hidden fields are displayed automatically in the form's existing visual style and can be edited directly.

All operations happen locally inside your browser session.

---

## Privacy & Data

This extension **does not** collect, transmit, or store any user or form data. Hidden field values and edits remain in the current page and are not sent to the popup or written to storage.
The extension makes no telemetry or form-data requests. The support button opens an external website only when you select it.
If you submit a form after editing a shown hidden field, the website receives the edited value through its normal form-submission process.

**Permissions Used:**
- `activeTab` - To read form information from the current active tab
- `<all_urls>` - Required because Dynamics 365 forms can be embedded on any website, not just Microsoft domains. The extension only activates when it detects a Dynamics 365 form on the page.

---

# Changelog

## Unreleased

- Standardized console messages under the **Dynamics 365 Form Debugger** name with consistent blue styling and clearer diagnostics.
- Redesigned the popup with centered branding and a compact status panel.
- Hidden fields are always displayed as editable visual copies with green borders and update source controls for form-submission testing.
- Removed the activation toggle and auto-disable state.
- Cache bypass is now always active on supported Dynamics form URLs.
- Removed the `storage` permission because hidden-field display is always active.
- Split Form ID detection from field detection so either check can succeed independently.
- Field count now includes `input`, `select`, and `textarea` controls while excluding action buttons.

## [1.0.0] - 2025-01-XX

### Features
- ✅ Form detection via `[data-form-id]` attribute for Dynamics 365 forms
- 📊 Display Form ID and field count (including hidden fields)
- 🎯 Click-to-copy functionality for form details
- 🔄 Cache bypass via `#d365mkt-nocache` URL hash
- ⚙️ Extension on/off toggle with visual feedback
- ⚡ Smart auto-disable: Extension automatically toggles off when no form is detected
- 🎨 Visual feedback: Info fields turn grey when extension is inactive
- 📡 Performance API monitoring to detect form API calls
- 🔍 Mutation observer to track dynamically loaded form fields
- 📝 Comprehensive console logging with color-coded output

### UI/UX
- Modern popup interface (350px × 400px)
- Status indicators: Form detected (green/red), Cache status (green/red)
- Clean card-based layout with proper spacing
- Interactive elements with hover effects
- Greyed-out info cards when extension is disabled or no form detected
- Auto-disable functionality for better user experience
- Footer links for feedback and support

### Technical Details
- Manifest V3 compliant
- Works on any URL where Dynamics 365 forms are embedded
- CSP-compliant implementation (no eval, no inline scripts)
- Content script runs at `document_start` for early detection
- Real-time field count updates via MutationObserver
- Dynamic UI state management based on form detection
- Auto-disable logic prevents unnecessary cache bypass on non-form pages
- Only activates when Dynamics 365 form is detected via `[data-form-id]` attribute

## Legal Notice

**Dynamics 365** and **Microsoft Edge** are registered trademarks of **Microsoft Corporation**.
This extension, **Dynamics 365 Form Debugger**, is an **independent tool** created by **Mylo Kaye** and is **not affiliated with, endorsed by, or sponsored by Microsoft Corporation** in any way.
All references to Microsoft products are used for informational and compatibility purposes only.

---

## Support & Feedback


---

**Author:** Mylo Kaye
**License:** Apache 2.0
**Version:** 1.0.0
