#include <windows.h>
#include <iostream>
#include <iomanip>
#include <string>

// Global hook handle
HHOOK keyboardHook = NULL;

// Hook callback function
LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    // Only process keydown events
    if (nCode >= 0 && wParam == WM_KEYDOWN) {
        KBDLLHOOKSTRUCT* kbStruct = (KBDLLHOOKSTRUCT*)lParam;
        
        // Get virtual key code
        DWORD vkCode = kbStruct->vkCode;
        
        // Check modifier keys state
        bool shiftPressed = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;
        bool ctrlPressed = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
        bool altPressed = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
        bool metaPressed = (GetAsyncKeyState(VK_LWIN) & 0x8000) != 0 || 
                          (GetAsyncKeyState(VK_RWIN) & 0x8000) != 0;
        
        // Output JSON to stdout (matching the macOS format)
        std::cout << "{\"code\":\"" << std::hex << std::setw(2) << std::setfill('0') << vkCode
                 << "\",\"shift\":" << (shiftPressed ? "true" : "false")
                 << ",\"ctrl\":" << (ctrlPressed ? "true" : "false")
                 << ",\"alt\":" << (altPressed ? "true" : "false")
                 << ",\"meta\":" << (metaPressed ? "true" : "false") << "}" << std::endl;
    }
    
    // Pass to the next hook in the chain
    return CallNextHookEx(keyboardHook, nCode, wParam, lParam);
}

int main() {
    // Set up the keyboard hook
    keyboardHook = SetWindowsHookEx(
        WH_KEYBOARD_LL,    // Low-level keyboard hook
        KeyboardProc,      // Hook procedure
        NULL,              // No module instance (current process)
        0                  // Hook for all threads
    );
    
    if (!keyboardHook) {
        std::cerr << "ERROR: Failed to create keyboard hook. Error code: " << GetLastError() << std::endl;
        return 1;
    }
    
    std::cerr << "Keyboard listener started. Press Ctrl+C to quit." << std::endl;
    
    // Message loop to keep the hook active
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    // Clean up
    UnhookWindowsHookEx(keyboardHook);
    return 0;
} 