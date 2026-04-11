# Security Notes — Known Issues

This file documents known security issues in the source. **These are tracked here so they're not forgotten and so anyone reviewing the code knows what's already on the radar.**

## Hardcoded WooCommerce API credentials (HIGH PRIORITY)

**File:** `terminal/panel/terminal.jsx` lines 66-75 (function `getRestAPIPoint()`)

**Issue:** Hardcoded WooCommerce API key and secret are embedded in plain text in the panel source. They're decodable from any installed `.zxp` since the panel JS is just text inside the bundle.

```javascript
data.licenseAPIKey = "ck_60bbfd050bb532fc54354a7cd5104f09a203b2d0";
data.licenseSecretKey = "cs_8ea328e5927e16aab8472579b122491cf4defcff";
```

These same credentials are also in:
- FastFX `src/js/hooks/useVerifyOnline.ts:22-23`
- Surveillance `client/js/main.js:22-23`

**Followup work needed:**
1. Generate new WooCommerce API credentials in the LMFWC admin panel
2. Move the actual values to a build-time injection (env vars + bundler replace) so they don't live in source
3. Re-release all 3 plugins with the new credentials
4. Revoke the old credentials in WooCommerce
5. Force-push clean git history (or accept the credentials live in git history forever and rely on revocation)

**Risk:** Anyone with the .zxp file (i.e., any current customer + anyone who has read access to this repo) can:
- Activate, validate, or deactivate any license they have the key for
- Query the LMFWC API
- They CANNOT issue refunds or modify orders (those require WooCommerce admin)

## Native listener — ad-hoc code signing only (MEDIUM PRIORITY)

**Files:** `native-listener/native-listener/Makefile` line 19

The native keystroke listener is signed with `codesign --force --deep --sign -` (ad-hoc). On modern macOS (Big Sur+), Gatekeeper will block ad-hoc signed binaries unless the user explicitly allows them in System Preferences.

**Followup work needed:**
1. Get a Developer ID Application certificate from Apple
2. Sign the listener with the Developer ID
3. Notarize with Apple via `xcrun notarytool`
4. Bundle into a properly signed installer

## License file format is fragile (LOW PRIORITY)

**File:** `terminal/panel/terminal.jsx` lines 144-150

The offline license file is parsed as exactly 3 lines (encrypted key, timestamp, email). If any line is missing or malformed, parsing crashes silently.

**Followup work needed:** validate the file format before parsing, fall back to "no cached license" if invalid.
