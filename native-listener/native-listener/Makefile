CC = clang
CFLAGS = -Wall -framework Foundation -framework AppKit -framework Carbon -framework ApplicationServices
TARGET = fxlauncher-listener
SRC = KeyboardListener.m

.PHONY: all clean universal sign

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $<

# Create a universal binary for both Intel and Apple Silicon
universal: $(SRC)
	$(CC) $(CFLAGS) -arch x86_64 -arch arm64 -o $(TARGET) $<

# Adhoc signing (for development use only)
sign: universal
	codesign --force --deep --sign - $(TARGET)

# Clean up
clean:
	rm -f $(TARGET) 