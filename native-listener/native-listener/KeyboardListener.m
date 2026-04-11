#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <Carbon/Carbon.h>
#import <ApplicationServices/ApplicationServices.h>

// Global event callback
CGEventRef eventCallback(CGEventTapProxy proxy, CGEventType type, CGEventRef event, void *refcon) {
    if (type != kCGEventKeyDown) {
        return event;
    }
    
    // Get key code and modifiers
    CGKeyCode keyCode = (CGKeyCode)CGEventGetIntegerValueField(event, kCGKeyboardEventKeycode);
    CGEventFlags flags = CGEventGetFlags(event);
    
    // Extract modifier states
    bool shiftPressed = (flags & kCGEventFlagMaskShift) != 0;
    bool ctrlPressed = (flags & kCGEventFlagMaskControl) != 0;
    bool altPressed = (flags & kCGEventFlagMaskAlternate) != 0;
    bool metaPressed = (flags & kCGEventFlagMaskCommand) != 0;
    
    // Output JSON to stdout - using hex format with leading zeros for key code
    printf("{\"code\":\"%02X\",\"shift\":%s,\"ctrl\":%s,\"alt\":%s,\"meta\":%s}\n", 
           keyCode,
           shiftPressed ? "true" : "false",
           ctrlPressed ? "true" : "false",
           altPressed ? "true" : "false",
           metaPressed ? "true" : "false");
    
    // Flush stdout to ensure immediate output
    fflush(stdout);
    
    // Pass the event through (don't block it)
    return event;
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // Create an event tap to monitor keyboard events
        CFMachPortRef eventTap = CGEventTapCreate(
            kCGSessionEventTap,          // Tap at session level (user login)
            kCGHeadInsertEventTap,       // Insert at beginning of event chain
            kCGEventTapOptionDefault,    // Default options
            CGEventMaskBit(kCGEventKeyDown), // Monitor key down events
            eventCallback,               // Callback function
            NULL                         // User data (none)
        );
        
        // Check if event tap was created successfully
        if (!eventTap) {
            NSLog(@"Failed to create event tap. This may be due to lack of accessibility permissions.");
            fprintf(stderr, "ERROR: Failed to create event tap. Make sure the application has accessibility permissions.\n");
            return 1;
        }
        
        // Create a run loop source
        CFRunLoopSourceRef runLoopSource = CFMachPortCreateRunLoopSource(
            kCFAllocatorDefault,
            eventTap,
            0
        );
        
        // Add the source to the current run loop
        CFRunLoopAddSource(
            CFRunLoopGetCurrent(),
            runLoopSource,
            kCFRunLoopCommonModes
        );
        
        // Enable the event tap
        CGEventTapEnable(eventTap, true);
        
        // Print a message to stderr (won't interfere with our stdout JSON)
        fprintf(stderr, "Keyboard listener started. Press Ctrl+C to quit.\n");
        
        // Run the run loop
        CFRunLoopRun();
        
        // Clean up (this will never be reached unless run loop exits)
        CFRelease(runLoopSource);
        CFRelease(eventTap);
    }
    return 0;
} 