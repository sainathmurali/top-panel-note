# Top Panel Note Extension

<p align="center">
  <a href="https://github.com/sainathmurali/top-panel-note/stargazers">
    <img src="https://img.shields.io/github/stars/sainathmurali/top-panel-note?style=flat-square&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/sainathmurali/top-panel-note/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/sainathmurali/top-panel-note?style=flat-square" alt="License">
  </a>
  <img src="https://img.shields.io/badge/GNOME_Shell-45%2B-4A86CF?style=flat-square&logo=gnome&logoColor=white" alt="GNOME Shell">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status">
</p>

> A simple GNOME Shell extension that lets you quickly add, view, and access a static note directly from your top panel.

## ✨ Features

- Quickly add and edit notes from the GNOME Shell top panel.
- Keep reminders, lookup tables, commands, or other useful snippets easily accessible.
- Resize the note window to suit your content.
- Persistent note storage between sessions.

## Prerequisites

- GNOME Shell **45 or later**

## Installation

### From GNOME Extensions

1. Visit the [Top Panel Note Extension page](https://extensions.gnome.org/extension/7120/top-panel-note/).
2. Turn on the extension to install and enable it.

## Usage

### ➕ Adding a Note

1. Click the extension icon in the top panel.
2. Enter your note in the window that appears.
3. Your note will be available directly from the top panel.

### ✏️ Editing a Note

1. Click the extension icon.
2. Edit your existing note.

### ↔️ Resizing the Window

Click and drag the empty space to the right of the scrollbar to resize the note window.

### 💡 Formatting Tip

If you want more control over the formatting of your note, you can directly edit:

```text
~/.cache/top_panel_note_cache.txt
````

After editing the file, restart GNOME Shell for the changes to take effect.

For X11 sessions:

```text
Alt + F2 → r → Enter
```

> **Note:** This restart method does not work on Wayland sessions. Logging out and back in, or restarting the extension, may be required.

## ☕ Support the Project

If you find **Top Panel Note** useful, consider supporting its development:

<p>
  <a href="https://buymeacoffee.com/bionichuman">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support%20development-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee">
  </a>
</p>

Your support helps maintain the extension and fund future improvements.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue, suggest a feature, or submit a pull request.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

* The GNOME Shell community for its documentation and support.
* The GTK Icon Library for the icons used in this extension.

