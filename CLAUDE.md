# CLAUDE.md — Terminal

> **For Claude Code:** This file is loaded automatically when you open any session in this folder. Always also load `~/Plugins/_shared/CUSTOMER_BUG_INVESTIGATION.md` for the bug-fix mental model.
>
> **For Claud (the support agent):** This is your reference for everything about Terminal.

---

## What Terminal Is

Terminal is a **command-palette-style plugin for Adobe Premiere Pro and After Effects**. The user presses a global hotkey (default: **Cmd+1 on Mac, Ctrl+1 on Windows**), which opens a small search panel inside Premiere or AE. The user types a natural-language command like "add blur" or "increase speed to 200%", and Terminal applies the matching effect, transition, or preset to the selected clip.

**This is NOT a standalone app.** Earlier project notes described it as "standalone" or "JavaScript + native listeners" — that's misleading. The reality:

- Terminal is a **CEP plugin** (just like FastFX and Surveillance)
- It runs **inside Premiere Pro AND After Effects** (the only plugin in the catalog that supports both)
- The "native code" is a tiny separate executable (~84 lines of Objective-C on Mac, ~63 lines of C++ on Windows) that does ONE thing: listen for the global hotkey and tell the plugin's worker to open the panel
- The native listener is auxiliary, not the main plugin

---

## Technology Stack (verified by source inspection)

| Component | Technology |
|---|---|
| **Plugin framework** | CEP 9 (Common Extensibility Platform), CSXS manifest version 6.0, RequiredRuntime 9.0 |
| **Host apps** | **Both Premiere Pro AND After Effects** (`HostList: PPRO + AEFT, version [0.0,99.9]`) |
| **Panel UI** | HTML5 + CSS + vanilla JavaScript (in CEF webview) |
| **Backend** | ExtendScript (`terminal.jsx`, 867 lines) + JavaScript ES6 action classes |
| **Native keystroke listener (Mac)** | Objective-C (`KeyboardListener.m`, 84 lines) using Core Graphics Event Taps |
| **Native keystroke listener (Windows)** | C++ (`KeyboardListenerWin.cpp`, 63 lines) using `SetWindowsHookEx` low-level keyboard hook |
| **Native build system** | Mac: clang Makefile. Windows: MSVC `Makefile.win`. |
| **CSInterface SDK** | v11.0.0 |
| **Current version** | **0.0.1** (locked — never updated) |
| **ML model** | `model.json`, `tokenizer.json`, `group1-shard1of1.bin` (~5MB) — files are present but **AICommandProcessor.js actually uses keyword matching, not real inference**. The model files appear to be unused. |

---

## File Structure

```
Terminal/
├── terminal/                          # Main CEP plugin
│   ├── .debug                         # Debug ports: PPRO 8096/8196, AEFT 8097/8197
│   ├── CSXS/
│   │   └── manifest.xml              # Declares TWO extensions: panel + worker
│   ├── assets/
│   │   └── caution.svg               # Accessibility warning icon
│   ├── panel/                         # The visible 400x350 panel UI
│   │   ├── index.html                # 🔧 140KB / 2,900+ lines — main UI
│   │   ├── terminal.jsx              # 🔧 ExtendScript host code, 867 lines
│   │   ├── terminal.jsxbin           # Compiled binary version
│   │   ├── AICommandProcessor.js     # 🔧 1,711 lines — natural language parser
│   │   ├── PremiereActions.js        # 🔧 1,995 lines — Premiere effect/preset wrappers
│   │   ├── AEActions.js              # 🔧 2,226 lines — After Effects effect/preset wrappers
│   │   └── CSInterface.js            # Adobe SDK v11
│   ├── worker/                        # Hidden 1x1px background worker
│   │   ├── index.html                # 740+ lines — spawns native listener, manages cache
│   │   ├── terminal-listener         # Compiled Mac universal binary (132KB)
│   │   └── terminal-listener.exe     # Compiled Windows binary (215KB)
│   └── model/                         # ML model files (apparently unused)
│       ├── model.json
│       ├── tokenizer.json
│       └── group1-shard1of1.bin
│
└── native-listener/                   # Source for native keystroke listeners
    └── native-listener/
        ├── KeyboardListener.m         # Mac source (84 lines)
        ├── KeyboardListenerWin.cpp    # Windows source (63 lines)
        ├── Makefile                   # Mac build (clang)
        └── Makefile.win               # Windows build (MSVC cl.exe)
```

**Critical files** (where 90% of bugs will be):
- `terminal/panel/index.html` — UI + event handlers
- `terminal/panel/AICommandProcessor.js` — command parsing (keyword matching, not ML)
- `terminal/panel/PremiereActions.js` — Premiere API wrapper
- `terminal/panel/AEActions.js` — After Effects API wrapper
- `terminal/panel/terminal.jsx` — host-side ExtendScript

---

## Build Pipeline

### CEP plugin
**No automated pipeline.** Manual packaging — same situation as Surveillance. To produce a `.ccx` or `.zxp` for distribution, the entire `terminal/` folder is signed via Adobe ZXPSignCmd against an external certificate.

### Native keystroke listener (Mac)

```bash
cd native-listener/native-listener/
make universal    # builds x86_64 + arm64 universal binary
make sign         # ad-hoc code signing (codesign --force --deep --sign -)
make clean        # remove build artifacts
```

The `Makefile` defines `TARGET = fxlauncher-listener` (line 4) but the actual binary that gets shipped is named `terminal-listener` — there's a name mismatch from a copy-paste leftover. **Don't "fix" this without understanding why** — fixing the target name without also updating the install path will break the worker's ability to find and spawn the listener.

**Code signing:** Ad-hoc only. **No notarization.** This means:
- The plugin will be blocked by Gatekeeper on modern macOS (Big Sur+) without explicit user override
- For distribution, the listener needs proper Developer ID signing + Apple notarization

### Native keystroke listener (Windows)

```bash
cd native-listener/native-listener/
nmake -f Makefile.win
```

Compiles `KeyboardListenerWin.cpp` to `terminal-listener.exe` using MSVC `cl.exe`. **No code signing.**

---

## Core Architecture

### The two CEP extensions

The `manifest.xml` declares **two separate CEP extensions** that work together:

1. **`com.example.terminal.panel`** — the visible 400×350px search UI
   - HTML: `panel/index.html`
   - Script: `panel/terminal.jsx`
   - Lifecycle: Opens on demand (when worker triggers it via the global hotkey)

2. **`com.example.terminal.worker`** — a hidden 1×1px background helper
   - HTML: `worker/index.html`
   - Lifecycle: Auto-starts when Premiere/AE launches (`AutoVisible` is set so it's always running invisibly)
   - Job: Spawn the native keystroke listener as a child process and listen for its stdout

### The data flow (full picture)

```
1. User presses Cmd+1 (Mac) or Ctrl+1 (Windows)
2. Native listener (terminal-listener / terminal-listener.exe) detects it via OS-level hook
3. Listener writes JSON to stdout: {"code":"31","shift":false,"ctrl":false,"alt":false,"meta":true}
4. Worker process (worker/index.html) reads stdout via Node.js child_process
5. Worker parses the keypress and matches against the configured shortcut
6. Worker calls csInterface.requestOpenExtension("com.example.terminal.panel")
7. The panel UI opens
8. User types a command like "add blur"
9. AICommandProcessor.processCommand() parses intent (keyword matching, NOT real ML)
10. Calls into PremiereActions.applyEffect() or AEActions.applyEffect()
11. Those call csInterface.evalScript("...") to invoke functions in terminal.jsx
12. terminal.jsx applies the effect to the selected clip via the AE/Premiere ExtendScript API
```

### Application state storage

| Data | Location | Format |
|---|---|---|
| Encrypted license | `Folder.userData / com.terminal.lic` (3 lines: encrypted key, timestamp, email) | XOR-encrypted text |
| User favorites | `localStorage.terminalFavorites` | JSON |
| Plugin settings | `{USER_DATA}/terminal_settings.json` | JSON |

User data dirs:
- Mac: `~/Library/Application Support/`
- Windows: `%APPDATA%\`

---

## ⚠️ OFF-LIMITS FILES — NEVER MODIFY

| File / area | Why it's off-limits |
|---|---|
| `terminal/panel/terminal.jsx` lines 66-75 (function `getRestAPIPoint()`) | **Hardcoded WooCommerce API credentials** — same `ck_60bbfd...` and `cs_8ea328...` as FastFX and Surveillance. Calls to `tinytapes.com/wp-json/lmfwc/v2/licenses/{activate,validate,deactivate}/`. |
| `terminal/panel/terminal.jsx` `validateLicenseKey()` function | License regex `^(TERM)[A-Z0-9]{16}(TT)$`, license activation flow |
| `terminal/panel/terminal.jsx` `saveOfflineLicense()` (~95-103) | Writes encrypted license to disk |
| `terminal/panel/terminal.jsx` `checkOfflineLicense()` (~83-93) | Reads cached offline license |
| `terminal/panel/terminal.jsx` `removeOfflineLicense()` (~76-81) | Deletes license file |
| `terminal/panel/terminal.jsx` `ParseServerData()` (~105-136) | Parses LMFWC API responses, handles error code 509 (max activations) |
| `terminal/panel/index.html` license validation functions | Same |
| **The `if(!terminal.activate)` license gate** in every action function | **NEVER REMOVE OR BYPASS** — this is what enforces licensing on every effect application |

**Plus the native listener files** (`KeyboardListener.m`, `KeyboardListenerWin.cpp`) — these involve OS-level keyboard hooks and have stability and security implications. Escalate any bugs there.

---

## Common Bug Categories (where bugs actually live)

### 1. Command parsing bugs (very common)

The customer types something like "add a blur" but Terminal doesn't understand it.

**Where to look:**
- `terminal/panel/AICommandProcessor.js` — the `processCommand()`, `determineIntent()`, and `executeIntent()` functions
- This is the **#1 bug source** because the parser is keyword-matching, not real ML, so synonyms and edge cases fail constantly

**Common causes:**
- The customer's wording isn't in the keyword list
- The intent is ambiguous (e.g., "make it brighter" — brightness or exposure?)
- The customer is in a different host app than expected (PPRO vs AEFT have different effects)

### 2. Effect / preset application bugs

The command is parsed correctly but the effect doesn't get applied correctly.

**Where to look:**
- `terminal/panel/PremiereActions.js` — Premiere-specific apply functions
- `terminal/panel/AEActions.js` — After Effects-specific apply functions
- `terminal/panel/terminal.jsx` — the host-side functions like `applyEffectToSelectedLayersOnAE()`

**Note:** PremiereActions.js (1,995 lines) and AEActions.js (2,226 lines) have a lot of duplicated code — fixes often need to be applied to both.

### 3. Global hotkey bugs

The customer presses Cmd+1 and nothing happens.

**Where to look:**
- **First check:** Does the customer have the **macOS Accessibility permission** granted? `KeyboardListener.m` requires it via `CGEventTapCreate`. Without it, the listener silently fails. Send the customer to **System Preferences → Privacy & Security → Accessibility** and add Premiere/After Effects to the allowed list.
- `terminal/worker/index.html` lines 636-687 — the listener spawn logic
- `terminal/worker/index.html` lines 71-265 — the platform-specific key code mappings (150+ hardcoded mappings, very brittle)

**The accessibility permission issue is the #1 reason new customers say "it's not working."** This will be Claud's most common Terminal ticket.

### 4. License activation flow bugs

**These go straight to escalation.** Don't touch.

### 5. Worker / panel communication bugs

The listener detects the hotkey but the panel doesn't open.

**Where to look:**
- `terminal/worker/index.html` — does the `requestOpenExtension()` call fire?
- Open Chrome DevTools on the worker debug port (8196 for PPRO, 8197 for AEFT) to see worker errors
- Open Chrome DevTools on the panel debug port (8096 for PPRO, 8097 for AEFT) to see panel errors

### 6. macOS Gatekeeper / notarization issues

The customer installs Terminal on a new Mac and macOS refuses to run the native listener.

**Symptoms:** "terminal-listener cannot be opened because the developer cannot be verified" or the hotkey just doesn't work despite Accessibility being granted.

**Cause:** The native listener is ad-hoc signed only, not Apple-notarized.

**Workaround for the customer:** System Preferences → Privacy & Security → scroll to the bottom → "Allow Anyway" for terminal-listener. **Do this BEFORE granting Accessibility permission.**

**Real fix:** Proper Developer ID code signing + Apple notarization. This is escalation territory — don't attempt.

---

## Adobe API Reference

When debugging code that calls into Premiere or After Effects:

```
~/Plugins/_shared/api-reference/PR.md       # Premiere Pro ExtendScript API
~/Plugins/_shared/api-reference/AE.md       # After Effects ExtendScript API
~/Plugins/_shared/api-reference/CEP.md      # CEP framework, CSInterface.js, Vulcan.js
```

**Terminal is unique among the 4 plugins because it supports both Premiere AND After Effects.** When debugging, first identify which host the customer is using (the Sentry data or the customer's email should tell you), then grep the relevant reference file. Run `/lookup <api-name>`.

---

## Diagnostic Tools

### Adobe CEP Remote Debugging

The `.debug` file already exists in this plugin and pre-configures debug ports:
- **Premiere Pro panel:** `http://localhost:8096`
- **Premiere Pro worker:** `http://localhost:8196`
- **After Effects panel:** `http://localhost:8097`
- **After Effects worker:** `http://localhost:8197`

**One-time setup (if not already done):**
- Mac: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`
- Windows: `regedit` → `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` → `PlayerDebugMode = 1`

**Per-session usage:**
1. Launch Premiere Pro (or AE)
2. Open Chrome → navigate to the appropriate port above
3. Click the entry → full Chrome DevTools opens
4. Inspect both panel AND worker if the bug involves the hotkey-triggered panel-opening flow

### ExtendScript debugging

For bugs inside `terminal.jsx`, use VS Code with the **ExtendScript Debugger** extension. Same workflow as Surveillance.

### Native listener stdout

The native listener writes JSON to stdout for every keypress. To see what it's emitting:
- Mac: `~/Library/Application Support/Adobe/CEP/extensions/com.example.terminal.worker/terminal-listener` (run from terminal to see output)
- Windows: similar path with `terminal-listener.exe`

If the listener is producing JSON correctly but the panel isn't opening, the bug is in the worker's keypress matching logic.

### Sentry telemetry

Run `/sentry-check <customer-email>`. Check the dashboard for any errors tagged with this customer's email or license ID.

---

## Hard Rules (no exceptions)

1. **NEVER touch the OFF-LIMITS files listed above.**
2. **NEVER remove the `if(!terminal.activate)` license gates** in any action function.
3. **NEVER modify `KeyboardListener.m` or `KeyboardListenerWin.cpp`** — escalate any native listener bugs.
4. **NEVER attempt to re-sign or notarize** the native listener — escalate.
5. **One-customer beta is mandatory** for every source change.
6. **2-hour budget** then escalate.
7. **Sentry first** — `/sentry-check`.
8. **Run `/learn` at ticket close.**

---

## Known Tech Debt / Gotchas

1. **Version locked at 0.0.1** — never updated. Set in `manifest.xml:5,10,11`.
2. **Extension ID is `com.example.terminal.*`** — generic placeholder, never updated to `com.tinytapes.terminal.*`. Don't change this without understanding the implications (any change requires re-signing AND re-installation on every customer machine).
3. **Hardcoded WooCommerce API credentials** in `terminal.jsx:66-75` — same issue as FastFX and Surveillance.
4. **Build target name mismatch** — `Makefile:4` says `TARGET = fxlauncher-listener` but the binary is named `terminal-listener`. Don't fix this without understanding the install path.
5. **No code signing entitlements file** for the native listener — required for proper macOS distribution.
6. **No Apple notarization** — required for macOS Big Sur+ distribution.
7. **Platform-specific key code mappings** in `worker/index.html:71-265` are hardcoded for 150+ keys. Brittle to OS updates.
8. **PremiereActions.js and AEActions.js have heavy code duplication** — fixes often need to be applied to both.
9. **ML model files (~5MB) are included but unused** — `AICommandProcessor.js` uses keyword matching. The model files could be removed to reduce installer size, but don't do that without verifying there's no hidden code path that loads them.
10. **terminal.jsx is partially minified** in some versions — readability suffers.
11. **No persistent log file** — only Adobe CEP console output via the debug ports.
12. **Hardcoded paths to "EditLab"** in `terminal.jsx:23,34,48` — references `Folder.userData/EditLab/plugins/dt.txt`. EditLab appears to be a separate product the listener was originally written for. Leftover from copy-paste — the actual file searched for is the same XOR-encrypted format used elsewhere.
13. **License file format is fragile** — `terminal.jsx:144-150` assumes exactly 3 lines and crashes if the email line is missing.
14. **No restart logic for the native listener** — if it crashes, the worker just logs to stderr and continues silently. Cmd+1 stops working until the user restarts Premiere/AE.

---

## Escalation Tripwires (auto-escalate immediately)

Run `/escalate` and STOP if any of these apply:

- The bug touches any OFF-LIMITS file
- The bug involves license activation, validation, or the `tinytapes.com` API
- The bug is in `KeyboardListener.m`, `KeyboardListenerWin.cpp`, or anything related to the native keyboard hook
- The bug requires re-signing the native listener or the .zxp
- The bug requires notarization changes
- The bug is in the CEP `manifest.xml` extension IDs
- The customer's macOS version refuses to run the listener due to Gatekeeper (escalate so we can prioritize proper notarization)
- The bug requires more than ~30 lines changed across more than 3 files
