# Extract UUID from metadata.json
NAME := $(shell grep -Po 'uuid.* "\K[^"]*' metadata.json)

# Define the bundle name for packing
BUNDLE = $(NAME).shell-extension.zip

# Default target
default:

# Target to pack the extension
pack:
	gnome-extensions pack -f .

# Target to install the packed extension
install: pack
	gnome-extensions install -f $(BUNDLE)

# Target to uninstall the extension
uninstall:
	gnome-extensions uninstall $(NAME)

# Target to enable the extension
enable:
	gnome-extensions enable $(NAME)

# Target to disable the extension
disable:
	gnome-extensions disable $(NAME)
